const Course = require('../models/Course');
const Category = require('../models/Category');
const { COURSE_STATUS } = require('../config/constants');

const catalogService = {

    async getCourses({
        search,
        category,
        minPrice,
        maxPrice,
        language,
        rating,
        sort = '-createdAt',
        page = 1,
        limit = 12
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
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
        const skip = (pageNum - 1) * limitNum;

        const sortMap = {
            '-createdAt': { createdAt: -1 },
            'price_asc': { price: 1 },
            'price_desc': { price: -1 },
            '-rating': { rating: -1 },
            '-studentsEnrolled': { enrolledCount: -1 }
        };
        const sortOption = sortMap[sort] || { createdAt: -1 };

        const [courses, totalFiltered] = await Promise.all([
            Course.find(query)
                .populate('tutor', 'name profileImage')
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum),
            Course.countDocuments(query)
        ]);

        const coursesWithOffers = courses.map((course) => {
            const courseObj = course.toJSON();
            delete courseObj.studentsEnrolled;
            if (course.offerPercentage > 0) {
                const discountedPrice = Math.round(
                    course.price - (course.price * course.offerPercentage) / 100
                );
                courseObj.offer = {
                    discountPercentage: course.offerPercentage,
                    discountedPrice
                };
            }
            return courseObj;
        });

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum
        };

        return { courses: coursesWithOffers, pagination };
    },

    async getCourseDetails(courseId, userId = null) {
        const Lesson = require('../models/Lesson');

        const course = await Course.findById(courseId)
            .populate('tutor', 'name email profileImage tutorProfile');

        if (!course) {
            throw new Error('Course not found');
        }

        const isEnrolled = userId && course.studentsEnrolled.some(id => id.toString() === userId.toString());
        const isOwner = userId && course.tutor._id.toString() === userId.toString();

        if (course.status !== COURSE_STATUS.PUBLISHED && !isEnrolled && !isOwner) {
            throw new Error('Course not found');
        }

        const lessons = await Lesson.find({ course: courseId })
            .sort({ order: 1, createdAt: 1 });

        const courseObj = course.toJSON();

        // Capture count before deleting the array
        courseObj.enrolledCount = course.studentsEnrolled?.length || 0;
        delete courseObj.studentsEnrolled;

        // Compute unique students across all tutor's courses (fresh, not stale DB value)
        const tutorCourses = await Course.find({ tutor: course.tutor._id }).select('studentsEnrolled');
        const uniqueStudentIds = new Set();
        tutorCourses.forEach(c => {
            (c.studentsEnrolled || []).forEach(id => uniqueStudentIds.add(id.toString()));
        });
        courseObj.tutor = {
            ...courseObj.tutor,
            totalCourses: tutorCourses.length,
            totalStudents: uniqueStudentIds.size,
        };

        courseObj.lessons = lessons.map(l => {
            const lesson = l.toJSON();
            if (!isEnrolled && !isOwner) {
                delete lesson.videoUrl;
                delete lesson.pdfNotes;
                delete lesson.pdfNotesURL;
            }
            return lesson;
        });

        // Compute totalDuration from lessons
        courseObj.totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

        if (course.offerPercentage > 0) {
            const discountedPrice = Math.round(
                course.price - (course.price * course.offerPercentage) / 100
            );
            courseObj.offer = {
                discountPercentage: course.offerPercentage,
                discountedPrice
            };
        }

        if (userId) {
            courseObj.isEnrolled = isEnrolled;
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
