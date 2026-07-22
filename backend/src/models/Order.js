const mongoose = require("mongoose");

const orderCourseSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseTitle: {
    type: String,
    required: true,
  },
  courseCategory: {
    type: String,
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountedPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  tutorShare: {
    type: Number,
    required: true,
    min: 0,
  },
  platformShare: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courses: [orderCourseSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    couponCode: {
      type: String,
    },
    offerApplied: {
      type: String,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "card", "upi", "netbanking", "wallet"],
      default: "razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    paymentCompletedAt: {
      type: Date,
      default: null,
    },
    invoiceUrl: {
      type: String,
    },
    invoiceNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ orderId: 1 });
orderSchema.index({ user: 1, orderDate: -1 });
orderSchema.index({ paymentStatus: 1, orderDate: -1 });
orderSchema.index({ "courses.tutor": 1, orderDate: -1 });

orderSchema.pre("validate", async function () {
  if (!this.orderId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderId = `ORD-${year}${month}${day}-${random}`;
  }
});

orderSchema.methods.toJSON = function () {
  const order = this.toObject();
  delete order.__v;
  return order;
};

module.exports = mongoose.model("Order", orderSchema);
