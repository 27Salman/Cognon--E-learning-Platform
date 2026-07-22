const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  USER_ROLES,
  USER_STATUS,
  TUTOR_APPROVAL_STATUS,
} = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: false,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message:
          "Please provide a valid phone number (10 digits starting with 6-9)",
      },
    },
    role: {
      type: String,
      enum: {
        values: [USER_ROLES.STUDENT, USER_ROLES.TUTOR, USER_ROLES.ADMIN],
        message: "Role must be student, tutor or admin",
      },
      default: USER_ROLES.STUDENT,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUS),
        message: "Invalid status value",
      },
      default: USER_STATUS.ACTIVE,
    },

    profileImage: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    verificationToken: {
      type: String,
    },
    verificationTokenExpires: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },

    studentProfile: {
      enrolledCourses: [
        {
          courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
          },
          enrolledAt: {
            type: Date,
            default: Date.now,
          },
          progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
          },
          completedLessons: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Lesson",
            },
          ],
        },
      ],
      certificates: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Certificate",
        },
      ],
    },

    tutorProfile: {
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        default: "",
      },
      subject: {
        type: String,
        default: "",
      },
      expertise: [String],
      experience: {
        type: Number,
        min: [0, "Experience cannot be negative"],
      },
      coursesCreated: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      ],
      approvalStatus: {
        type: String,
        enum: Object.values(TUTOR_APPROVAL_STATUS),
        default: TUTOR_APPROVAL_STATUS.PENDING,
      },
    },

    totalCourses: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },

    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getProfileImageURL = function () {
  if (!this.profileImage) return null;
  // Cloudinary URL or other full URLs
  if (this.profileImage.startsWith("http")) return this.profileImage;
  return this.profileImage;
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  delete user.verificationToken;
  delete user.verificationTokenExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;

  if (user.profileImage) {
    user.profileImageURL = this.getProfileImageURL();
  }

  return user;
};

userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
