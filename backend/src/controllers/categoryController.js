const asyncHandler = require('../middleware/asyncHandler');
const categoryService = require('../services/categoryService');
const { HTTP_STATUS } = require('../config/constants');

exports.createCategory = asyncHandler( async (req,res) => {
    const category = await categoryService.createCategory(req.body, req.file);
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Category created successfully',
        data: category
    });
});

exports.getCategories = asyncHandler( async (req,res) => {
    const { search, isActive, page, limit } = req.query;
    const result = await categoryService.getCategories({ search, isActive, page, limit });
    res.status(HTTP_STATUS.OK).json({ success:true, data: result });
});

exports.getCategoryById = asyncHandler( async (req,res) => {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body, req.file);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Category updated successfully',
        data: category
    });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
    const result = await categoryService.deleteCategory(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message
    });
});

exports.toggleCategoryStatus = asyncHandler(async (req, res) => {
    const category = await categoryService.toggleCategoryStatus(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
        data: category
    });
});



