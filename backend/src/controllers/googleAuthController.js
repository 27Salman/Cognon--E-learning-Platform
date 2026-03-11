const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { USER_ROLES } = require('../config/constants');

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random password
          phone: '0000000000', // Placeholder phone
          role: USER_ROLES.STUDENT,
          profileImage: profile.photos[0]?.value || 'https://via.placeholder.com/150',
          isVerified: true, // Google accounts are pre-verified
          status: 'active',
          studentProfile: {
            enrolledCourses: [],
            certificates: [],
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
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
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  })(req, res, next);
};

module.exports = passport;
