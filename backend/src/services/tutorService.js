const User = require('../models/User');
const { deleteOldProfileImage } = require('./fileService');
const { createOTP, verifyOTP } = require('./otpService');
const { sendOTPEmail } = require('./emailService');

const buildImageURL = (profileImage) => {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) return profileImage;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${BASE_URL}/uploads/${profileImage}`;
};

const tutorService = {

    async getProfile(tutorId) {
        const tutor = await User.findById(tutorId).select('-password');
        if (!tutor) throw new Error('Tutor not found');
        return tutor;
    },

    async updateProfile(tutorId, { name, phone, subject, bio }, file) {
        const tutor = await User.findById(tutorId);
        if (!tutor) throw new Error('Tutor not found');

        if (name) tutor.name = name;
        if (phone) tutor.phone = phone;
        if (subject !== undefined) tutor.tutorProfile.subject = subject;
        if (bio !== undefined) tutor.tutorProfile.bio = bio;

        if (file) {
            if (tutor.profileImage && !tutor.profileImage.startsWith('http')) {
                await deleteOldProfileImage(tutor.profileImage);
            }
            tutor.profileImage = file.filename;
        }

        await tutor.save({ validateModifiedOnly: true });

        return {
            _id: tutor._id,
            name: tutor.name,
            email: tutor.email,
            phone: tutor.phone,
            profileImage: tutor.profileImage,
            profileImageURL: buildImageURL(tutor.profileImage),
            tutorProfile: tutor.tutorProfile,
            role: tutor.role,
            status: tutor.status,
        };
    },

    async requestEmailChange(tutorId, tutorRole, currentEmail, newEmail) {
        const existing = await User.findOne({
            email: newEmail.toLowerCase(),
            role: tutorRole,
            _id: { $ne: tutorId },
        });
        if (existing) throw new Error('Email already in use');

        const otp = await createOTP(currentEmail, 'email_change', newEmail);
        await sendOTPEmail(newEmail, otp, 'email_change');

        return `OTP sent to ${newEmail}`;
    },

    async verifyEmailChange(tutorId, currentEmail, newEmail, otp) {
        const otpDoc = await verifyOTP(currentEmail, otp, 'email_change');
        if (otpDoc.newEmail !== newEmail) throw new Error('Email mismatch');

        const tutor = await User.findById(tutorId);
        tutor.email = newEmail;
        await tutor.save();

        return tutor;
    },

    async requestPasswordChange(tutorEmail) {
        const otp = await createOTP(tutorEmail, 'password_change');
        await sendOTPEmail(tutorEmail, otp, 'password_change');

        return `OTP sent to ${tutorEmail}`;
    },

    async verifyPasswordChange(tutorId, tutorEmail, newPassword, otp) {
        await verifyOTP(tutorEmail, otp, 'password_change');

        const tutor = await User.findById(tutorId);
        tutor.password = newPassword;
        await tutor.save();
    },

    async getTutorDashboard(tutorId) {
        const Course = require('../models/Course');
        const { COURSE_STATUS } = require('../config/constants');

        const courses = await Course.find({ tutor: tutorId });

        const totalCourses = courses.length;
        const activeCourses = courses.filter(c => c.status === COURSE_STATUS.PUBLISHED).length;

        const totalStudents = courses.reduce((sum, course) => {
            return sum + (course.studentsEnrolled ? course.studentsEnrolled.length : 0);
        }, 0);

        const totalRevenue = courses.reduce((sum, course) => {
            const enrolled = course.studentsEnrolled ? course.studentsEnrolled.length : 0;
            return sum + (course.price * enrolled);
        }, 0);

        const recentCourses = courses
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5)
            .map(c => ({
                _id: c._id,
                title: c.title,
                status: c.status,
                price: c.price,
                studentsCount: c.studentsEnrolled ? c.studentsEnrolled.length : 0,
                revenue: c.price * (c.studentsEnrolled ? c.studentsEnrolled.length : 0)
            }));

        return {
            totalCourses,
            activeCourses,
            totalStudents,
            totalRevenue,
            recentCourses
        };
    },

};

module.exports = tutorService;
