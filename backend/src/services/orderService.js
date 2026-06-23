const Order = require('../models/Order');
const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const walletService = require('./walletService');
const CourseRestrict = require('../models/CourseRestrict');

const orderService = {
    async getStudentOrders(userId, { search, status, page = 1, limit = 5 } = {}) {
        const query = { user: userId };

        if (status && ['pending', 'completed', 'failed'].includes(status)) {
            query.paymentStatus = status;
        }

        if (search && search.trim()) {
            query.$or = [
                { orderId: { $regex: search.trim(), $options: 'i' } },
                { 'courses.courseTitle': { $regex: search.trim(), $options: 'i' } }
            ];
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 5));
        const skip = (pageNum - 1) * limitNum;

        const [orders, totalFiltered] = await Promise.all([
            Order.find(query)
                .populate('courses.course', 'title thumbnail category')
                .populate('courses.tutor', 'name')
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(limitNum),
            Order.countDocuments(query)
        ]);

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum
        };

        return { orders, pagination };
    },

    async getStudentOrderById(userId, orderId) {
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('user', 'name email phone')
            .populate('courses.course', 'title thumbnail category description')
            .populate('courses.tutor', 'name email')
            .populate('couponApplied', 'code discountType discountValue');

        if (!order) {
            throw new Error('Order not found');
        }

        return order;
    },

    // Admin
    async getAllOrders({ search, status, tutorId, studentId, dateFrom, dateTo, sort = '-orderDate', page = 1, limit = 5 } = {}) {
        const query = {};

        if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
            query.paymentStatus = status;
        }

        if (tutorId) {
            query['courses.tutor'] = tutorId;
        }

        if (studentId) {
            query.user = studentId;
        }

        if (dateFrom || dateTo) {
            query.orderDate = {};
            if (dateFrom) query.orderDate.$gte = new Date(dateFrom);
            if (dateTo) query.orderDate.$lte = new Date(dateTo);
        }

        if (search && search.trim()) {
            query.$or = [
                { orderId: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 5));
        const skip = (pageNum - 1) * limitNum;

        let sortOption = {};
        if (sort.startsWith('-')) {
            sortOption[sort.substring(1)] = -1;
        } else {
            sortOption[sort] = 1;
        }

        const [orders, totalFiltered, summaryAgg] = await Promise.all([
            Order.find(query)
                .populate('user', 'name email phone')
                .populate('courses.course', 'title thumbnail category')
                .populate('courses.tutor', 'name')
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum),
            Order.countDocuments(query),
            Order.aggregate([
                {
                    $group: {
                        _id: '$paymentStatus',
                        count: { $sum: 1 },
                        revenue: { $sum: '$finalAmount' }
                    }
                }
            ])
        ]);

        const summaryMap = { completed: 0, pending: 0, failed: 0, refunded: 0 };
        let totalCount = 0;
        let totalRevenue = 0;
        for (const row of summaryAgg) {
            summaryMap[row._id] = row.count;
            totalCount += row.count;
            if (row._id === 'completed') totalRevenue = row.revenue;
        }

        const summary = {
            total: totalCount,
            completed: summaryMap.completed,
            pending: summaryMap.pending,
            failed: summaryMap.failed,
            totalRevenue
        };

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum
        };

        return { orders, summary, pagination };
    },

    async getOrderById(orderId) {
        const order = await Order.findById(orderId)
            .populate('user', 'name email phone')
            .populate('courses.course', 'title thumbnail category description')
            .populate('courses.tutor', 'name email')
            .populate('couponApplied', 'code discountType discountValue');

        if (!order) {
            throw new Error('Order not found');
        }

        return order;
    },

    async cancelCourse(userId, orderId) {

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) throw new Error('Order not found');

        if (order.paymentStatus === 'refunded') {
            return { message: 'Order already cancelled and refunded', refundAmount: order.finalAmount };
        }

        if (order.paymentStatus !== 'completed') {
            throw new Error('Order is not eligible for cancellation');
        }

        const daysSincePurchase = (Date.now() - new Date(order.orderDate)) / (1000 * 60 * 60 * 24);
        if (daysSincePurchase > 3) throw new Error('Refund window has expired (3 days from purchase)');

        const student = await User.findById(userId).select('studentProfile.enrolledCourses');
        
        for (const courseItem of order.courses) {
            const totalLessons = await Lesson.countDocuments({ course: courseItem.course });
            if (totalLessons === 0) continue;

            const enrollment = student.studentProfile.enrolledCourses.find(
                e => e.courseId.toString() === courseItem.course.toString()
            );
            const completedCount = enrollment?.completedLessons?.length || 0;
            const progressRatio = completedCount / totalLessons;

            if (progressRatio > 0.3) {
                throw new Error(
                    `Refund not eligible: you have completed more than 30% of "${courseItem.courseTitle}"`
                );
            }
        }

        for (const courseItem of order.courses) {
            await walletService.reverseEarning(courseItem.tutor, order._id, courseItem.tutorShare);
        }

        await walletService.reverseAdminEscrow(order._id, order.finalAmount);

        await walletService.refundToStudent(userId, order.finalAmount, order.orderId);

        order.paymentStatus = 'refunded';
        await order.save();

        const courseIds = order.courses.map(c => c.course);
        await Course.updateMany(
            { _id: { $in: courseIds } },
            { $pull: { studentsEnrolled: userId } }
        );
        await User.findByIdAndUpdate(userId, {
            $pull: { 'studentProfile.enrolledCourses': { courseId: { $in: courseIds } } }
        });

        let latestRestriction = await CourseRestrict.findOne({ userId, courseId: { $in: courseIds } });
        for (const cId of courseIds) {
            let restriction = await CourseRestrict.findOne({ userId, courseId: cId });
            if (!restriction) {
                restriction = await CourseRestrict.create({
                    userId,
                    courseId: cId,
                    refundCount: 1
                });
            } else {
                restriction.refundCount++;
                if (restriction.refundCount >= 3) {
                    restriction.blocked = true;
                    restriction.blockedAt = new Date();
                }
                await restriction.save();
            }
        }

        return { message: 'Course cancelled and refund credited to your wallet', refundAmount: order.finalAmount };
    },

};


module.exports = orderService;




