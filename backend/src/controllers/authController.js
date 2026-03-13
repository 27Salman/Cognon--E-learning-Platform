const User = require('../models/User')
const authService = require("../services/authService");
const generateToken = require("../utils/generateToken");
const { HTTP_STATUS, MESSAGES } = require("../config/constants");
const asyncHandler = require('../middleware/asyncHandler');
const { verifyOTP, generateOTP, storeOTP, clearOTP } = require('../utils/otpGenerator');
const { sendVerificationOTP, sendPasswordResetOTP } = require('../services/emailService');

exports.signup = asyncHandler(async (req, res) => {
    const userData = req.body;
    const user = await authService.registerUser(userData);
    const token = generateToken(user._id, user.role);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            ...(user.role === 'tutor' && {
                tutorProfile: {
                    bio: user.tutorProfile.bio,
                    expertise: user.tutorProfile.expertise,
                    isApproved: user.tutorProfile.isApproved
                }
            })
        }
    });
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;
    
    // Role is required to determine which account to login to
    if (!role) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Role is required (student or tutor)'
        });
    }
    
    const user = await authService.loginUser(email, password, role);
    const token = generateToken(user._id, user.role);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            ...(user.role === 'tutor' && {
                tutorProfile: {
                    bio: user.tutorProfile?.bio,
                    expertise: user.tutorProfile?.expertise,
                    isApproved: user.tutorProfile?.isApproved
                }
            }),
            ...(user.role === 'student' && {
                enrolledCoursesCount: user.studentProfile?.enrolledCourses?.length || 0
            })
        }
    });
});

exports.logout = asyncHandler(async (req, res) => {
    console.log(`User ${req.user?._id} logged out`);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logout successful'
    });
});

exports.getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await authService.getUserById(userId);

    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
  
    res.status(HTTP_STATUS.OK).json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImage: user.profileImage,
            status: user.status,
            createdAt: user.createdAt
        }
    });
});

exports.verifyEmailOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Email and OTP are required'
        });
    }
    
    const result = verifyOTP(email, otp);
    
    if (!result.valid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: result.message
        });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    user.isVerified = true;
    await user.save();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Email verified successfully'
    });
});

exports.resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Email is required'
        });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    if (user.isVerified) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Email already verified'
        });
    }
    
    clearOTP(email);
    
    const otp = generateOTP();
    storeOTP(email, otp, 2); // 2 minutes
    
    await sendVerificationOTP(email, user.name, otp);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'OTP sent successfully'
    });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'If the email exists, an OTP has been sent'
        });
    }
    
    const otp = generateOTP();
    storeOTP(`reset_${email}`, otp, 2); // 2 minutes
    
    try {
        await sendPasswordResetOTP(user.email, user.name, otp);
        
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Password reset OTP sent to your email'
        });
    } catch (error) {
        clearOTP(`reset_${email}`);
        throw new Error('Failed to send reset OTP');
    }
});

exports.verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Email and OTP are required'
        });
    }
    
    const result = verifyOTP(`reset_${email}`, otp);
    
    if (!result.valid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: result.message
        });
    }
    
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    storeOTP(`token_${email}`, resetToken, 10);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'OTP verified successfully',
        resetToken: resetToken
    });
});

exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    
    if (!email || !resetToken || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    const result = verifyOTP(`token_${email}`, resetToken);
    
    if (!result.valid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password reset successful'
    });
});


exports.upgradeToTutor = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { bio, expertise } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    if (user.role === 'tutor') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'You are already a tutor'
        });
    }
    
    if (user.role !== 'student') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Only students can upgrade to tutor'
        });
    }
    
    // Upgrade to tutor
    user.role = 'tutor';
    user.tutorProfile = {
        bio: bio || '',
        expertise: expertise || [],
        experience: 0,
        coursesCreated: [],
        isApproved: false 
    };
    
    await user.save();
    
    const token = generateToken(user._id, user.role);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Successfully upgraded to tutor. Awaiting admin approval.',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            tutorProfile: {
                bio: user.tutorProfile.bio,
                expertise: user.tutorProfile.expertise,
                isApproved: user.tutorProfile.isApproved
            }
        }
    });
});
