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
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        const googleName = profile.displayName;
        
        const role = req.query.state || USER_ROLES.STUDENT;

        let user = await User.findOne({ email, role });

        if (user) {
          if (user.authProvider === 'local') {
            return done(null, false, {
              message: 'This email is registered with email/password. Please use manual login.'
            });
          }
          return done(null, user);
        }

        // Create new user with Google data
        user = await User.create({
          name: googleName,
          email: email,
          password: Math.random().toString(36).slice(-8) + 'Aa1!',
          phone: null,
          role: role === USER_ROLES.TUTOR ? USER_ROLES.TUTOR : USER_ROLES.STUDENT,
          profileImage: profile.photos[0]?.value || null,
          isVerified: true,
          status: 'active',
          authProvider: 'google',
        });

        // Add role-specific profile
        if (role === USER_ROLES.TUTOR) {
          user.tutorProfile = {
            bio: '',
            expertise: [],
            experience: 0,
            coursesCreated: [],
            isApproved: false, 
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
        console.error('Google OAuth error:', error);
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
exports.googleAuth = (req, res, next) => {
  const role = req.query.role || 'student';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role, 
  })(req, res, next);
};

exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }
    if (!user) {
      const msg = encodeURIComponent(info?.message || 'Google authentication failed');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${msg}`);
    }

    const token = generateToken(user._id, user.role);
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  })(req, res, next);
};

exports.passport = passport;
