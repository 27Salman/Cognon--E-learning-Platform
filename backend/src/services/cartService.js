const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Course = require('../models/Course');
const Order = require('../models/Order');
const offerService = require('./offerService');
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
            throw new Error('Course is already in your cart');
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
            select: 'title description price thumbnail category tutor status level rating studentsEnrolled',
            populate: { path: 'tutor', select: 'name' }
        });

        if (!cart || cart.items.length === 0) {
            return {
                items: [],
                subtotal: 0,
                totalItems: 0
            };
        }

        const validItems = [];
        let subtotal = 0;

        for (const item of cart.items) {
            if (!item.course || item.course.status !== COURSE_STATUS.PUBLISHED) {
                continue;
            }

            const bestOffer = await offerService.getBestOfferForCourse(item.course._id);
            let finalPrice = item.course.price;
            let discountAmount = 0;
            let offerInfo = null;

            if (bestOffer) {
                discountAmount = (item.course.price * bestOffer.discountPercentage) / 100;
                finalPrice = item.course.price - discountAmount;
                offerInfo = {
                    title: bestOffer.title,
                    discountPercentage: bestOffer.discountPercentage
                };
            }

            validItems.push({
                _id: item._id,
                course: item.course,
                originalPrice: item.course.price,
                discountAmount: Math.round(discountAmount),
                finalPrice: Math.round(finalPrice),
                offer: offerInfo,
                addedAt: item.addedAt
            });

            subtotal += finalPrice;
        }

        return {
            items: validItems,
            subtotal: Math.round(subtotal),
            totalItems: validItems.length
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





