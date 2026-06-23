const { body } = require('express-validator');

const lessonValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Lesson title is required')
        .isLength({ min: 3, max: 100 }).withMessage('Lesson title must be 3-100 characters'),

    body('description')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

    body('videoUrl')
        .optional({ checkFalsy: true })
        .trim()
        .isURL().withMessage('Please provide a valid video URL'),

    body('duration')
        .optional({ checkFalsy: true })
        .isInt({ min: 0 }).withMessage('Duration cannot be negative'),

    body('chapterTitle')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('Chapter title must be 1-100 characters'),
    body('chapterOrder')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('Chapter order must be at least 1')
];

module.exports = { lessonValidation };



