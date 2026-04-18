const Razorpay = require('razorpay');
const crypto = require('crypto');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Course = require('../models/Course');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const cartService = require('./cartService');
const couponService = require('./couponService');
const offerService = require('./offerService');
const { PLATFORM_COMMISSION, COURSE_STATUS } = require('../config/constants');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const checkoutService = {

    async calculatePrice(userId, couponCode) {
        const cartData = await cartService.getCart(userId);

        if (cartData.items.length === 0) {
            throw new Error('Your cart is empty');
        }

        let subtotal = cartData.subtotal;
        let couponDiscount = 0;
        let couponInfo = null;

        if (couponCode) {
            const courseIds = cartData.items.map(item => item.course._id);
            const couponResult = await couponService.validateCoupon(
                couponCode,
                userId,
                subtotal,
                courseIds
            );
            couponDiscount = couponResult.discount;
            couponInfo = {
                code: couponResult.coupon.code,
                discountType: couponResult.coupon.discountType,
                discountValue: couponResult.coupon.discountValue,
                discount: couponDiscount
            };
        }

        const finalAmount = Math.max(0, subtotal - couponDiscount);

        return {
            items: cartData.items,
            subtotal,
            couponDiscount: Math.round(couponDiscount),
            coupon: couponInfo,
            finalAmount: Math.round(finalAmount),
            totalItems: cartData.totalItems
        };

    },

    async createRazorpayOrder(userId, couponCode) {
        const priceData = await checkoutService.calculatePrice(userId, couponCode);

        if (priceData.finalAmount === 0) {
            throw new Error('Order amount cannot be zero');
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: priceData.finalAmount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                couponCode: couponCode || ''
            }
        });

        return {
            razorpayOrderId: razorpayOrder.id,
            amount: priceData.finalAmount,
            currency: 'INR',
            priceBreakdown: priceData,
            keyId: process.env.RAZORPAY_KEY_ID
        };

    },

    async verifyPaymentAndCreateOrder(userId, paymentData) {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            couponCode
        } = paymentData;

        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            throw new Error('Payment verification failed. Invalid signature.');
        }

        const priceData = await checkoutService.calculatePrice(userId, couponCode);

        if (priceData.items.length === 0) {
            throw new Error('Cart is empty');
        }

        const orderCourses = priceData.items.map(item => {
            const tutorShare = Math.round(item.finalPrice * PLATFORM_COMMISSION.TUTOR_SHARE);
            const platformShare = Math.round(item.finalPrice * PLATFORM_COMMISSION.RATE);

            return {
                course: item.course._id,
                tutor: item.course.tutor._id,
                courseTitle: item.course.title,
                originalPrice: item.originalPrice,
                discountedPrice: item.finalPrice,
                tutorShare,
                platformShare
            };
        });

        const order = new Order({
            user: userId,
            courses: orderCourses,
            subtotal: priceData.subtotal,
            discount: priceData.couponDiscount,
            couponCode: couponCode || null,
            finalAmount: priceData.finalAmount,
            paymentMethod: 'razorpay',
            paymentStatus: 'completed',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            orderDate: new Date()
        });

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
            if (coupon) {
                order.couponApplied = coupon._id;

                coupon.usageCount += 1;
                const userUsage = coupon.usedBy.find(
                    u => u.user.toString() === userId.toString()
                );
                if (userUsage) {
                    userUsage.usedCount += 1;
                    userUsage.lastUsedAt = new Date();
                } else {
                    coupon.usedBy.push({
                        user: userId,
                        usedCount: 1,
                        lastUsedAt: new Date()
                    });
                }
                await coupon.save();
            }
        }

        await order.save();

        const courseIds = priceData.items.map(item => item.course._id);
        await Course.updateMany(
            { _id: { $in: courseIds } },
            { $addToSet: { studentsEnrolled: userId } }
        );

        for (const item of priceData.items) {
            await Course.findByIdAndUpdate(item.course._id, {
                $inc: { revenue: item.finalPrice }
            });
        }

        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );

        return await Order.findById(order._id)
            .populate('user', 'name email phone')
            .populate('courses.course', 'title thumbnail')
            .populate('courses.tutor', 'name email');
    },

     async handleWebhook(body, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(body))
            .digest('hex');

        if (expectedSignature !== signature) {
            throw new Error('Invalid webhook signature');
        }

        const event = body.event;
        const payload = body.payload;

        if (event === 'payment.failed') {
            const razorpayOrderId = payload.payment.entity.order_id;
            await Order.findOneAndUpdate(
                { razorpayOrderId },
                { paymentStatus: 'failed' }
            );
        }

        return { received: true };
    }

}

module.exports = checkoutService;



