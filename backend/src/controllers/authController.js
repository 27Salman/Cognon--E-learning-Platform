const authService = require("../services/authService");
const generateToken = require("../utils/generateToken");
const { HTTP_STATUS, MESSAGES } = require("../config/constants");

exports.signup = async (req, res) => {
    try {
        const userData = req.body;
        authService.validateRegistrationData(userData);
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
        
    } catch (error) {
        console.error('Signup Error:', error.message);
    
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};

exports.login = async (req,res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

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
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: error.message || MESSAGES.ERROR.INVALID_CREDENTIALS
        });
    }
};

exports.logout = async (req, res) => {
  try {
        console.log(`User ${req.user?._id} logged out`);
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

exports.getCurrentUser = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await authService.getUserById(userId);

        if(!user){
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
        })
    } catch (error) {
        console.error('Current User Error:', error.message);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch user data'
        });
    }
}