const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Course = require('../models/Course');
const Order = require('../models/Order');
const { COURSE_STATUS } = require('../config/constants');

const cartService = {
    async addToCart(userId, courseId){
        const course = await Course.findById(courseId).populate('tutor', 'name');
        if (!course) {
            throw new Error('Course not found');
        }
        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('This course is not available');
        }

        if (course.studentsEnrolled.includes(userId)) {
            throw new Error('You are already enrolled in this course');
        }

        const existingOrder = await Order.findOne({
            user: userId,
            'courses.course': courseId,
            paymentStatus: 'completed'
        });
        if (existingOrder) {
            throw new Error('You have already purchased this course');
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const alreadyInCart = cart.items.some(
            item => item.course.toString() === courseId.toString()
        );
        if (alreadyInCart) {
            const error = new Error('Course is already in your cart');
            error.statusCode = 400;
            throw error;
        }

        cart.items.push({
            course: courseId,
            price: course.price,
            addedAt: new Date()
        });

        await cart.save();

        await Wishlist.findOneAndUpdate(
            { user: userId },
            { $pull: { courses: courseId } }
        );

        return await cartService.getCart(userId);
    },

    async removeFromCart(userId, courseId) {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            throw new Error('Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            item => item.course.toString() === courseId.toString()
        );

        if (itemIndex === -1) {
            throw new Error('Course not found in cart');
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        return await cartService.getCart(userId);
    },

    async getCart(userId) {
        const cart = await Cart.findOne({ user: userId }).populate({
            path: 'items.course',
            select: 'title description price thumbnail category tutor status rating studentsEnrolled offerPercentage',
            populate: { path: 'tutor', select: 'name' }
        });

        if (!cart || cart.items.length === 0) {
            return { items: [], subtotal: 0, totalItems: 0, hasUnavailable: false };
        }

        const round2 = (n) => Math.round(n * 100) / 100;
        const allItems = [];
        let subtotal = 0;

        for (const item of cart.items) {
            if (!item.course) continue;

            const isAvailable = item.course.status === COURSE_STATUS.PUBLISHED;

            const livePrice = item.course.price;
            const offerPct = item.course.offerPercentage || 0;
            let discountAmount = 0;
            let finalPrice = livePrice;
            let offerInfo = null;

            if (offerPct > 0) {
                discountAmount = round2((livePrice * offerPct) / 100);
                finalPrice = round2(livePrice - discountAmount);
                offerInfo = { discountPercentage: offerPct };
            }

            allItems.push({
                _id: item._id,
                course: item.course,
                originalPrice: livePrice,
                discountAmount: round2(discountAmount),
                finalPrice: round2(finalPrice),
                offer: offerInfo,
                addedAt: item.addedAt,
                isAvailable   
            });

            if (isAvailable) {
                subtotal += finalPrice;
            }
        }

        const hasUnavailable = allItems.some(item => !item.isAvailable);

        return {
            items: allItems,
            subtotal: round2(subtotal),
            totalItems: allItems.filter(i => i.isAvailable).length,
            hasUnavailable
        };
    },


    async clearCart(userId) {
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );
        return { message: 'Cart cleared successfully' };
    }
};

module.exports = cartService;





