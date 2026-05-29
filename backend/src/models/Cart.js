const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        items: [cartItemSchema],
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

cartSchema.index({ user: 1 });

cartSchema.virtual('totalItems').get(function () {
    return this.items.length;
});

cartSchema.virtual('subtotal').get(function () {
    return this.items.reduce((total, item) => total + item.price, 0);
});

cartSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

cartSchema.methods.toJSON = function () {
    const cart = this.toObject();
    delete cart.__v;
    return cart;
};

module.exports = mongoose.model('Cart', cartSchema);
