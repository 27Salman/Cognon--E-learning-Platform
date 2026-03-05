const User = require('../models/User');
const { USER_ROLES } = require("../config/constants");
const { sendVerificationOTP } = require('./emailService');
const { generateOTP, storeOTP } = require('../utils/otpGenerator');

const authService = {
    async registerUser(userData){
        const { name, email, password, phone, role, bio, expertise } = userData;

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if(existingUser){
            throw new Error('Email is already registered')
        }

        const existingPhone = await User.findOne({ phone });
        if(existingPhone){
            throw new Error('Phone number is already registered')
        }

        const userRole = role || USER_ROLES.STUDENT;

        if( ![USER_ROLES.STUDENT, USER_ROLES.TUTOR].includes(userRole) ){
            throw new Error('Invalid role. Only students and tutors can register.');
        }

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            phone,
            role: userRole,
            status: 'active',
            isVerified: false
        });

        if (userRole === USER_ROLES.TUTOR) {
            newUser.tutorProfile = {
                bio: bio || '',
                expertise: expertise || [],
                experience: 0,
                coursesCreated: [],
                isApproved: false  
            };
        } else if (userRole === USER_ROLES.STUDENT) {
            newUser.studentProfile = {
                enrolledCourses: [],
                certificates: []
            };
        }

        await newUser.save();

        const otp = generateOTP();
        storeOTP(email, otp, 5);

        try {
            await sendVerificationOTP(email, name, otp);
        } catch (error) {
            console.error('Failed to send verification OTP:', error);
        }

        const userObject = newUser.toObject();
        delete userObject.password;

        return userObject;
    },

    async loginUser(email, password) {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            throw new Error('Invalid email or password');
        }

        if (user.status === 'blocked') {
            throw new Error('Your account has been blocked. Please contact admin.');
        }

        if (!user.isVerified) {
            throw new Error('Please verify your email before logging in');
        }

        if(user.role === USER_ROLES.TUTOR){
            if(!user.tutorProfile.isApproved){
                throw new Error('Your tutor account is pending admin approval');
            }
        }

        user.lastLogin = new Date();
        await user.save();

        const userObject = user.toObject();
        delete userObject.password;

        return userObject;
    },

    async getUserByEmail(email) {
        return await User.findOne({ email: email.toLowerCase() });
    },

    async getUserById(userId) {
        return await User.findById(userId).select('-password');
    },

    async checkEmailExists(email) {
        const user = await User.findOne({ email: email.toLowerCase() });
        return !!user;
    },

    async checkPhoneExists(phone) {
        const user = await User.findOne({ phone });
        return !!user;
    }
};

module.exports = authService;