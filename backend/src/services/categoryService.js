const Category = require('../models/Category');
const Course = require('../models/Course');
const { deleteOldProfileImage } = require('./fileService');

const buildImageURL = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${BASE_URL}/uploads/categories/${image}`;
};

const categoryService = {

    async createCategory({ name, description }, file) {
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });

        if (existingCategory) {
            throw new Error('Category with this name already exists');
        }

        const category = new Category({
            name: name.trim(),
            description: description?.trim(),
            image: file ? file.filename : null
        });

        await category.save();

        return {
            ...category.toJSON(),
            imageURL: buildImageURL(category.image)
        };
    },

    async getCategories({ search, isActive, page = 1, limit = 10 } = {}) {
        const query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search && search.trim()) {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [categories, totalFiltered] = await Promise.all([
            Category.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Category.countDocuments(query)
        ]);

        const categoriesWithURL = categories.map(cat => ({
            ...cat.toJSON(),
            imageURL: buildImageURL(cat.image)
        }));

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum
        };

        return { categories: categoriesWithURL, pagination };
    },

    async getCategoryById(categoryId) {
        const category = await Category.findById(categoryId);

        if (!category) {
            throw new Error('Category not found');
        }

        return {
            ...category.toJSON(),
            imageURL: buildImageURL(category.image)
        };
    },

    async updateCategory(categoryId, { name, description }, file) {
        const category = await Category.findById(categoryId);

        if (!category) {
            throw new Error('Category not found');
        }

        const oldName = category.name;
        let nameChanged = false;

        if (name && name.trim() !== category.name) {
            const existingCategory = await Category.findOne({
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
                _id: { $ne: categoryId }
            });

            if (existingCategory) {
                throw new Error('Category with this name already exists');
            }

            category.name = name.trim();
            nameChanged = true;
        }

        if (description !== undefined) {
            category.description = description?.trim() || '';
        }

        if (file) {
            if (category.image && !category.image.startsWith('http')) {
                await deleteOldProfileImage(category.image);
            }
            category.image = file.filename;
        }

        await category.save();

        if (nameChanged) {
            await Course.updateMany(
                { category: oldName },
                { $set: { category: category.name } }
            );
        }

        return {
            ...category.toJSON(),
            imageURL: buildImageURL(category.image)
        };
    },

    async deleteCategory(categoryId) {
        const category = await Category.findById(categoryId);

        if (!category) {
            throw new Error('Category not found');
        }

        const courseCount = await Course.countDocuments({ category: category.name });

        if (courseCount > 0) {
            throw new Error(`Cannot delete category. ${courseCount} course(s) are using this category`);
        }

        if (category.image && !category.image.startsWith('http')) {
            await deleteOldProfileImage(category.image);
        }

        await Category.findByIdAndDelete(categoryId);

        return { message: 'Category deleted successfully' };
    },

    async toggleCategoryStatus(categoryId) {
        const category = await Category.findById(categoryId);

        if (!category) {
            throw new Error('Category not found');
        }

        category.isActive = !category.isActive;
        await category.save();

        return {
            ...category.toJSON(),
            imageURL: buildImageURL(category.image)
        };
    }
};

module.exports = categoryService;
