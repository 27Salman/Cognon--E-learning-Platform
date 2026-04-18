const User = require('../models/User');
const { USER_ROLES, USER_STATUS, TUTOR_APPROVAL_STATUS, COURSE_STATUS } = require('../config/constants');
const { deleteOldProfileImage } = require('./fileService');
const { createOTP, verifyOTP } = require('./otpService');
const { sendOTPEmail } = require('./emailService');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Order = require('../models/Order');


const buildImageURL = (profileImage) => {
    if(!profileImage) return null;
    if(profileImage.startsWith('http')) return profileImage;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${BASE_URL}/uploads/${profileImage}`;
}

const adminService = {

    //Dashboard
    async getDashboardStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalStudents,
            totalTutors,
            totalCourses,
            publishedCourses,
            allOrders,
            monthlyOrders,
            lastMonthOrders,
            recentOrders,
            topCourses
        ] = await Promise.all([
            User.countDocuments({ role: USER_ROLES.STUDENT }),
            User.countDocuments({ role: USER_ROLES.TUTOR }),
            Course.countDocuments(),
            Course.countDocuments({ status: COURSE_STATUS.PUBLISHED }),
            Order.find({ paymentStatus: 'completed' }).select('finalAmount orderDate'),
            Order.find({
                paymentStatus: 'completed',
                orderDate: { $gte: startOfMonth }
            }).select('finalAmount'),
            Order.find({
                paymentStatus: 'completed',
                orderDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            }).select('finalAmount'),
            Order.find({ paymentStatus: 'completed' })
                .populate('user', 'name email')
                .populate('courses.course', 'title')
                .sort({ orderDate: -1 })
                .limit(5),
            Course.find({ status: COURSE_STATUS.PUBLISHED })
                .sort({ revenue: -1 })
                .limit(5)
                .select('title price revenue studentsEnrolled thumbnail category')
                .populate('tutor', 'name')
        ]);

        const totalRevenue = allOrders.reduce((sum, o) => sum + o.finalAmount, 0);
        const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + o.finalAmount, 0);
        const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.finalAmount, 0);

        const revenueGrowth = lastMonthRevenue > 0
            ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : 100;

        const monthlyChart = await this.getMonthlyRevenueChart();

        return {
            summary: {
                totalRevenue: Math.round(totalRevenue),
                monthlyRevenue: Math.round(monthlyRevenue),
                revenueGrowth,
                totalStudents,
                totalTutors,
                totalCourses,
                publishedCourses,
                totalOrders: allOrders.length
            },
            monthlyChart,
            recentOrders,
            topCourses: topCourses.map(c => ({
                _id: c._id,
                title: c.title,
                price: c.price,
                revenue: c.revenue || 0,
                enrolledCount: c.studentsEnrolled?.length || 0,
                thumbnail: c.thumbnail,
                category: c.category,
                tutor: c.tutor
            }))
        };
    },

    async getMonthlyRevenueChart() {
        const twelveMonthsAgo = new Date();

        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const orders = await Order.find({
            paymentStatus: 'completed',
            orderDate: { $gte: twelveMonthsAgo }
        }).select('finalAmount orderDate');

        const monthlyMap = {};
        
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyMap[key] = { month: key, label, revenue: 0, orders: 0 };
        }

        for (const order of orders) {
            const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyMap[key]) {
                monthlyMap[key].revenue += order.finalAmount;
                monthlyMap[key].orders += 1;
            }
        }

        return Object.values(monthlyMap)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(m => ({ ...m, revenue: Math.round(m.revenue) }));
    },

    //Profile
    async getProfile(adminId) {
        const admin = await User.findById(adminId).select('-password');

        if(!admin){
            throw new Error('Admin not found');
        }

        return {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            profileImage: admin.profileImage,
            profileImageURL: buildImageURL(admin.profileImage),
            role: admin.role,
        };
    },

    async updateProfile( adminId, { name,phone }, file){
        const admin = await User.findById(adminId);

        if(!admin){
            throw new Error('Admin not found');
        }

        if(name) admin.name = name.trim();

        if (phone !== undefined) admin.phone = phone.trim() || null;

        if (file) {
            if (admin.profileImage && !admin.profileImage.startsWith('http')) {
                await deleteOldProfileImage(admin.profileImage);
            }
            admin.profileImage = file.filename;
        }

        await admin.save();

        return {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            profileImage: admin.profileImage,
            profileImageURL: buildImageURL(admin.profileImage),
            role: admin.role,
        };
    },

    async requestPasswordChange(adminEmail){
        const otp = await createOTP(adminEmail, 'password_change');
        await sendOTPEmail(adminEmail, otp, 'password_change');

        return `OTP sent to ${adminEmail}`;
    },

    async verifyPasswordChange(adminId, adminEmail, newPassword, otp){
        await verifyOTP(adminEmail, otp, 'password_change');

        const admin = await User.findById(adminId);
        admin.password = newPassword;
        await admin.save();
    },


    //Tutor management

    async getTutors({ status, search, page = 1, limit = 10 } = {}){
        const query = { role: USER_ROLES.TUTOR };

        if(status && Object.values(USER_STATUS).includes(status)){
            query.status = status;
        }

        if(search && search.trim()){
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { email: { $regex: search.trim(), $options: 'i' } },
            ];
        }

        const pageNum = Math.max(1,parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1,parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [tutors, totalFiltered, allTutors] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query),
            User.find({ role: USER_ROLES.TUTOR }).select('status'),
        ])

        const summary = {
            total: allTutors.length,
            active: allTutors.filter( a => a.status === USER_STATUS.ACTIVE).length,
            blocked: allTutors.filter( a => a.status === USER_STATUS.BLOCKED).length,
        }

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum,
        }

        return { tutors, summary, pagination};

    },

    async approveTutor(tutorId){
        const tutor = await User.findById(tutorId);
        if(!tutor || tutor.role !== USER_ROLES.TUTOR) throw new Error('Tutor not found');
        if(tutor.tutorProfile.approvalStatus === TUTOR_APPROVAL_STATUS.APPROVED) throw new Error("Tutor is already approved");

        tutor.tutorProfile.approvalStatus = TUTOR_APPROVAL_STATUS.APPROVED;
        await tutor.save();
        return tutor;
    },

    async rejectTutor(tutorId){
        const tutor = await User.findById(tutorId);
        if(!tutor || tutor.role !== USER_ROLES.TUTOR) throw new Error('tutor not found');

        tutor.tutorProfile.approvalStatus = TUTOR_APPROVAL_STATUS.REJECTED;
        await tutor.save();
        return tutor;
    },


    //Student management

    async getStudents ({ status, search, page = 1, limit = 10 } = {}){
        const query = { role: USER_ROLES.STUDENT };

        if(status && Object.values(USER_STATUS).includes(status)){
            query.status = status;
        }

        if(search && search.trim()){
            query.$or = [
                { name: { $regex: search.trim(), $options:'i'} },
                { email: { $regex: search.trim(), $options:'i'} },
            ];
        }

        const pageNum = Math.max(1,parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1,parseInt(limit)) || 10);
        const skip = (pageNum - 1) * limitNum;

        const [students, totalFiltered, allStudents] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query),
            User.find({ role: USER_ROLES.STUDENT }).select('status'),
        ])

        const summary = {
            total: allStudents.length,
            active: allStudents.filter( a => a.status === USER_STATUS.ACTIVE ).length,
            blocked: allStudents.filter( a => a.status === USER_STATUS.BLOCKED ).length,
        }

        const pagination = {
            currentPage: pageNum,
            totalFiltered,
            totalPages: Math.ceil(totalFiltered / limitNum),
            limit:limitNum,
        }

        return { students, summary, pagination };
    },

    async blockUser(userId) {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        if (user.role === USER_ROLES.ADMIN) {
            throw new Error('Admin accounts cannot be blocked');
        }

        if (user.status === USER_STATUS.BLOCKED) {
            throw new Error('User is already blocked');
        }

        user.status = USER_STATUS.BLOCKED;
        await user.save();

        return user;
    },

    async unblockUser(userId) {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        if (user.status !== USER_STATUS.BLOCKED) {
            throw new Error('User is not blocked');
        }

        user.status = USER_STATUS.ACTIVE;
        await user.save();

        return user;
    },

    // Course Management
    async getCourses({ category, status, tutor, search, sort = '-createdAt', page = 1, limit = 5 } = {}) {
        const query = {};

        if(category){
            query.category = category;
        }

        if(status && Object.values(COURSES_STATUS).includes(status)){
            query.status = status;
        }

        if(tutor){
            query.tutor = tutor
        }

        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        let sortOption = {};
        if (sort.startsWith('-')) {
            sortOption[sort.substring(1)] = -1;
        } else {
            sortOption[sort] = 1;
        }

        const [ courses, totalFiltered, allCourses] = await Promise.all([
            Course.find(query)
                .populate('tutor', 'name email')
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum),
            Course.countDocuments(query),
            Course.find({}).select('status')
        ]);

        const summary = {
            total: allCourses.length,
            published: allCourses.filter(c => c.status === COURSE_STATUS.PUBLISHED).length,
            draft: allCourses.filter(c => c.status === COURSE_STATUS.DRAFT).length,
            pending: allCourses.filter(c => c.status === COURSE_STATUS.PENDING_REVIEW).length,
            archived: allCourses.filter(c => c.status === COURSE_STATUS.ARCHIVED).length
        };

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum
        }

        return { courses, summary, pagination };

    },

    async getCourseById(courseId) {
        const course = await Course.findById(courseId)
            .populate('tutor', 'name email phone profileImage')
            .populate('studentsEnrolled', 'name email');

        if (!course) {
            throw new Error('Course not found');
        }

        return course;
    },

    async updateCourseStatus(courseId, status) {
        if (!Object.values(COURSE_STATUS).includes(status)) {
            throw new Error('Invalid course status');
        }

        const course = await Course.findById(courseId);

        if (!course) {
            throw new Error('Course not found');
        }

        course.status = status;
        await course.save();

        return course;
    },

    async deleteCourse(courseId) {
        const course = await Course.findById(courseId);

        if (!course) {
            throw new Error('Course not found');
        }

        if (course.studentsEnrolled && course.studentsEnrolled.length > 0) {
            throw new Error('Cannot delete course with enrolled students. Archive it instead.');
        }

        if (course.thumbnail && !course.thumbnail.startsWith('http')) {
            await deleteOldProfileImage(course.thumbnail);
        }

        await Lesson.deleteMany({ course: courseId });

        await Course.findByIdAndDelete(courseId);

        return { message: 'Course and associated lessons deleted successfully' };
    },

};

module.exports = adminService;

