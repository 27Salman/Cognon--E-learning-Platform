const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Offer title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        offerType: {
            type: String,
            enum: {
                values: ['course', 'category', 'platform'],
                message: 'Offer type must be course, category, or platform'
            },
            required: [true, 'Offer type is required']
        },
        targetIds: [{
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'targetModel'
        }],
        targetModel: {
            type: String,
            enum: ['Category', 'Course']
        },
        discountPercentage: {
            type: Number,
            required: [true, 'Discount percentage is required'],
            min: [1, 'Discount must be at least 1%'],
            max: [100, 'Discount cannot exceed 100%']
        },
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
        usageCount: {
            type: Number,
            default: 0
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

offerSchema.index({ offerType: 1, isActive: 1 });
offerSchema.index({ validFrom: 1, validUntil: 1 });
offerSchema.index({ targetIds: 1 });

offerSchema.virtual('isExpired').get(function () {
    return new Date() > this.validUntil;
});

offerSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive && now >= this.validFrom && now <= this.validUntil;
});

offerSchema.pre('validate', function (next) {
    if (this.validUntil <= this.validFrom) {
        next(new Error('Valid until date must be after valid from date'));
    }
    next();
});

offerSchema.pre('validate', function (next) {
    if ((this.offerType === 'course' || this.offerType === 'category') && (!this.targetIds || this.targetIds.length === 0)) {
        next(new Error(`Target IDs are required for ${this.offerType} offers`));
    }
    next();
});

offerSchema.methods.toJSON = function () {
    const offer = this.toObject();
    delete offer.__v;
    return offer;
};

module.exports = mongoose.model('Offer', offerSchema);



