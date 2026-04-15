const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: [3, 'Coupon code must be at least 3 characters'],
            maxlength: [20, 'Coupon code cannot exceed 20 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters']
        },
        discountType: {
            type: String,
            enum: {
                values: ['percentage', 'fixed'],
                message: 'Discount type must be either percentage or fixed'
            },
            required: [true, 'Discount type is required']
        },
        discountValue: {
            type: Number,
            required: [true, 'Discount value is required'],
            min: [0, 'Discount value cannot be negative']
        },
        minPurchaseAmount: {
            type: Number,
            default: 0,
            min: [0, 'Minimum purchase amount cannot be negative']
        },
        maxDiscountAmount: {
            type: Number,
            default: null,
            min: [0, 'Maximum discount amount cannot be negative']
        },
        applicableTo: {
            type: String,
            enum: {
                values: ['all', 'category', 'course'],
                message: 'Applicable to must be all, category, or course'
            },
            default: 'all'
        },
        applicableIds: [{
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'applicableToModel'
        }],
        applicableToModel: {
            type: String,
            enum: ['Category', 'Course']
        },
        usageLimit: {
            type: Number,
            default: null,
            min: [1, 'Usage limit must be at least 1']
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0
        },
        perUserLimit: {
            type: Number,
            default: 1,
            min: [1, 'Per user limit must be at least 1']
        },
        usedBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            usedCount: {
                type: Number,
                default: 0
            },
            lastUsedAt: {
                type: Date
            }
        }],
        validFrom: {
            type: Date,
            required: [true, 'Valid from date is required']
        },
        validUntil: {
            type: Date,
            required: [true, 'Valid until date is required']
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });

couponSchema.virtual('isExpired').get(function () {
    return new Date() > this.validUntil;
});

couponSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive && now >= this.validFrom && now <= this.validUntil;
});

couponSchema.virtual('isUsageLimitReached').get(function () {
    if (!this.usageLimit) return false;
    return this.usageCount >= this.usageLimit;
});

couponSchema.pre('validate', function (next) {
    if (this.validUntil <= this.validFrom) {
        next(new Error('Valid until date must be after valid from date'));
    }
    next();
});

couponSchema.methods.toJSON = function () {
    const coupon = this.toObject();
    delete coupon.__v;
    delete coupon.usedBy; 
    return coupon;
};

module.exports = mongoose.model('Coupon', couponSchema);




