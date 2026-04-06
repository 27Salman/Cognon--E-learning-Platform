const User = require('../models/User');
const { USER_ROLES } = require("../config/constants");
const { sendVerificationOTP } = require('./emailService');
const { generateOTP, createOTP } = require('./otpService');

const authService = {
    async registerUser(userData) {
        const { name, email, password, phone, role, bio, expertise } = userData;

        try {
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPhone = phone.trim();

            console.log('Registration attempt for:', normalizedEmail, 'as', role);

            const deletedUsers = await User.deleteMany({
                email: normalizedEmail,
                role: role,
                isVerified: false
            });

            if (deletedUsers.deletedCount > 0) {
                console.log(`Deleted ${deletedUsers.deletedCount} unverified user(s) with role ${role}`);
            }

            const verifiedUser = await User.findOne({
                email: normalizedEmail,
                role: role,
                isVerified: true
            });

            if (verifiedUser) {
                throw new Error(`This email is already registered as ${role}. Please login.`);
            }

            const userRole = role || USER_ROLES.STUDENT;

            if (![USER_ROLES.STUDENT, USER_ROLES.TUTOR].includes(userRole)) {
                throw new Error('Invalid role. Only students and tutors can register.');
            }

            const newUser = new User({
                name: name.trim(),
                email: normalizedEmail,
                password,
                phone: normalizedPhone,
                role: userRole,
                status: 'active',
                isVerified: false,
                authProvider: 'local'
            });

            if (userRole === USER_ROLES.TUTOR) {
                newUser.tutorProfile = {
                    bio: bio || '',
                    expertise: expertise || [],
                    experience: 0,
                    coursesCreated: [],
                    isApproved: true  
                };
            } else if (userRole === USER_ROLES.STUDENT) {
                newUser.studentProfile = {
                    enrolledCourses: [],
                    certificates: []
                };
            }

            let savedUser;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    savedUser = await newUser.save();
                    console.log(`User saved on attempt ${attempt}:`, savedUser._id);
                    break;
                } catch (saveError) {
                    if (saveError.code === 11000 && attempt < 3) {
                        console.log(`Duplicate key error on attempt ${attempt}, retrying...`);
                        
                        await User.deleteMany({
                            email: normalizedEmail,
                            role: userRole,
                            isVerified: false
                        });
                        
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } else {
                        console.error('Save error:', saveError.message);
                        throw saveError;
                    }
                }
            }

            if (!savedUser) {
                throw new Error('Failed to create user after multiple attempts');
            }

            const otp = await createOTP(normalizedEmail, 'email_verification');

            try {
                await sendVerificationOTP(normalizedEmail, name, otp);
                console.log('OTP sent successfully to:', normalizedEmail);
            } catch (emailError) {
                console.error('Failed to send verification OTP:', emailError.message);
            }

            const userObject = savedUser.toObject();
            delete userObject.password;

            return userObject;

        } catch (error) {
            console.error('Registration error:', error.message);
            throw error;
        }
    },

    async loginUser(email, password, role) {
        const normalizedEmail = email.toLowerCase().trim();
        
        const user = await User.findOne({ 
            email: normalizedEmail,
            role: role 
        }).select('+password');
    

        if (!user) {
            if (role === USER_ROLES.ADMIN) {
                throw new Error('Invalid admin credentials');
            }
            throw new Error(`No ${role} account found with this email. Please check your credentials or register.`);
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {

            throw new Error('Invalid email or password');
        }

        if (user.status === 'blocked') {
            const error =  new Error('Your account has been blocked. Please contact admin.');
            error.statusCode = 400;
            throw error;
        }

        if (!user.isVerified && user.role !== USER_ROLES.ADMIN) {
            throw new Error('Please verify your email before logging in');
        }

        user.lastLogin = new Date();
        await user.save();

        const userObject = user.toObject();
        delete userObject.password;

        return userObject;
    },

    async getUserByEmail(email) {
        return await User.findOne({ email: email.toLowerCase().trim() });
    },

    async getUserById(userId) {
        return await User.findById(userId).select('-password');
    },

    async checkEmailExists(email) {
        const user = await User.findOne({ 
            email: email.toLowerCase().trim(),
            isVerified: true 
        });
        return !!user;
    },

    async checkPhoneExists(phone) {
        const user = await User.findOne({ 
            phone: phone.trim(),
            isVerified: true 
        });
        return !!user;
    }
};

module.exports = authService;