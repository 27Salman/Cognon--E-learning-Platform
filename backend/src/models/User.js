const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_ROLES, USER_STATUS } = require("../config/constants");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [ /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email' ]
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^[6-9]\d{9}$/, 'Please provide a valid phone number']
        },
        role: {
            type: String,
            enum: {
                values: [USER_ROLES.STUDENT, USER_ROLES.TUTOR, USER_ROLES.ADMIN],
                message: 'Role must be student, tutor or admin'
            },
            default: USER_ROLES.STUDENT,
            required: true
        },
        status: {
            type: String,
            enum: {
                values: Object.values(USER_STATUS),
                message: 'Invalid status value'
            },
            default: USER_STATUS.ACTIVE
        },

        profileImage: {
            type: String,
            default: 'https://via.placeholder.com/150'
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        verificationToken: {
            type: String
        },
        verificationTokenExpires: {
            type: Date
        },
        passwordResetToken: {
            type: String
        },
        passwordResetExpires: {
            type: Date
        },

        studentProfile: {
            enrolledCourses: [
                {
                    courseId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Course'
                    },
                    enrolledAt: {
                        type: Date,
                        default: Date.now
                    },
                    progress: {
                        type: Number,
                        default: 0,
                        min: 0,
                        max: 100
                    },
                    completedLessons: [
                        {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'Lesson'
                        }
                    ]
                }
            ],
            certificates: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Certificate'
                }
            ]
        },

        tutorProfile: {
            bio: {
                type: String,
                maxlength: [500, 'Bio cannot exceed 500 characters']
            },
            expertise: [String],
            experience: {
                type: Number,
                min: [0, 'Experience cannot be negative']
            },
            coursesCreated: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Course'
                }
            ],
            isApproved: {
                type: Boolean,
                default: false 
            }
        },

        lastLogin: {
            type: Date
        }

    },

    {
        timestamps: true, 
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);


userSchema.pre('save', async function (next) {
    if(!this.isModified('password')){
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasRole = function(role){
    return this.role === role;
};

module.exports = mongoose.model('User', userSchema);



