const { HTTP_STATUS, USER_ROLES, TUTOR_APPROVAL_STATUS } = require('../config/constants');

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!req.user){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Not authorized. Please login first'
            });
        }

        if(!roles.includes(req.user.role)){
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success:false,
                message: `Access denied. This route is restricted to: ${roles.join(', ')}`
            });
        }

        next();
    };
};

//Admin
exports.adminOnly = (req, res, next) => {
    if(!req.user){
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Not authorized. Please login first.'
        });
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }

    next();
}

//Tutor
exports.tutorOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Not authorized. Please login first.'
        });
    }

    if (req.user.role !== USER_ROLES.TUTOR) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Access denied. Tutor only.'
        });
    }

    if(req.user.tutorProfile?.approvalStatus !== TUTOR_APPROVAL_STATUS.APPROVED){
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Your account is pending for admin approval'
        })
    }

    next();
};

//Student
exports.studentOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Not authorized. Please login first.'
        });
    }

    if (req.user.role !== USER_ROLES.STUDENT) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Access denied. Student only.'
        });
    }

    next();
};

exports.checkOwnership = (req, res, next) => {
    const resourceUserId = req.params.id || req.params.userId;
  
    if (req.user._id.toString() !== resourceUserId) {
        if (req.user.role !== USER_ROLES.ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Access denied. You can only access your own resources.'
            });
        }
    }

    next();
};