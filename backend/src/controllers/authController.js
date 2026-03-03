const authService = require("../services/authService");
const generateToken = require("../utils/generateToken");
const { HTTP_STATUS, MESSAGES } = require("../config/constants");
const asyncHandler = require('../middleware/asyncHandler');

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
    const { email, password } = req.body;
    
    const user = await authService.loginUser(email, password);
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

exports.verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    const user = await User.findOne({
        verificationToken: hashedToken,
        verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid or expired verification token'
        });
    }
  
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
  
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Email verified successfully'
    });
});

exports.resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
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
  
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    await user.save();
    await sendVerificationEmail(user.email, user.name, verificationToken);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Verification email sent'
    });
});