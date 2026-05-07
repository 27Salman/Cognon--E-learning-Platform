const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { USER_ROLES } = require('../config/constants');
const { uploadProfile } = require('../config/multer');

router.get('/public', (req, res, next) => {
    req.query.isActive = 'true';
    if (!req.query.limit) req.query.limit = '100';
    next();
}, categoryController.getCategories);

// Admin 
router.post(
    '/',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    uploadProfile.single('image'),
    categoryController.createCategory
);

router.get(
    '/',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    categoryController.getCategories
);

router.get(
    '/:id',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    categoryController.getCategoryById
);

router.put(
    '/:id',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    uploadProfile.single('image'),
    categoryController.updateCategory
);

router.delete(
    '/:id',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    categoryController.deleteCategory
);

router.patch(
    '/:id/toggle-status',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    categoryController.toggleCategoryStatus
);

module.exports = {categoryRoutes: router};

