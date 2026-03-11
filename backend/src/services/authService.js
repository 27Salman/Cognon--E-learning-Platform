const User = require('../models/User');
const { USER_ROLES } = require("../config/constants");
const { sendVerificationOTP } = require('./emailService');
const { generateOTP, storeOTP } = require('../utils/otpGenerator');

const authService = {
    async registerUser(userData) {
        const { name, email, password, phone, role, bio, expertise } = userData;

        try {
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPhone = phone.trim();

            console.log('Registration attempt for:', normalizedEmail);

            const deletedUsers = await User.deleteMany({
                $or: [
                    { email: normalizedEmail },
                    { phone: normalizedPhone }
                ],
                isVerified: false
            });

            if (deletedUsers.deletedCount > 0) {
                console.log(`Deleted ${deletedUsers.deletedCount} unverified user(s)`);
            }

            const verifiedUser = await User.findOne({
                $or: [
                    { email: normalizedEmail },
                    { phone: normalizedPhone }
                ],
                isVerified: true
            });

            if (verifiedUser) {
                if (verifiedUser.email === normalizedEmail) {
                    throw new Error('This email is already registered and verified. Please login.');
                }
                if (verifiedUser.phone === normalizedPhone) {
                    throw new Error('This phone number is already registered and verified.');
                }
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
                            $or: [
                                { email: normalizedEmail },
                                { phone: normalizedPhone }
                            ],
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

            const otp = generateOTP();
            storeOTP(normalizedEmail, otp, 2); // 2 minutes

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

    async loginUser(email, password) {
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
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

        if (!user.isVerified && user.role !== USER_ROLES.ADMIN) {
            throw new Error('Please verify your email before logging in');
        }

        if (user.role === USER_ROLES.TUTOR) {
            if (user.tutorProfile && !user.tutorProfile.isApproved) {
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