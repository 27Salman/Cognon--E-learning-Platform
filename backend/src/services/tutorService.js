const User = require("../models/User");
const Course = require("../models/Course");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Review = require("../models/Review");
const { COURSE_STATUS, HTTP_STATUS } = require("../config/constants");
const cloudinary = require("../config/cloudinary");
const { createOTP, verifyOTP } = require("./otpService");
const { sendOTPEmail } = require("./emailService");
const mongoose = require("mongoose");
const { deleteCloudinaryAsset } = require("./fileService");

const tutorService = {
  async getProfile(tutorId) {
    const tutor = await User.findById(tutorId).select("-password");
    if (!tutor) throw new Error("Tutor not found");

    const courses = await Course.find({ tutor: tutorId });
    const totalCourses = courses.length;
    const uniqueStudentIds = new Set();
    courses.forEach((course) => {
      (course.studentsEnrolled || []).forEach((id) =>
        uniqueStudentIds.add(id.toString()),
      );
    });
    const totalStudents = uniqueStudentIds.size;

    tutor.totalCourses = totalCourses;
    tutor.totalStudents = totalStudents;
    await tutor.save();

    return tutor;
  },

  async updateProfile(tutorId, { name, phone, subject, bio }, file) {
    const tutor = await User.findById(tutorId);
    if (!tutor) throw new Error("Tutor not found");

    if (name) tutor.name = name;
    if (phone) tutor.phone = phone;
    if (subject !== undefined) tutor.tutorProfile.subject = subject;
    if (bio !== undefined) tutor.tutorProfile.bio = bio;

    if (file) {
      if (tutor.profileImage) {
        await deleteCloudinaryAsset(tutor.profileImage);
      }
      tutor.profileImage = file.path;
    }

    await tutor.save({ validateModifiedOnly: true });

    return {
      _id: tutor._id,
      name: tutor.name,
      email: tutor.email,
      phone: tutor.phone,
      profileImage: tutor.profileImage,
      profileImageURL: tutor.profileImage,
      tutorProfile: tutor.tutorProfile,
      role: tutor.role,
      status: tutor.status,
    };
  },

  async requestEmailChange(tutorId, tutorRole, currentEmail, newEmail) {
    const existing = await User.findOne({
      email: newEmail.toLowerCase(),
      role: tutorRole,
      _id: { $ne: tutorId },
    });
    if (existing) throw new Error("Email already in use");

    const otp = await createOTP(currentEmail, "email_change", newEmail);
    await sendOTPEmail(newEmail, otp, "email_change");

    return `OTP sent to ${newEmail}`;
  },

  async verifyEmailChange(tutorId, currentEmail, newEmail, otp) {
    const otpDoc = await verifyOTP(currentEmail, otp, "email_change");
    if (otpDoc.newEmail !== newEmail) throw new Error("Email mismatch");

    const tutor = await User.findById(tutorId);
    tutor.email = newEmail;
    await tutor.save();

    return tutor;
  },

  async requestPasswordChange(tutorEmail) {
    const otp = await createOTP(tutorEmail, "password_change");
    await sendOTPEmail(tutorEmail, otp, "password_change");

    return `OTP sent to ${tutorEmail}`;
  },

  async verifyPasswordChange(tutorId, tutorEmail, newPassword, otp) {
    await verifyOTP(tutorEmail, otp, "password_change");

    const tutor = await User.findById(tutorId);
    tutor.password = newPassword;
    await tutor.save();
  },

  async getTutorDashboard(tutorId) {
    const courses = await Course.find({ tutor: tutorId });

    const totalCourses = courses.length;
    const activeCourses = courses.filter(
      (c) => c.status === COURSE_STATUS.PUBLISHED,
    ).length;

    const totalStudents = courses.reduce((sum, course) => {
      return (
        sum + (course.studentsEnrolled ? course.studentsEnrolled.length : 0)
      );
    }, 0);

    const orders = await Order.find({
      "courses.tutor": tutorId,
      paymentStatus: "completed",
    }).select("courses orderDate");

    let totalRevenue = 0;
    for (const order of orders) {
      for (const item of order.courses) {
        if (item.tutor.toString() === tutorId.toString()) {
          totalRevenue += item.tutorShare;
        }
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await Order.find({
      "courses.tutor": tutorId,
      paymentStatus: "completed",
      orderDate: { $gte: sevenDaysAgo },
    }).select("courses orderDate");

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyMap = {};
    days.forEach((d) => {
      weeklyMap[d] = { day: d, students: 0, revenue: 0 };
    });

    for (const order of recentOrders) {
      const dayName = days[new Date(order.orderDate).getDay()];
      for (const item of order.courses) {
        if (item.tutor.toString() === tutorId.toString()) {
          weeklyMap[dayName].students += 1;
          weeklyMap[dayName].revenue += item.tutorShare;
        }
      }
    }

    const weeklyChart = days.map((d) => ({
      day: d,
      students: weeklyMap[d].students,
      revenue: Math.round(weeklyMap[d].revenue),
    }));

    const recentCourses = courses
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        status: c.status,
        price: c.price,
        studentsCount: c.studentsEnrolled ? c.studentsEnrolled.length : 0,
        revenue: c.revenue || 0,
      }));

    return {
      totalCourses,
      activeCourses,
      totalStudents,
      totalRevenue: Math.round(totalRevenue),
      weeklyChart,
      recentCourses,
    };
  },

  async getRevenueDashboard(tutorId) {
    const courses = await Course.find({ tutor: tutorId }).select(
      "title price studentsEnrolled status thumbnail category createdAt revenue",
    );

    if (courses.length === 0) {
      return {
        summary: {
          totalEarnings: 0,
          totalEnrollments: 0,
          totalCourses: 0,
          activeCourses: 0,
        },
        monthlyRevenue: [],
        courses: [],
        recentEnrollments: [],
      };
    }

    const orders = await Order.find({
      "courses.tutor": tutorId,
      paymentStatus: "completed",
    })
      .populate("user", "name email profileImage")
      .populate("courses.course", "title thumbnail")
      .sort({ orderDate: -1 });

    const courseRevenueMap = {};
    let totalEarnings = 0;
    const recentEnrollments = [];

    for (const order of orders) {
      for (const item of order.courses) {
        if (item.tutor.toString() === tutorId.toString()) {
          const cid = item.course?._id?.toString() || item.course?.toString();
          if (!courseRevenueMap[cid]) {
            courseRevenueMap[cid] = { grossRevenue: 0, tutorEarning: 0 };
          }
          courseRevenueMap[cid].grossRevenue += item.discountedPrice || 0;
          courseRevenueMap[cid].tutorEarning += item.tutorShare || 0;
          totalEarnings += item.tutorShare || 0;

          if (recentEnrollments.length < 10) {
            recentEnrollments.push({
              student: order.user,
              course: item.course,
              courseTitle: item.courseTitle,
              originalPrice: item.originalPrice,
              finalPrice: item.discountedPrice,
              tutorEarning: item.tutorShare,
              couponUsed: order.couponCode ? order.couponCode : null,
              purchaseDate: order.orderDate,
            });
          }
        }
      }
    }

    const monthlyRevenue = await this.getMonthlyRevenue(tutorId);

    const courseRevenue = courses.map((course) => {
      const cid = course._id.toString();
      const revenueData = courseRevenueMap[cid] || {
        grossRevenue: 0,
        tutorEarning: 0,
      };
      const enrolledCount = course.studentsEnrolled
        ? course.studentsEnrolled.length
        : 0;
      return {
        _id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        category: course.category,
        price: course.price,
        status: course.status,
        enrolledCount,
        totalRevenue: Math.round(revenueData.grossRevenue),
        tutorEarning: Math.round(revenueData.tutorEarning),
        createdAt: course.createdAt,
      };
    });

    courseRevenue.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalGrossRevenue = courseRevenue.reduce(
      (sum, c) => sum + c.totalRevenue,
      0,
    );

    const summary = {
      totalEarnings: Math.round(totalEarnings),
      totalRevenue: Math.round(totalGrossRevenue),
      totalEnrollments: courses.reduce(
        (sum, c) => sum + (c.studentsEnrolled?.length || 0),
        0,
      ),
      totalCourses: courses.length,
      activeCourses: courses.filter((c) => c.status === COURSE_STATUS.PUBLISHED)
        .length,
    };

    const wallet = await Wallet.findOne({ owner: tutorId });
    const now = new Date();
    let pendingEarnings = 0;
    let availableEarnings = 0;
    if (wallet) {
      for (const txn of wallet.transactions) {
        if (txn.type !== "credit") continue;
        if (txn.status === "cancelled" || txn.status === "refunded") continue;
        if (txn.status === "pending" && txn.releaseAt && txn.releaseAt > now) {
          pendingEarnings += txn.amount;
        } else if (txn.status === "completed") {
          availableEarnings += txn.amount;
        }
      }
    }
    summary.pendingEarnings = Math.round(pendingEarnings);
    summary.availableEarnings = Math.round(availableEarnings);

    return {
      summary,
      monthlyRevenue,
      courses: courseRevenue,
      recentEnrollments,
    };
  },

  async getMonthlyRevenue(tutorId) {
    const twelveMonthsAgo = new Date();

    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      "courses.tutor": tutorId,
      paymentStatus: "completed",
      orderDate: { $gte: twelveMonthsAgo },
    });

    const monthlyMap = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { month: key, revenue: 0, enrollments: 0 };
    }

    for (const order of orders) {
      const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        for (const item of order.courses) {
          if (item.tutor.toString() === tutorId.toString()) {
            monthlyMap[key].revenue += item.tutorShare;
            monthlyMap[key].enrollments += 1;
          }
        }
      }
    }

    return Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, revenue: Math.round(m.revenue) }));
  },

  async getCourseRevenueDetails(
    tutorId,
    courseId,
    { search, page = 1, limit = 5 } = {},
  ) {
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) throw new Error("Course not found");

    const query = {
      "courses.tutor": tutorId,
      "courses.course": courseId,
      paymentStatus: "completed",
    };

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 5));
    const skip = (pageNum - 1) * limitNum;

    const [allOrders, pagedOrders, totalFiltered] = await Promise.all([
      Order.find(query).select("courses couponCode"),
      Order.find(query)
        .populate("user", "name email profileImage")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    let grossRevenue = 0;
    let tutorTotalEarning = 0;
    let totalDiscount = 0;
    let couponUsageCount = 0;

    for (const order of allOrders) {
      const item = order.courses.find(
        (c) => c.course.toString() === courseId.toString(),
      );
      if (item) {
        grossRevenue += item.discountedPrice || 0;
        tutorTotalEarning += item.tutorShare || 0;
        totalDiscount += item.originalPrice - item.discountedPrice || 0;
        if (order.couponCode) couponUsageCount += 1;
      }
    }

    const totalEnrollments = allOrders.length;
    const avgDiscount =
      totalEnrollments > 0 ? Math.round(totalDiscount / totalEnrollments) : 0;

    const enrollments = pagedOrders.map((order) => {
      const courseItem = order.courses.find(
        (item) => item.course.toString() === courseId.toString(),
      );
      return {
        student: order.user,
        originalPrice: courseItem?.originalPrice || course.price,
        finalPrice: courseItem?.discountedPrice || course.price,
        tutorEarning: courseItem?.tutorShare || 0,
        couponUsed: order.couponCode || null,
        purchaseDate: order.orderDate,
        orderId: order.orderId,
      };
    });

    const filtered = search
      ? enrollments.filter(
          (e) =>
            e.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
            e.student?.email?.toLowerCase().includes(search.toLowerCase()),
        )
      : enrollments;

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalFiltered / limitNum),
      totalFiltered,
      limit: limitNum,
    };

    return {
      course: {
        _id: course._id,
        title: course.title,
        price: course.price,
        status: course.status,
        totalEnrollments,
        grossRevenue: Math.round(grossRevenue),
        tutorTotalEarning: Math.round(tutorTotalEarning),
        avgDiscount,
        couponUsageCount,
      },
      enrollments: filtered,
      pagination,
    };
  },

  async getTutorSalesReport(tutorId, { dateFrom, dateTo } = {}) {
    const query = {
      "courses.tutor": tutorId,
      paymentStatus: { $nin: ["refunded", "failed", "pending"] },
    };

    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) query.orderDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.orderDate.$lte = end;
      }
    }

    const orders = await Order.find(query)
      .populate("user", "name")
      .sort({ orderDate: -1 });

    let totalEarnings = 0;
    let totalGross = 0;
    let totalEnrollments = 0;
    const courseMap = {};

    for (const order of orders) {
      for (const item of order.courses) {
        if (item.tutor.toString() !== tutorId.toString()) continue;

        totalEarnings += item.tutorShare || 0;
        totalGross += item.discountedPrice || 0;
        totalEnrollments += 1;

        const key = item.course?.toString() || item.courseTitle || "unknown";

        if (!courseMap[key]) {
          courseMap[key] = {
            courseTitle: item.courseTitle || key,
            courseCategory: item.courseCategory || "-",
            enrollments: 0,
            grossRevenue: 0,
            earnings: 0,
            totalSalePrice: 0,
          };
        }

        courseMap[key].enrollments += 1;
        courseMap[key].grossRevenue += item.discountedPrice || 0;
        courseMap[key].earnings += item.tutorShare || 0;
        courseMap[key].totalSalePrice += item.discountedPrice || 0;
      }
    }

    // Payment method
    const paymentMethodAgg = await Order.aggregate([
      {
        $match: {
          "courses.tutor": new mongoose.Types.ObjectId(tutorId),
          paymentStatus: { $nin: ["refunded", "failed", "pending"] },
          ...(dateFrom || dateTo
            ? {
                orderDate: {
                  ...(dateFrom ? { $gte: new Date(dateFrom) } : {}),
                  ...(dateTo
                    ? {
                        $lte: (() => {
                          const e = new Date(dateTo);
                          e.setHours(23, 59, 59, 999);
                          return e;
                        })(),
                      }
                    : {}),
                },
              }
            : {}),
        },
      },
      {
        $unwind: "$courses",
      },
      {
        $match: {
          "courses.tutor": new mongoose.Types.ObjectId(tutorId),
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$courses.tutorShare" },
        },
      },
    ]);

    const paymentMethods = {
      razorpay: { count: 0, revenue: 0 },
      wallet: { count: 0, revenue: 0 },
    };

    paymentMethodAgg.forEach((item) => {
      if (paymentMethods[item._id] !== undefined) {
        paymentMethods[item._id] = {
          count: item.count,
          revenue: item.revenue,
        };
      }
    });

    const round = (n) => Math.round(n * 100) / 100;

    const summary = {
      totalEarnings: round(totalEarnings),
      totalGross: round(totalGross),
      platformFee: round(totalGross - totalEarnings),
      totalEnrollments,
      totalCourses: Object.keys(courseMap).length,
      paymentMethods,
    };

    const courseBreakdown = Object.values(courseMap)
      .map((c) => ({
        courseTitle: c.courseTitle,
        courseCategory: c.courseCategory,
        enrollments: c.enrollments,
        grossRevenue: round(c.grossRevenue),
        earnings: round(c.earnings),
        avgSalePrice:
          c.enrollments > 0 ? round(c.totalSalePrice / c.enrollments) : 0,
      }))
      .sort((a, b) => b.earnings - a.earnings);

    const transactions = [];
    for (const order of orders) {
      for (const item of order.courses) {
        if (item.tutor.toString() !== tutorId.toString()) continue;

        const fullName = order.user?.name || "Student";
        const parts = fullName.trim().split(" ");
        const studentDisplay =
          parts.length > 1
            ? `${parts[0]} ${parts[parts.length - 1][0]}.`
            : parts[0];

        transactions.push({
          date: order.orderDate,
          courseTitle: item.courseTitle || "-",
          student: studentDisplay,
          salePrice: round(item.discountedPrice || 0),
          earnings: round(item.tutorShare || 0),
          coupon: order.couponCode || "-",
        });
      }
    }

    return { summary, courseBreakdown, transactions, dateFrom, dateTo };
  },

  async getPublicTutors({ search, page, limit, sortBy } = {}) {
    const query = {
      role: "tutor",
      status: "active",
      "tutorProfile.approvalStatus": "approved",
    };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { "tutorProfile.subject": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 8));
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { name: 1 };
    if (sortBy === "name_desc") {
      sortOption = { name: -1 };
    } else if (sortBy === "relevance") {
      sortOption = { createdAt: -1 };
    }

    const [tutors, totalFiltered] = await Promise.all([
      User.find(query)
        .select(
          "name email profileImage tutorProfile totalCourses totalStudents",
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    const tutorsWithStats = await Promise.all(
      tutors.map(async (t) => {
        const courses = await Course.find({
          tutor: t._id,
          status: "published",
        });
        let totalStudents = 0;
        let ratingSum = 0;
        let coursesWithRating = 0;
        courses.forEach((c) => {
          if (c.studentsEnrolled) {
            totalStudents += c.studentsEnrolled.length;
          }
          if (c.rating > 0) {
            ratingSum += c.rating;
            coursesWithRating++;
          }
        });
        const averageRating =
          coursesWithRating > 0
            ? Number((ratingSum / coursesWithRating).toFixed(1))
            : 0;
        const tObj = t.toJSON();
        tObj.profileImageURL = t.getProfileImageURL();
        tObj.averageRating = averageRating;
        tObj.totalCourses = courses.length;
        tObj.totalStudents = totalStudents;
        return tObj;
      }),
    );

    return {
      tutors: tutorsWithStats,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalFiltered / limitNum),
        totalTutors: totalFiltered,
        hasNext: pageNum < Math.ceil(totalFiltered / limitNum),
        hasPrev: pageNum > 1,
      },
    };
  },

  async getPublicTutorDetails(tutorId) {
    const tutor = await User.findById(tutorId).select("-password");

    if (!tutor || tutor.role !== "tutor") {
      const err = new Error("Tutor not found");
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const courses = await Course.find({ tutor: tutorId, status: "published" });
    const totalCourses = courses.length;

    const uniqueStudents = new Set();
    courses.forEach((course) => {
      if (course.studentsEnrolled) {
        course.studentsEnrolled.forEach((s) =>
          uniqueStudents.add(s.toString()),
        );
      }
    });
    const totalStudents = uniqueStudents.size;

    const courseIds = courses.map((c) => c._id);
    const totalReviews = await Review.countDocuments({
      course: { $in: courseIds },
    });

    tutor.totalCourses = totalCourses;
    tutor.totalStudents = totalStudents;
    await tutor.save({ validateModifiedOnly: true });

    const tutorObj = tutor.toJSON();
    tutorObj.profileImageURL = tutor.getProfileImageURL();

    return {
      tutor: tutorObj,
      stats: {
        totalCourses,
        totalStudents,
        totalReviews,
      },
    };
  },
};

module.exports = tutorService;
