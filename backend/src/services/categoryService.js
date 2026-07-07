const Category = require('../models/Category');
const Course = require('../models/Course');
const { deleteCloudinaryAsset } = require('./fileService');

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
            image: file ? file.path : null
        });

        await category.save();

        return category.toJSON();
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
                .sort({ name: 1 })
                .skip(skip)
                .limit(limitNum),
            Category.countDocuments(query)
        ]);

        const categoriesWithURL = categories.map(cat => cat.toJSON());

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

        return category.toJSON();
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
            if (category.image) {
                await deleteCloudinaryAsset(category.image);
            }
            category.image = file.path;
        }

        await category.save();

        if (nameChanged) {
            await Course.updateMany(
                { category: oldName },
                { $set: { category: category.name } }
            );
        }

        return category.toJSON();
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

        if (category.image) {
            await deleteCloudinaryAsset(category.image);
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

        return category.toJSON();
    }
};

module.exports = categoryService;
