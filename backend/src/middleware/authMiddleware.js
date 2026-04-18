const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

exports.protect = async (req,res,next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Not authorized. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not found. Token invalid.'
            });
        }

        if (user.status === 'blocked') {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Your account has been blocked.'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Auth Middleware Error:', error.message);

        if (error.name === 'JsonWebTokenError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.ERROR.TOKEN_INVALID
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.ERROR.TOKEN_EXPIRED
            });
        }

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}


exports.optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        }
    } catch (err) {

    }
    next();
};
