const Wishlist = require('../models/Wishlist');
const Course = require('../models/Course');
const { COURSE_STATUS } = require('../config/constants');

const wishlistService = {

    async addToWishlist(userId, courseId){
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

        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, courses: [] });
        }

        if (wishlist.courses.includes(courseId)) {
            throw new Error('Course is already in your wishlist');
        }

        wishlist.courses.push(courseId);
        await wishlist.save();

        return wishlist.populate('courses');
    },

    async removeFromWishlist(userId, courseId) {
        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            throw new Error('Wishlist not found');
        }

        const courseIndex = wishlist.courses.indexOf(courseId);
        if (courseIndex === -1) {
            throw new Error('Course not found in wishlist');
        }

        wishlist.courses.splice(courseIndex, 1);
        await wishlist.save();

        return { message: 'Course removed from wishlist' };
    },

    async getWishlist(userId, { page = 1, limit = 5 } = {}) {
        let wishlist = await Wishlist.findOne({ user: userId })
            .populate({
                path: 'courses',
                select: 'title description price thumbnail category tutor status studentsEnrolled rating offerPercentage',
                populate: { path: 'tutor', select: 'name' }
            });

        if (!wishlist) {
            return { courses: [], totalItems: 0, pagination: { currentPage: 1, totalPages: 1, totalFiltered: 0, limit: 5 } };
        }

        const availableCourses = wishlist.courses.filter(
            course => course && course.status === COURSE_STATUS.PUBLISHED
        );

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 5));
        const total = availableCourses.length;
        const paginated = availableCourses.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        return {
            courses: paginated,
            totalItems: total,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalFiltered: total,
                limit: limitNum
            }
        };
    },

    async isInWishlist(userId, courseId) {
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) return false;
        return wishlist.courses.includes(courseId);
    }

}

module.exports = wishlistService;


