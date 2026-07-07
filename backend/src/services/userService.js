const User = require('../models/User');
const { createOTP, verifyOTP } = require('./otpService');
const { sendOTPEmail } = require('./emailService');
const { deleteCloudinaryAsset } = require('./fileService');

const userService = {

    async getProfile(studentId) {
        const student = await User.findById(studentId).select('-password');
        if (!student) throw new Error('User not found');

        return {
            _id: student._id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            profileImage: student.profileImage,
            profileImageURL: student.profileImage,
            role: student.role,
            status: student.status,
        };
    },

    async updateProfile(studentId, { name, phone }, file) {
        const student = await User.findById(studentId);
        if (!student) throw new Error('User not found');

        if (name) student.name = name.trim();
        if (phone !== undefined) student.phone = phone.trim() || null;

        if (file) {
            if (student.profileImage) {
                await deleteCloudinaryAsset(student.profileImage);
            }
            student.profileImage = file.path; 
        }

        await student.save({ validateModifiedOnly: true });

        return {
            _id: student._id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            profileImage: student.profileImage,
            profileImageURL: student.profileImage,
            role: student.role,
            status: student.status,
        };
    },

    async requestPasswordChange(studentEmail) {
        const otp = await createOTP(studentEmail, 'password_change');
        await sendOTPEmail(studentEmail, otp, 'password_change');

        return `OTP sent to ${studentEmail}`;
    },

    async verifyPasswordChange(studentId, studentEmail, newPassword, otp) {
        await verifyOTP(studentEmail, otp, 'password_change');

        const student = await User.findById(studentId);
        student.password = newPassword;
        await student.save();
    },

};

module.exports = userService;
