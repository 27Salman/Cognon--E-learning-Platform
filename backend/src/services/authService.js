const User = require('../models/User');
const { USER_ROLES } = require("../config/constants");

const authService = {
    async registerUser(userData){
        const { name, email, password, phone, role, bio, expertise } = userData;

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if(existingUser){
            throw new Error( 'Email is already registered' )
        }

        const userRole = role || USER_ROLES.STUDENT;

        if( ![USER_ROLES.STUDENT, USER_ROLES.TUTOR].includes(userRole) ){
            throw new Error('Invalid role. Only students and tutors can register.');
        };

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            phone,
            role: userRole,
            status: 'active'
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

        const userObject = newUser.toObject();
        delete userObject.password;

        return userObject;
    },

    async loginUser(email, password) {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            throw new Error('Invalid email');
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            throw new Error('Invalid password');
        }

        if (user.status === 'blocked') {
            throw new Error('Your account has been blocked. Please contact admin.');
        }

        if(user.role === USER_ROLES.TUTOR){
            if(!user.tutorProfile.isApproved){
                throw new Error('Your tutor account is pending for admin approval');
            }
        }

        user.lastLogin = new Date();
        await user.save();

        const userObject = user.toObject();
        delete userObject.password;

        return userObject;
    },

    validateRegistrationData(userData) {
        const { name, email, password, phone } = userData;

        if (!name || !email || !password || !phone) {
            throw new Error('All fields are required');
        }

        if (name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Invalid phone number format');
        }

        return true;
    },

    async getUserByEmail(email) {
        return await User.findOne({ email: email.toLowerCase() });
    },

    async getUserById(userId) {
      return await User.findById(userId).select('-password');
    }
};

module.exports = authService;