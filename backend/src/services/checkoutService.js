const Razorpay = require("razorpay");
const crypto = require("crypto");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Course = require("../models/Course");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const Wishlist = require("../models/Wishlist");
const cartService = require("./cartService");
const couponService = require("./couponService");
const walletService = require("./walletService");
const {
  PLATFORM_COMMISSION,
  NOTIFICATION_TYPES,
  NOTIFICATION_ACTIONS,
} = require("../config/constants");
const CourseRestrict = require("../models/CourseRestrict");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const notificationService = require("./notificationService");

const checkoutService = {
  async calculatePrice(userId, couponCode) {
    const cartData = await cartService.getCart(userId);

    if (cartData.items.length === 0) {
      throw new Error("Your cart is empty");
    }

    if (cartData.hasUnavailable) {
      const names = cartData.items
        .filter((i) => !i.isAvailable)
        .map((i) => i.course.title)
        .join(", ");
      throw new Error(
        `These courses are no longer available: ${names}. Remove them from your cart.`,
      );
    }

    let subtotal = cartData.subtotal;
    let couponDiscount = 0;
    let couponInfo = null;

    if (couponCode) {
      const courseIds = cartData.items.map((item) => item.course._id);
      const couponResult = await couponService.validateCoupon(
        couponCode,
        userId,
        subtotal,
        courseIds,
      );
      couponDiscount = couponResult.discount;
      couponInfo = {
        code: couponResult.coupon.code,
        discountType: couponResult.coupon.discountType,
        discountValue: couponResult.coupon.discountValue,
        discount: couponDiscount,
      };
    }

    const finalAmount = Math.max(0, subtotal - couponDiscount);
    const round2 = (n) => Math.round(n * 100) / 100;

    return {
      items: cartData.items,
      subtotal: round2(subtotal),
      couponDiscount: round2(couponDiscount),
      coupon: couponInfo,
      finalAmount: round2(finalAmount),
      totalItems: cartData.totalItems,
    };
  },

  async createRazorpayOrder(userId, couponCode) {
    const priceData = await checkoutService.calculatePrice(userId, couponCode);

    if (priceData.finalAmount === 0) {
      throw new Error("Order amount cannot be zero");
    }

    for (let num of priceData.items) {
      const restriction = await CourseRestrict.findOne({
        userId,
        courseId: num.course._id,
      });

      if (restriction?.blocked) {
        throw new Error(
          `You are blocked from purchasing the course: ${num.course.title}`,
        );
      }
    }

    const cartCourseIds = priceData.items
      .map((item) => item.course._id.toString())
      .sort();

    const existingOrder = await Order.findOne({
      user: userId,
      paymentStatus: { $in: ["pending", "failed"] },
    }).sort({ createdAt: -1 });

    if (existingOrder) {
      const existingCourseIds = existingOrder.courses
        .map((c) => c.course.toString())
        .sort();
      const isSameCart =
        JSON.stringify(existingCourseIds) === JSON.stringify(cartCourseIds);
      const isSameAmount = existingOrder.finalAmount === priceData.finalAmount;

      if (isSameCart && isSameAmount) {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(existingOrder.finalAmount * 100),
          currency: "INR",
          receipt: `reuse_${Date.now()}`,
          notes: { userId: userId.toString() },
        });

        existingOrder.razorpayOrderId = razorpayOrder.id;
        existingOrder.paymentStatus = "pending";
        await existingOrder.save();

        return {
          razorpayOrderId: razorpayOrder.id,
          amount: existingOrder.finalAmount,
          currency: "INR",
          priceBreakdown: priceData,
          keyId: process.env.RAZORPAY_KEY_ID,
        };
      }
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(priceData.finalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        couponCode: couponCode || "",
      },
    });

    const round2 = (n) => Math.round(n * 100) / 100;
    let allocatedTotal = 0;
    const orderCourses = priceData.items.map((item, idx) => {
      const isLast = idx === priceData.items.length - 1;
      const courseWeight =
        priceData.subtotal > 0
          ? item.finalPrice / priceData.subtotal
          : 1 / priceData.items.length;

      const courseActualAmount = isLast
        ? round2(priceData.finalAmount - allocatedTotal)
        : round2(priceData.finalAmount * courseWeight);

      allocatedTotal = round2(allocatedTotal + courseActualAmount);

      const tutorShare = round2(
        courseActualAmount * PLATFORM_COMMISSION.TUTOR_SHARE,
      );
      const platformShare = round2(courseActualAmount - tutorShare);

      return {
        course: item.course._id,
        tutor: item.course.tutor._id,
        courseTitle: item.course.title,
        courseCategory: item.course.category || "",
        originalPrice: item.originalPrice,
        discountedPrice: item.finalPrice,
        tutorShare,
        platformShare,
      };
    });

    const pendingOrder = new Order({
      user: userId,
      courses: orderCourses,
      subtotal: priceData.subtotal,
      discount: priceData.couponDiscount,
      couponCode: couponCode || null,
      finalAmount: priceData.finalAmount,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
      orderDate: new Date(),
    });

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) pendingOrder.couponApplied = coupon._id;
    }

    await pendingOrder.save();

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: priceData.finalAmount,
      currency: "INR",
      priceBreakdown: priceData,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  },

  async verifyPaymentAndCreateOrder(userId, paymentData) {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      couponCode,
    } = paymentData;

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new Error("Payment verification failed. Invalid signature.");
    }

    const order = await Order.findOne({ razorpayOrderId, user: userId });
    if (!order) {
      throw new Error("Order not found. Please contact support.");
    }

    if (order.paymentStatus === "completed") {
      return await Order.findById(order._id)
        .populate("user", "name email phone")
        .populate("courses.course", "title thumbnail")
        .populate("courses.tutor", "name email");
    }

    order.paymentStatus = "completed";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentCompletedAt = new Date();
    await order.save();

    // Enroll
    const courseIds = order.courses.map((c) => c.course);
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { studentsEnrolled: userId } },
    );

    const student = await User.findById(userId).select(
      "studentProfile.enrolledCourses",
    );
    const alreadyEnrolledIds = (
      student?.studentProfile?.enrolledCourses || []
    ).map((e) => e.courseId.toString());

    for (const item of order.courses) {
      if (!alreadyEnrolledIds.includes(item.course.toString())) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            "studentProfile.enrolledCourses": {
              courseId: item.course,
              enrolledAt: new Date(),
              progress: 0,
              completedLessons: [],
            },
          },
        });
      }
    }

    //revenue
    for (const item of order.courses) {
      await Course.findByIdAndUpdate(item.course, {
        $inc: { revenue: item.discountedPrice },
      });
    }

    if (order.couponCode) {
      const coupon = await Coupon.findOne({
        code: order.couponCode.toUpperCase(),
      });
      if (coupon) {
        coupon.usageCount += 1;
        const userUsage = coupon.usedBy.find(
          (u) => u.user.toString() === userId.toString(),
        );
        if (userUsage) {
          userUsage.usedCount += 1;
          userUsage.lastUsedAt = new Date();
        } else {
          coupon.usedBy.push({
            user: userId,
            usedCount: 1,
            lastUsedAt: new Date(),
          });
        }
        await coupon.save();
      }
    }

    await walletService.creditFromOrder(order);

    //notify student
    await notificationService.create({
      recipient: userId,
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: "Payment successful!",
      message: `Your payment of ₹${order.finalAmount} for ${order.courses.length} course(s) was successful.`,
      priority: "high",
      actionUrl: NOTIFICATION_ACTIONS.PAYMENT_SUCCESS(order._id),
      data: { orderId: order._id, amount: order.finalAmount },
    });

    //notify tutor
    for (const item of order.courses) {
      await notificationService.create({
        recipient: item.tutor,
        type: NOTIFICATION_TYPES.NEW_ENROLLMENT,
        title: "New student enrolled",
        message: `A student has enrolled in "${item.courseTitle}". Earnings: ₹${item.tutorShare}.`,
        priority: "medium",
        actionUrl: NOTIFICATION_ACTIONS.TUTOR_COURSE(item.course),
        data: {
          courseId: item.course,
          courseTitle: item.courseTitle,
          amount: item.tutorShare,
        },
      });
    }

    //notify admin
    const adminUser = await User.findOne({ role: "admin" }).select("_id");
    if (adminUser) {
      await notificationService.create({
        recipient: adminUser._id,
        type: NOTIFICATION_TYPES.NEW_ORDER,
        title: "New order received",
        message: `Order ${order.orderId} for ₹${order.finalAmount} has been completed.`,
        priority: "low",
        actionUrl: NOTIFICATION_ACTIONS.ADMIN_ORDER(order._id),
        data: { orderId: order._id, amount: order.finalAmount },
      });
    }

    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { courses: { $in: courseIds } } },
    );

    return await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate("courses.course", "title thumbnail")
      .populate("courses.tutor", "name email");
  },

  async retryPayment(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "completed")
      throw new Error("Order is already paid");
    if (order.paymentStatus !== "failed" && order.paymentStatus !== "pending") {
      throw new Error("Order cannot be retried");
    }

    const courseIds = order.courses.map((c) => c.course);
    const alreadyPurchased = await Order.findOne({
      user: userId,
      _id: { $ne: order._id },
      paymentStatus: "completed",
      "courses.course": { $in: courseIds },
    });

    if (alreadyPurchased) {
      order.paymentStatus = "failed";
      await order.save();
      throw new Error(
        "You have already purchased one or more courses in this order. This order has been cancelled.",
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.finalAmount * 100),
      currency: "INR",
      receipt: `retry_${Date.now()}`,
      notes: { userId: userId.toString(), retryOrderId: order._id.toString() },
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "pending";
    await order.save();

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: order.finalAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
    };
  },

  async payWithWallet(userId, couponCode) {
    const priceData = await checkoutService.calculatePrice(userId, couponCode);

    if (priceData.finalAmount === 0)
      throw new Error("Order amount cannot be zero");

    const studentWallet = await walletService.getOrCreateWallet(
      userId,
      "student",
    );
    if (studentWallet.balance < priceData.finalAmount) {
      throw new Error("Insufficient wallet balance");
    }

    for (const num of priceData.items) {
      const restriction = await CourseRestrict.findOne({
        userId,
        courseId: num.course._id,
      });
      if (restriction?.blocked) {
        throw new Error(
          `You are blocked from purchasing the course: ${num.course.title}`,
        );
      }
    }

    const round2 = (n) => Math.round(n * 100) / 100;
    let allocatedTotal = 0;
    const orderCourses = priceData.items.map((item, idx) => {
      const isLast = idx === priceData.items.length - 1;
      const courseWeight =
        priceData.subtotal > 0
          ? item.finalPrice / priceData.subtotal
          : 1 / priceData.items.length;
      const courseActualAmount = isLast
        ? round2(priceData.finalAmount - allocatedTotal)
        : round2(priceData.finalAmount * courseWeight);
      allocatedTotal = round2(allocatedTotal + courseActualAmount);
      const tutorShare = round2(
        courseActualAmount * PLATFORM_COMMISSION.TUTOR_SHARE,
      );
      const platformShare = round2(courseActualAmount - tutorShare);
      return {
        course: item.course._id,
        tutor: item.course.tutor._id,
        courseTitle: item.course.title,
        courseCategory: item.course.category || "",
        originalPrice: item.originalPrice,
        discountedPrice: item.finalPrice,
        tutorShare,
        platformShare,
      };
    });

    const order = new Order({
      user: userId,
      courses: orderCourses,
      subtotal: priceData.subtotal,
      discount: priceData.couponDiscount,
      couponCode: couponCode || null,
      finalAmount: priceData.finalAmount,
      paymentMethod: "wallet",
      paymentStatus: "completed",
      orderDate: new Date(),
      paymentCompletedAt: new Date(),
    });

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) order.couponApplied = coupon._id;
    }

    await order.save();

    studentWallet.balance = round2(
      studentWallet.balance - priceData.finalAmount,
    );
    studentWallet.transactions.push({
      type: "debit",
      amount: priceData.finalAmount,
      description: `Course purchase — order ${order.orderId}`,
      orderId: order.orderId,
      status: "completed",
    });

    await studentWallet.save();

    await walletService.creditFromOrder(order);

    //notify student
    await notificationService.create({
      recipient: userId,
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: "Payment successful!",
      message: `Your payment of ₹${order.finalAmount} for ${order.courses.length} course(s) was successful.`,
      priority: "high",
      actionUrl: NOTIFICATION_ACTIONS.PAYMENT_SUCCESS(order._id),
      data: { orderId: order._id, amount: order.finalAmount },
    });

    //notify tutor
    for (const item of order.courses) {
      await notificationService.create({
        recipient: item.tutor,
        type: NOTIFICATION_TYPES.NEW_ENROLLMENT,
        title: "New student enrolled",
        message: `A student has enrolled in "${item.courseTitle}". Earnings: ₹${item.tutorShare}.`,
        priority: "medium",
        actionUrl: NOTIFICATION_ACTIONS.TUTOR_COURSE(item.course),
        data: {
          courseId: item.course,
          courseTitle: item.courseTitle,
          amount: item.tutorShare,
        },
      });
    }

    //notify admin
    const adminUser = await User.findOne({ role: "admin" }).select("_id");
    if (adminUser) {
      await notificationService.create({
        recipient: adminUser._id,
        type: NOTIFICATION_TYPES.NEW_ORDER,
        title: "New order received",
        message: `Order ${order.orderId} for ₹${order.finalAmount} has been completed.`,
        priority: "low",
        actionUrl: NOTIFICATION_ACTIONS.ADMIN_ORDER(order._id),
        data: { orderId: order._id, amount: order.finalAmount },
      });
    }

    const courseIds = order.courses.map((c) => c.course);
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { studentsEnrolled: userId } },
    );

    const student = await User.findById(userId).select(
      "studentProfile.enrolledCourses",
    );
    const alreadyEnrolledIds = (
      student?.studentProfile?.enrolledCourses || []
    ).map((e) => e.courseId.toString());

    for (const item of order.courses) {
      if (!alreadyEnrolledIds.includes(item.course.toString())) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            "studentProfile.enrolledCourses": {
              courseId: item.course,
              enrolledAt: new Date(),
              progress: 0,
              completedLessons: [],
            },
          },
        });
      }
      await Course.findByIdAndUpdate(item.course, {
        $inc: { revenue: item.discountedPrice },
      });
    }

    // Update coupon usage
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        coupon.usageCount += 1;
        const userUsage = coupon.usedBy.find(
          (u) => u.user.toString() === userId.toString(),
        );
        if (userUsage) {
          userUsage.usedCount += 1;
          userUsage.lastUsedAt = new Date();
        } else {
          coupon.usedBy.push({
            user: userId,
            usedCount: 1,
            lastUsedAt: new Date(),
          });
        }
        await coupon.save();
      }
    }

    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { courses: { $in: courseIds } } },
    );

    return await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate("courses.course", "title thumbnail")
      .populate("courses.tutor", "name email");
  },

  async handleWebhook(body, signature) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn(
        "RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification",
      );
    } else {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest("hex");

      if (expectedSignature !== signature) {
        throw new Error("Invalid webhook signature");
      }
    }

    const event = body.event;
    const payload = body.payload;

    if (event === "payment.failed") {
      const razorpayOrderId = payload.payment.entity.order_id;
      await Order.findOneAndUpdate(
        { razorpayOrderId },
        { paymentStatus: "failed" },
      );
    }

    return { received: true };
  },
};

module.exports = checkoutService;
