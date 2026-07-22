const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
} = require("../utils/generateToken");
const { USER_ROLES } = require("../config/constants");
const cloudinary = require("../config/cloudinary");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL || "http://localhost:5000"}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        const googleName = profile.displayName;

        const role = req.query.state || USER_ROLES.STUDENT;

        let user = await User.findOne({ email, role });

        if (user) {
          if (user.authProvider === "local") {
            return done(null, false, {
              message:
                "This email is registered with email/password. Please use manual login.",
            });
          }
          return done(null, user);
        }

        let profileImageUrl = profile.photos[0]?.value || null;
        if (profileImageUrl) {
          try {
            const uploaded = await cloudinary.uploader.upload(profileImageUrl, {
              folder: "Cognon/profiles",
              public_id: `google-${Date.now()}`,
              transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
              ],
            });
            profileImageUrl = uploaded.secure_url;
          } catch (uploadErr) {
            console.error(
              "Failed to upload Google profile photo to Cloudinary, using original URL:",
              uploadErr.message,
            );
          }
        }

        // Create new user
        user = await User.create({
          name: googleName,
          email: email,
          password: Math.random().toString(36).slice(-8) + "Aa1!",
          phone: null,
          role:
            role === USER_ROLES.TUTOR ? USER_ROLES.TUTOR : USER_ROLES.STUDENT,
          profileImage: profileImageUrl,
          isVerified: true,
          status: "active",
          authProvider: "google",
        });

        // role-specific profile
        if (role === USER_ROLES.TUTOR) {
          user.tutorProfile = {
            bio: "",
            expertise: [],
            experience: 0,
            coursesCreated: [],
          };
        } else {
          user.studentProfile = {
            enrolledCourses: [],
            certificates: [],
          };
        }

        await user.save();

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Auth Routes
exports.googleAuth = (req, res, next) => {
  const role = req.query.role || "student";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role,
  })(req, res, next);
};

exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
      );
    }
    if (!user) {
      const msg = encodeURIComponent(
        info?.message || "Google authentication failed",
      );
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${msg}`);
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);
    res.redirect(
      `${process.env.CLIENT_URL}/auth/google/success?token=${accessToken}`,
    );
  })(req, res, next);
};

exports.passport = passport;
