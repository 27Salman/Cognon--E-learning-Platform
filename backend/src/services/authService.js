const User = require("../models/User");
const {
  USER_ROLES,
  HTTP_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_ACTIONS,
} = require("../config/constants");
const { sendVerificationOTP, sendPasswordResetOTP } = require("./emailService");
const { createOTP, verifyOTP } = require("./otpService");
const notificationService = require("./notificationService");

const authService = {
  async registerUser(userData) {
    const { name, email, password, phone, role, bio, expertise } = userData;

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = phone.trim();

      if (process.env.NODE_ENV === "development") {
        console.log("Registration attempt for:", normalizedEmail, "as", role);
      }

      const deletedUsers = await User.deleteMany({
        email: normalizedEmail,
        role: role,
        isVerified: false,
      });

      if (
        deletedUsers.deletedCount > 0 &&
        process.env.NODE_ENV === "development"
      ) {
        console.log(
          `Deleted ${deletedUsers.deletedCount} unverified user(s) with role ${role}`,
        );
      }

      const verifiedUser = await User.findOne({
        email: normalizedEmail,
        role: role,
        isVerified: true,
      });

      if (verifiedUser) {
        const err = new Error(
          `This email is already registered as ${role}. Please login.`,
        );
        err.statusCode = 409;
        throw err;
      }

      const userRole = role || USER_ROLES.STUDENT;

      if (![USER_ROLES.STUDENT, USER_ROLES.TUTOR].includes(userRole)) {
        throw new Error("Invalid role. Only students and tutors can register.");
      }

      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        phone: normalizedPhone,
        role: userRole,
        status: "active",
        isVerified: false,
        authProvider: "local",
      });

      if (userRole === USER_ROLES.TUTOR) {
        newUser.tutorProfile = {
          bio: bio || "",
          expertise: expertise || [],
          experience: 0,
          coursesCreated: [],
          // approvalStatus defaults to PENDING via schema
        };
      } else if (userRole === USER_ROLES.STUDENT) {
        newUser.studentProfile = {
          enrolledCourses: [],
          certificates: [],
        };
      }

      let savedUser;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          savedUser = await newUser.save();
          if (process.env.NODE_ENV === "development")
            console.log(`User saved on attempt ${attempt}:`, savedUser._id);
          break;
        } catch (saveError) {
          if (saveError.code === 11000 && attempt < 3) {
            if (process.env.NODE_ENV === "development")
              console.log(
                `Duplicate key error on attempt ${attempt}, retrying...`,
              );

            await User.deleteMany({
              email: normalizedEmail,
              role: userRole,
              isVerified: false,
            });

            await new Promise((resolve) => setTimeout(resolve, 200));
          } else {
            console.error("Save error:", saveError.message);
            throw saveError;
          }
        }
      }

      if (!savedUser) {
        throw new Error("Failed to create user after multiple attempts");
      }

      if (userRole === USER_ROLES.TUTOR) {
        const admin = await User.findOne({ role: USER_ROLES.ADMIN }).select(
          "_id",
        );
        if (admin) {
          await notificationService.create({
            recipient: admin._id,
            type: NOTIFICATION_TYPES.NEW_TUTOR_REGISTERED,
            title: "New tutor registration",
            message: `${name} has registered as a tutor and is awaiting approval.`,
            priority: "medium",
            actionUrl: NOTIFICATION_ACTIONS.ADMIN_TUTORS(),
            data: { tutorId: savedUser._id, tutorName: name },
          });
        }
      }

      const otp = await createOTP(normalizedEmail, "email_verification");

      try {
        await sendVerificationOTP(normalizedEmail, name, otp);
        if (process.env.NODE_ENV === "development")
          console.log("OTP sent successfully to:", normalizedEmail);
      } catch (emailError) {
        console.error("Failed to send verification OTP:", emailError.message);
        throw new Error(
          "Failed to send verification email. Please try again later.",
        );
      }

      const userObject = savedUser.toObject();
      delete userObject.password;

      return userObject;
    } catch (error) {
      console.error("Registration error:", error.message);
      throw error;
    }
  },

  async loginUser(email, password, role) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
      role: role,
    }).select("+password");

    if (!user) {
      const err = new Error(
        role === USER_ROLES.ADMIN
          ? "Invalid admin credentials"
          : `No ${role} account found with this email. Please check your credentials or register.`,
      );
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    if (user.status === "blocked") {
      const err = new Error(
        "Your account has been blocked. Please contact admin.",
      );
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
      const err = new Error(
        `Your account is locked. Try again after ${minutesLeft} minutes.`,
      );
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 3) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save();
        const err = new Error(
          "Too many failed attempts. Account is locked for 15 min. Try later!",
        );
        err.statusCode = HTTP_STATUS.FORBIDDEN;
        throw err;
      }

      await user.save();
      const remaining = 3 - user.loginAttempts;
      const err = new Error(
        `Invalid email or password. ${remaining} Attempts left.`,
      );
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    user.loginAttempts = 0;
    user.lockUntil = null;

    if (!user.isVerified && user.role !== USER_ROLES.ADMIN) {
      const err = new Error("Please verify your email before logging in");
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
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
    return await User.findById(userId).select("-password");
  },

  async checkEmailExists(email) {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isVerified: true,
    });
    return !!user;
  },

  async checkPhoneExists(phone) {
    const user = await User.findOne({
      phone: phone.trim(),
      isVerified: true,
    });
    return !!user;
  },

  async verifyEmailOTP(email, otp) {
    if (!email || !otp) {
      const err = new Error("Email and OTP are required");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    await verifyOTP(email.toLowerCase(), otp, "email_verification");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    user.isVerified = true;
    await user.save();
    return user;
  },

  async resendOTP(email) {
    if (!email) {
      const err = new Error("Email is required");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    if (user.isVerified) {
      const err = new Error("Email already verified");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const otp = await createOTP(email.toLowerCase(), "email_verification");
    await sendVerificationOTP(email, user.name, otp);
    return true;
  },

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return true;
    }

    const otp = await createOTP(email.toLowerCase(), "password_change");
    await sendPasswordResetOTP(user.email, user.name, otp);
    return true;
  },

  async verifyResetOTP(email, otp) {
    if (!email || !otp) {
      const err = new Error("Email and OTP are required");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    await verifyOTP(email.toLowerCase(), otp, "password_change");

    const resetToken = require("crypto").randomBytes(32).toString("hex");
    await createOTP(email.toLowerCase(), "email_change", resetToken);

    return resetToken;
  },

  async resetPassword(email, resetToken, newPassword) {
    if (!email || !resetToken || !newPassword) {
      const err = new Error("All fields are required");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const OTP = require("../models/OTP");
    const tokenDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: "email_change",
      newEmail: resetToken,
      verified: false,
    });

    if (!tokenDoc) {
      const err = new Error("Invalid or expired reset token");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    await OTP.deleteOne({ _id: tokenDoc._id });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    user.password = newPassword;
    await user.save();
    return true;
  },

  async upgradeToTutor(userId, { bio, expertise }) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    if (user.role === "tutor") {
      const err = new Error("You are already a tutor");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (user.role !== "student") {
      const err = new Error("Only students can upgrade to tutor");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    user.role = "tutor";
    user.tutorProfile = {
      bio: bio || "",
      expertise: expertise || [],
      experience: 0,
      coursesCreated: [],
      isApproved: false,
    };

    await user.save();
    return user;
  },

  async refreshSession(refreshTokenCookie) {
    if (!refreshTokenCookie) {
      const err = new Error("No refresh token. Please log in again.");
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    let decoded;
    try {
      const jwt = require("jsonwebtoken");
      decoded = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      const error = new Error(
        "Refresh token expired or invalid. Please log in again.",
      );
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      error.isTokenExpired = true;
      throw error;
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    if (user.status === "blocked") {
      const err = new Error("Your account has been blocked.");
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    return user;
  },
};

module.exports = authService;
