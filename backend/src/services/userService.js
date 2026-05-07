const User = require('../models/User');
const { deleteOldProfileImage } = require('./fileService');
const { createOTP, verifyOTP } = require('./otpService');
const { sendOTPEmail } = require('./emailService');

const buildImageURL = (profileImage) => {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) return profileImage;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const subfolder = profileImage.startsWith('user-') ? 'profiles/' : '';
    return `${BASE_URL}/uploads/${subfolder}${profileImage}`;
};

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
            profileImageURL: buildImageURL(student.profileImage),
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
            if (student.profileImage && !student.profileImage.startsWith('http')) {
                await deleteOldProfileImage(student.profileImage);
            }
            student.profileImage = file.filename;
        }

        await student.save({ validateModifiedOnly: true });

        return {
            _id: student._id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            profileImage: student.profileImage,
            profileImageURL: buildImageURL(student.profileImage),
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
