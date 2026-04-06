const User = require('../models/User')
const authService = require("../services/authService");
const generateToken = require("../utils/generateToken");
const { HTTP_STATUS, MESSAGES } = require("../config/constants");
const asyncHandler = require('../middleware/asyncHandler');
const { verifyOTP, createOTP } = require('../services/otpService');
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

    const loginRole = role || 'student';
    
    const user = await authService.loginUser(email, password, loginRole);
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
  
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const profileImageURL = user.profileImage
        ? (user.profileImage.startsWith('http') ? user.profileImage : `${BASE_URL}/uploads/${user.profileImage}`)
        : null;

    res.status(HTTP_STATUS.OK).json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImage: profileImageURL,
            status: user.status,
            createdAt: user.createdAt,
            ...(user.role === 'tutor' && {
                tutorProfile: {
                    bio: user.tutorProfile?.bio,
                    subject: user.tutorProfile?.subject,
                    expertise: user.tutorProfile?.expertise,
                    isApproved: user.tutorProfile?.isApproved
                }
            })
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

    await verifyOTP(email.toLowerCase(), otp, 'email_verification');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }

    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Email verified successfully',
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
            })
        }
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

    const otp = await createOTP(email.toLowerCase(), 'email_verification');
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

    const otp = await createOTP(email.toLowerCase(), 'password_change');

    await sendPasswordResetOTP(user.email, user.name, otp);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password reset OTP sent to your email'
    });
});

exports.verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Email and OTP are required'
        });
    }

    await verifyOTP(email.toLowerCase(), otp, 'password_change');

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    await createOTP(email.toLowerCase(), 'email_change', resetToken);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'OTP verified successfully',
        resetToken
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

    const OTP = require('../models/OTP');
    const tokenDoc = await OTP.findOne({
        email: email.toLowerCase(),
        purpose: 'email_change',
        newEmail: resetToken,
        verified: false
    });

    if (!tokenDoc) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }

    await OTP.deleteOne({ _id: tokenDoc._id });

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
