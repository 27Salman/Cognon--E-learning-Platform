const Order = require('../models/Order');

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

        const [orders, totalFiltered, allOrders] = await Promise.all([
            Order.find(query)
                .populate('user', 'name email phone')
                .populate('courses.course', 'title thumbnail category')
                .populate('courses.tutor', 'name')
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum),
            Order.countDocuments(query),
            Order.find({}).select('paymentStatus finalAmount')
        ]);

        const summary = {
            total: allOrders.length,
            completed: allOrders.filter(o => o.paymentStatus === 'completed').length,
            pending: allOrders.filter(o => o.paymentStatus === 'pending').length,
            failed: allOrders.filter(o => o.paymentStatus === 'failed').length,
            totalRevenue: allOrders
                .filter(o => o.paymentStatus === 'completed')
                .reduce((sum, o) => sum + o.finalAmount, 0)
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

};


module.exports = orderService;




