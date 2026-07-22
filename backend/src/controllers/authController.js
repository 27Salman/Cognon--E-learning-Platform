const authService = require("../services/authService");
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../utils/generateToken");
const { HTTP_STATUS } = require("../config/constants");
const asyncHandler = require("../middleware/asyncHandler");

exports.signup = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Registration successful. Please verify your email.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ...(user.role === "tutor" && {
        tutorProfile: {
          bio: user.tutorProfile?.bio,
          expertise: user.tutorProfile?.expertise,
          isApproved: user.tutorProfile?.isApproved,
        },
      }),
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const loginRole = role || "student";

  const user = await authService.loginUser(email, password, loginRole);
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  setRefreshCookie(res, refreshToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Login successful",
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage
        ? user.profileImage.startsWith("http")
          ? user.profileImage
          : `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/${user.profileImage.startsWith("user-") ? "profiles/" : ""}${user.profileImage}`
        : null,
      ...(user.role === "tutor" && {
        tutorProfile: {
          bio: user.tutorProfile?.bio,
          expertise: user.tutorProfile?.expertise,
          isApproved: user.tutorProfile?.isApproved,
        },
      }),
      ...(user.role === "student" && {
        enrolledCoursesCount: user.studentProfile?.enrolledCourses?.length || 0,
      }),
    },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "development")
    console.log(`User ${req.user?._id} logged out`);
  clearRefreshCookie(res);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Logout successful",
  });
});

exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user._id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "User not found",
    });
  }

  const BASE_URL =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const profileImageURL = user.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${BASE_URL}/uploads/${user.profileImage.startsWith("user-") ? "profiles/" : ""}${user.profileImage}`
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
      ...(user.role === "tutor" && {
        tutorProfile: {
          bio: user.tutorProfile?.bio,
          subject: user.tutorProfile?.subject,
          expertise: user.tutorProfile?.expertise,
          isApproved: user.tutorProfile?.isApproved,
        },
      }),
    },
  });
});

exports.verifyEmailOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await authService.verifyEmailOTP(email, otp);

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Email verified successfully",
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ...(user.role === "tutor" && {
        tutorProfile: {
          bio: user.tutorProfile?.bio,
          expertise: user.tutorProfile?.expertise,
          isApproved: user.tutorProfile?.isApproved,
        },
      }),
    },
  });
});

exports.resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.resendOTP(email);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "OTP sent successfully",
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "If the email exists, an OTP has been sent",
  });
});

exports.verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const resetToken = await authService.verifyResetOTP(email, otp);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "OTP verified successfully",
    resetToken,
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  await authService.resetPassword(email, resetToken, newPassword);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Password reset successful",
  });
});

exports.upgradeToTutor = asyncHandler(async (req, res) => {
  const user = await authService.upgradeToTutor(req.user._id, req.body);

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Successfully upgraded to tutor. Awaiting admin approval.",
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      tutorProfile: {
        bio: user.tutorProfile.bio,
        expertise: user.tutorProfile.expertise,
        isApproved: user.tutorProfile.isApproved,
      },
    },
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  try {
    const user = await authService.refreshSession(token);
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, newRefreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      token: newAccessToken,
    });
  } catch (err) {
    clearRefreshCookie(res);
    res.status(err.statusCode || HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: err.message || "Authentication failed",
    });
  }
});
