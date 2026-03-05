const { body } = require('express-validator');

const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Name must be 3-50 characters')
    .matches(/^[a-zA-Z0-9]([a-zA-Z0-9_-]{1,48}[a-zA-Z0-9])?$/)
    .withMessage('Username can only contain letters, numbers, underscore and hyphen'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Phone must be 10 digits starting with 6-9'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character (@$!%*?&)'),
  
  body('role')
    .optional()
    .isIn(['student', 'tutor']).withMessage('Role must be student or tutor')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
];

const resetPasswordValidation = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

module.exports = {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};