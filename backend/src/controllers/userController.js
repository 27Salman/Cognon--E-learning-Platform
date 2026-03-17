const User = require('../models/User');
const { deleteOldProfileImage } = require('../services/fileService');
const { createOTP, verifyOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/emailService');

const buildImageURL = (profileImage) => {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) return profileImage;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${BASE_URL}/uploads/${profileImage}`;
};

exports.getProfile = async (req, res) => {
    try {
        const student = await User.findById(req.user.id).select('-password');
        if (!student) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({
            success: true,
            data: {
                _id: student._id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                profileImage: student.profileImage,
                profileImageURL: buildImageURL(student.profileImage),
                role: student.role,
                status: student.status,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const student = await User.findById(req.user.id);
        if (!student) return res.status(404).json({ success: false, message: 'User not found' });

        if (name) student.name = name.trim();
        if (phone !== undefined) student.phone = phone.trim() || null;

        if (req.file) {
            if (student.profileImage && !student.profileImage.startsWith('http')) {
                await deleteOldProfileImage(student.profileImage);
            }
            student.profileImage = req.file.filename;
        }

        await student.save({ validateModifiedOnly: true });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: student._id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                profileImage: student.profileImage,
                profileImageURL: buildImageURL(student.profileImage),
                role: student.role,
                status: student.status,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.requestPasswordChange = async (req, res) => {
    try {
        const otp = await createOTP(req.user.email, 'password_change');
        await sendOTPEmail(req.user.email, otp, 'password_change');
        res.status(200).json({ success: true, message: `OTP sent to ${req.user.email}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyPasswordChange = async (req, res) => {
    try {
        const { newPassword, otp } = req.body;
        await verifyOTP(req.user.email, otp, 'password_change');

        const student = await User.findById(req.user.id);
        student.password = newPassword;
        await student.save();

        res.status(200).json({ success: true, message: 'Password changed successfully. Please login again.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
