const Coupon = require("../models/Coupon");
const Course = require("../models/Course");
const Category = require("../models/Category");

const couponService = {
  async createCoupon(adminId, couponData) {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      applicableTo,
      applicableIds,
      usageLimit,
      perUserLimit,
      validFrom,
      validUntil,
    } = couponData;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      throw new Error("Coupon code already exists");
    }
    if (!/^[A-Z0-9]+$/.test(code.toUpperCase())) {
      throw new Error("Coupon code must contain only letters and numbers");
    }
    const discountVal = Number(discountValue);
    const minPurchase = Number(minPurchaseAmount) || 0;
    const maxDiscount = maxDiscountAmount ? Number(maxDiscountAmount) : null;

    if (discountVal <= 0) {
      throw new Error("Discount value must be greater than 0");
    }
    if (discountType === "percentage" && discountVal > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }
    if (
      discountType === "fixed" &&
      minPurchase > 0 &&
      discountVal >= minPurchase
    ) {
      throw new Error(
        `Fixed discount (₹${discountVal}) must be less than minimum purchase amount (₹${minPurchase})`,
      );
    }
    if (
      discountType === "percentage" &&
      maxDiscount &&
      minPurchase > 0 &&
      maxDiscount >= minPurchase
    ) {
      throw new Error(
        `Max discount cap (₹${maxDiscount}) must be less than minimum purchase amount (₹${minPurchase})`,
      );
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      throw new Error("Expiry date must be after start date");
    }

    if (applicableTo !== "all" && applicableIds && applicableIds.length > 0) {
      if (applicableTo === "category") {
        const categories = await Category.find({ _id: { $in: applicableIds } });
        if (categories.length !== applicableIds.length) {
          throw new Error("One or more category IDs are invalid");
        }
      } else if (applicableTo === "course") {
        const courses = await Course.find({ _id: { $in: applicableIds } });
        if (courses.length !== applicableIds.length) {
          throw new Error("One or more course IDs are invalid");
        }
      }
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      applicableTo: applicableTo || "all",
      applicableIds: applicableIds || [],
      applicableToModel:
        applicableTo === "category"
          ? "Category"
          : applicableTo === "course"
            ? "Course"
            : undefined,
      usageLimit: usageLimit || null,
      perUserLimit: perUserLimit || 1,
      validFrom: (() => {
        const d = new Date(validFrom);
        d.setHours(0, 0, 0, 0);
        return d;
      })(),
      validUntil: (() => {
        const d = new Date(validUntil);
        d.setHours(23, 59, 59, 999);
        return d;
      })(),
      createdBy: adminId,
    });

    await coupon.save();
    return coupon;
  },

  async getCoupons({
    search,
    isActive,
    applicableTo,
    page = 1,
    limit = 5,
    createdBy,
  } = {}) {
    const query = {};

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (applicableTo && ["all", "category", "course"].includes(applicableTo)) {
      query.applicableTo = applicableTo;
    }

    if (search && search.trim()) {
      query.$or = [
        { code: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 5));
    const skip = (pageNum - 1) * limitNum;

    const [coupons, totalFiltered] = await Promise.all([
      Coupon.find(query)
        .populate("applicableIds")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Coupon.countDocuments(query),
    ]);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalFiltered / limitNum),
      totalFiltered,
      limit: limitNum,
    };

    return { coupons, pagination };
  },

  async updateCoupon(couponId, updateData) {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: updateData.code.toUpperCase(),
        _id: { $ne: couponId },
      });
      if (existingCoupon) {
        throw new Error("Coupon code already exists");
      }
      coupon.code = updateData.code.toUpperCase();
    }

    if (updateData.description !== undefined)
      coupon.description = updateData.description;
    if (updateData.discountType) coupon.discountType = updateData.discountType;
    if (updateData.discountValue !== undefined)
      coupon.discountValue = updateData.discountValue;
    if (updateData.minPurchaseAmount !== undefined)
      coupon.minPurchaseAmount = updateData.minPurchaseAmount;
    if (updateData.maxDiscountAmount !== undefined)
      coupon.maxDiscountAmount = updateData.maxDiscountAmount;
    if (updateData.applicableTo) {
      coupon.applicableTo = updateData.applicableTo;
      coupon.applicableToModel =
        updateData.applicableTo === "category"
          ? "Category"
          : updateData.applicableTo === "course"
            ? "Course"
            : undefined;
    }
    if (updateData.applicableIds)
      coupon.applicableIds = updateData.applicableIds;
    if (updateData.usageLimit !== undefined)
      coupon.usageLimit = updateData.usageLimit;
    if (updateData.perUserLimit !== undefined)
      coupon.perUserLimit = updateData.perUserLimit;
    if (updateData.validFrom) {
      const d = new Date(updateData.validFrom);
      d.setHours(0, 0, 0, 0);
      coupon.validFrom = d;
    }
    if (updateData.validUntil) {
      const d = new Date(updateData.validUntil);
      d.setHours(23, 59, 59, 999);
      coupon.validUntil = d;
    }

    const discountVal = coupon.discountValue;
    const minPurchase = coupon.minPurchaseAmount || 0;
    const maxDiscount = coupon.maxDiscountAmount;

    if (discountVal <= 0) {
      throw new Error("Discount value must be greater than 0");
    }
    if (coupon.discountType === "percentage" && discountVal > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }
    if (
      coupon.discountType === "fixed" &&
      minPurchase > 0 &&
      discountVal >= minPurchase
    ) {
      throw new Error(
        `Fixed discount (₹${discountVal}) must be less than minimum purchase amount (₹${minPurchase})`,
      );
    }
    if (
      coupon.discountType === "percentage" &&
      maxDiscount &&
      minPurchase > 0 &&
      maxDiscount >= minPurchase
    ) {
      throw new Error(
        `Max discount cap (₹${maxDiscount}) must be less than minimum purchase amount (₹${minPurchase})`,
      );
    }
    if (coupon.validUntil <= coupon.validFrom) {
      throw new Error("Expiry date must be after start date");
    }

    await coupon.save();
    return coupon;
  },

  async deleteCoupon(couponId) {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    await Coupon.findByIdAndDelete(couponId);
    return { message: "Coupon deleted successfully" };
  },

  async toggleCouponStatus(couponId) {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return coupon;
  },

  //Student
  async validateCoupon(code, userId, cartTotal, courseIds) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).populate(
      "applicableIds",
    );

    if (!coupon) {
      throw new Error("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new Error("This coupon is no longer active");
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      throw new Error("This coupon is not yet valid");
    }
    if (now > coupon.validUntil) {
      throw new Error("This coupon has expired");
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new Error("This coupon has reached its usage limit");
    }

    const userUsage = coupon.usedBy.find(
      (u) => u.user.toString() === userId.toString(),
    );
    if (userUsage && userUsage.usedCount >= coupon.perUserLimit) {
      throw new Error(
        "You have already used this coupon the maximum number of times",
      );
    }

    if (cartTotal < coupon.minPurchaseAmount) {
      throw new Error(
        `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`,
      );
    }

    if (coupon.applicableTo === "course") {
      const applicableCourseIds = coupon.applicableIds.map((id) =>
        id.toString(),
      );
      const hasApplicableCourse = courseIds.some((id) =>
        applicableCourseIds.includes(id.toString()),
      );
      if (!hasApplicableCourse) {
        throw new Error(
          "This coupon is not applicable to the courses in your cart",
        );
      }
    } else if (coupon.applicableTo === "category") {
      const applicableCategoryIds = coupon.applicableIds.map((id) =>
        id._id ? id._id.toString() : id.toString(),
      );
      const applicableCategories = await Category.find({
        _id: { $in: applicableCategoryIds },
      }).select("name");
      const applicableCategoryNames = applicableCategories.map(
        (cat) => cat.name,
      );
      const courses = await Course.find({ _id: { $in: courseIds } }).select(
        "category",
      );
      const hasApplicableCategory = courses.some((course) =>
        applicableCategoryNames.includes(course.category),
      );

      if (!hasApplicableCategory) {
        throw new Error(
          "This coupon is not applicable to the courses in your cart",
        );
      }
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return {
      coupon,
      discount: Math.min(discount, cartTotal),
      finalAmount: Math.max(0, cartTotal - discount),
    };
  },

  async getAvailableCoupons(userId, courseIds = []) {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
      ],
    })
      .populate("applicableIds")
      .select(
        "code description discountType discountValue minPurchaseAmount maxDiscountAmount validUntil usedBy perUserLimit applicableTo applicableIds applicableToModel",
      )
      .sort({ discountValue: -1 })
      .limit(20);

    const eligible = coupons.filter((coupon) => {
      const userUsage = coupon.usedBy?.find(
        (u) => u.user?.toString() === userId?.toString(),
      );
      return !userUsage || userUsage.usedCount < coupon.perUserLimit;
    });

    let cartCourses = [];
    if (courseIds.length > 0) {
      cartCourses = await Course.find({ _id: { $in: courseIds } }).select(
        "category",
      );
    }

    return eligible.map((c) => {
      let applicable = true;
      if (courseIds.length > 0 && c.applicableTo !== "all") {
        if (c.applicableTo === "course") {
          const applicableCourseIds = c.applicableIds.map(
            (id) => id._id?.toString() || id.toString(),
          );
          applicable = courseIds.some((id) =>
            applicableCourseIds.includes(id.toString()),
          );
        } else if (c.applicableTo === "category") {
          const applicableCategoryNames = c.applicableIds
            .filter((cat) => cat && cat.name)
            .map((cat) => cat.name);
          applicable =
            applicableCategoryNames.length > 0
              ? cartCourses.some((course) =>
                  applicableCategoryNames.includes(course.category),
                )
              : false;
        }
      }
      return {
        _id: c._id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minPurchaseAmount: c.minPurchaseAmount,
        maxDiscountAmount: c.maxDiscountAmount,
        validUntil: c.validUntil,
        applicableTo: c.applicableTo,
        applicable,
      };
    });
  },
};

module.exports = couponService;
