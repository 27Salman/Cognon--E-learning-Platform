const Course = require('../models/Course');
const Category = require('../models/Category');
const offerService = require('./offerService');
const { COURSE_STATUS } = require('../config/constants');

const catalogService = {

    async getCourses ({
            search,
            category,
            minPrice,
            maxPrice,
            level,
            language,
            rating,
            sort = '-createdAt',
            page = 1,
            limit = 5
        } = {}) {

        const query = { status: COURSE_STATUS.PUBLISHED };

        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        if (category) {
            query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
            query.level = level;
        }

        if (language) {
            query.language = { $regex: language, $options: 'i' };
        }

        if (rating) {
            query.rating = { $gte: parseFloat(rating) };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 5));
        const skip = ( pageNum - 1 ) * limitNum;

        const sortMap = {
            '-createdAt': { createdAt: -1 },
            'price_asc': { price: 1 },
            'price_desc': { price: -1 },
            '-rating': { rating: -1 },
            '-studentsEnrolled': { enrolledCount: -1 }
        };
        const sortOption = sortMap[sort] || { createdAt: -1 };

        const [courses, totalFiltered] = new Promise.all([
            Course.find(query)
                .populate('tutor', 'name profileImage')
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum),
            Course.countDocuments(query)
        ])

        const coursesWithOffers = await Promise.all(
            courses.map(async (course) => {
                const bestOffer = await offerService.getBestOfferForCourse(course._id);
                const courseObj = course.toJSON();
                if (bestOffer) {
                    const discountedPrice = Math.round(
                        course.price - (course.price * bestOffer.discountPercentage) / 100
                    );
                    courseObj.offer = {
                        title: bestOffer.title,
                        discountPercentage: bestOffer.discountPercentage,
                        discountedPrice
                    };
                }
                return courseObj;
            })
        );

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil( totalFiltered / limitNum ),
            totalFiltered,
            limit: limitNum,
        }

        return { courses: coursesWithOffers, pagination }

    },

    async getCourseDetails(courseId, userId = null) {
        const course = await Course.findOne({
            _id: courseId,
            status: COURSE_STATUS.PUBLISHED
        }).populate('tutor', 'name profileImage bio');

        if (!course) {
            throw new Error('Course not found');
        }

        const bestOffer = await offerService.getBestOfferForCourse(courseId);
        const courseObj = course.toJSON();

        if (bestOffer) {
            const discountedPrice = Math.round(
                course.price - (course.price * bestOffer.discountPercentage) / 100
            );
            courseObj.offer = {
                title: bestOffer.title,
                discountPercentage: bestOffer.discountPercentage,
                discountedPrice
            };
        }

        if (userId) {
            courseObj.isEnrolled = course.studentsEnrolled.includes(userId);
        }

        return courseObj;
    },

    async getFilterOptions() {
        const [categories, languages] = await Promise.all([
            Category.find({ isActive: true }).select('name').sort({ name: 1 }),
            Course.distinct('language', { status: COURSE_STATUS.PUBLISHED })
        ]);

        return {
            categories: categories.map(c => c.name),
            languages: languages.filter(Boolean),
            levels: ['beginner', 'intermediate', 'advanced'],
            sortOptions: [
                { value: '-createdAt', label: 'Newest First' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
                { value: '-rating', label: 'Highest Rated' },
                { value: '-studentsEnrolled', label: 'Most Popular' }
            ]
        };
    }
};

module.exports = catalogService;






