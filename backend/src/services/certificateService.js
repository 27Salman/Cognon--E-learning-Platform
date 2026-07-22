const path = require("path");
const PDFDocument = require("pdfkit");
const Certificate = require("../models/Certificate");
const { HTTP_STATUS } = require("../config/constants");

const FONT_REGULAR = path.join(
  __dirname,
  "../../assets/fonts/Roboto-Regular.ttf",
);
const FONT_BOLD = path.join(__dirname, "../../assets/fonts/Roboto-Bold.ttf");

const certificateService = {
  async getCertificateById(certificateId, studentId) {
    const certificate = await Certificate.findOne({
      _id: certificateId,
      student: studentId,
    })
      .populate({
        path: "student",
        select: "name",
      })
      .populate({
        path: "course",
        select: "title tutor",
        populate: {
          path: "tutor",
          select: "name",
        },
      });

    if (!certificate) {
      const error = new Error("Certificate not found or unauthorized");
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return certificate;
  },

  async getUserCertificates(
    studentId,
    page = 1,
    limit = 10,
    search = "",
    sort = "latest",
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query = { student: studentId };

    if (search) {
      const Course = require("../models/Course");
      const matchingCourses = await Course.find({
        title: { $regex: search, $options: "i" },
      }).select("_id");
      const courseIds = matchingCourses.map((c) => c._id);
      query.course = { $in: courseIds };
    }

    let sortOption = { issuedAt: -1 };
    if (sort === "oldest") sortOption = { issuedAt: 1 };
    if (sort === "score_desc") sortOption = { score: -1 };
    if (sort === "score_asc") sortOption = { score: 1 };

    const certificates = await Certificate.find(query)
      .populate({ path: "student", select: "name" })
      .populate({
        path: "course",
        select: "title tutor",
        populate: { path: "tutor", select: "name" },
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Certificate.countDocuments(query);

    return {
      certificates,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalCertificates: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    };
  },

  // Public — verification
  async verifyCertificate(certificateNumber) {
    const certificate = await Certificate.findOne({ certificateNumber })
      .populate({ path: "student", select: "name" })
      .populate({
        path: "course",
        select: "title tutor",
        populate: { path: "tutor", select: "name" },
      });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return {
      valid: true,
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.student?.name,
      courseName: certificate.course?.title,
      instructorName: certificate.course?.tutor?.name,
      score: certificate.score,
      issuedAt: certificate.issuedAt,
    };
  },

  async generateCertificatePdf(certificateId, studentId) {
    const certificate = await this.getCertificateById(certificateId, studentId);

    const studentName = certificate.student.name;
    const courseName = certificate.course.title;
    const tutorName = certificate.course.tutor?.name || "Cognon Instructor";
    const certNumber = certificate.certificateNumber;
    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const W = doc.page.width;
      const H = doc.page.height;

      const LEFT_W = W * 0.65;
      const RIGHT_W = W - LEFT_W;
      const PAD = 56;

      // Right accent panel (Cognon brand color)
      doc.rect(LEFT_W, 0, RIGHT_W, H).fill("#2d1b69");

      doc.save();
      doc.rect(LEFT_W, 0, RIGHT_W, H).clip();
      doc
        .rect(LEFT_W + 18, 0, 22, H)
        .fillOpacity(0.18)
        .fill("#ffffff");
      doc
        .rect(LEFT_W + 50, 0, 10, H)
        .fillOpacity(0.1)
        .fill("#ffffff");
      doc.restore();
      doc.fillOpacity(1);

      // Right panel — "COURSE CERTIFICATE" vertical header
      doc
        .font(FONT_BOLD)
        .fontSize(13)
        .fillColor("#ffffff")
        .text("COURSE", LEFT_W + 28, 48, {
          width: RIGHT_W - 40,
          align: "center",
          characterSpacing: 3,
        });
      doc
        .font(FONT_BOLD)
        .fontSize(13)
        .fillColor("#ffffff")
        .text("CERTIFICATE", LEFT_W + 28, 68, {
          width: RIGHT_W - 40,
          align: "center",
          characterSpacing: 2,
        });

      // Cognon circular seal on right panel
      const sealCX = LEFT_W + RIGHT_W / 2;
      const sealCY = H * 0.52;
      const sealR = 72;

      doc.circle(sealCX, sealCY, sealR).lineWidth(2).stroke("#ffffff");
      doc
        .circle(sealCX, sealCY, sealR - 10)
        .lineWidth(0.8)
        .stroke("#ffffff");
      doc
        .font(FONT_BOLD)
        .fontSize(18)
        .fillColor("#ffffff")
        .text("Cognon", sealCX - 38, sealCY - 12, {
          width: 76,
          align: "center",
        });
      doc
        .font(FONT_REGULAR)
        .fontSize(7)
        .fillColor("#c4b5fd")
        .text("E-LEARNING PLATFORM", sealCX - 44, sealCY + 10, {
          width: 88,
          align: "center",
          characterSpacing: 1,
        });

      // Verify URL below seal
      doc
        .font(FONT_REGULAR)
        .fontSize(7)
        .fillColor("#c4b5fd")
        .text(
          `Verify at cognon.com/verify/${certNumber}`,
          LEFT_W + 10,
          H - 52,
          {
            width: RIGHT_W - 20,
            align: "center",
          },
        );
      doc
        .font(FONT_REGULAR)
        .fontSize(6.5)
        .fillColor("#a78bfa")
        .text(
          "Cognon has confirmed the identity of this learner",
          LEFT_W + 10,
          H - 40,
          {
            width: RIGHT_W - 20,
            align: "center",
          },
        );
      doc
        .font(FONT_REGULAR)
        .fontSize(6.5)
        .fillColor("#a78bfa")
        .text(
          "and their successful completion of this course.",
          LEFT_W + 10,
          H - 30,
          {
            width: RIGHT_W - 20,
            align: "center",
          },
        );

      doc.rect(0, 0, LEFT_W, H).fill("#ffffff");

      doc.rect(0, 0, LEFT_W, 6).fill("#2d1b69");

      doc.rect(0, 0, 6, H).fill("#2d1b69");

      // Draw Cognon Logo at Top-Left
      doc.save();
      doc.translate(PAD, 24);
      doc.scale(0.3); // Scale 100x100 to 30x30

      // Outer hexagon outline
      doc
        .path("M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z")
        .lineWidth(3)
        .stroke("#7c3aed");

      // Inner cube face 1
      doc.path("M35 40 L50 48 L65 40 L65 55 L50 63 L35 55 Z").fill("#7c3aed");

      // Inner cube face 2
      doc.path("M35 40 L35 55 L50 63 L50 48").fill("#6d28d9");

      // Inner cube face 3
      doc.path("M65 40 L65 55 L50 63 L50 48").fill("#8b5cf6");

      doc.restore();

      // Brand Name next to Logo
      doc
        .font(FONT_BOLD)
        .fontSize(16)
        .fillColor("#2d1b69")
        .text("Cognon", PAD + 36, 31);

      // Right-aligned Issued Date
      doc
        .font(FONT_REGULAR)
        .fontSize(10)
        .fillColor("#64748b")
        .text(issuedDate, LEFT_W - PAD - 120, 34, {
          width: 120,
          align: "right",
        });

      // Student name (pushed down)
      doc
        .font(FONT_BOLD)
        .fontSize(34)
        .fillColor("#1e293b")
        .text(studentName.toUpperCase(), PAD, 85, { width: LEFT_W - PAD * 2 });

      const nameBottom = doc.y + 6;

      doc
        .font(FONT_REGULAR)
        .fontSize(12)
        .fillColor("#475569")
        .text("has successfully completed", PAD, nameBottom + 4);

      doc
        .font(FONT_BOLD)
        .fontSize(18)
        .fillColor("#1e293b")
        .text(courseName, PAD, doc.y + 8, { width: LEFT_W - PAD * 2 });

      const courseBottom = doc.y + 6;

      doc
        .font(FONT_REGULAR)
        .fontSize(9.5)
        .fillColor("#64748b")
        .text(
          `an online course authorised by ${tutorName} and offered through Cognon`,
          PAD,
          courseBottom + 6,
          { width: LEFT_W - PAD * 2 },
        );

      const footerY = H - 100;
      doc
        .moveTo(PAD, footerY)
        .lineTo(LEFT_W - PAD, footerY)
        .lineWidth(0.5)
        .stroke("#e2e8f0");

      // Instructor signature block
      doc
        .font(FONT_BOLD)
        .fontSize(14)
        .fillColor("#334155")
        .text(tutorName, PAD, footerY + 12, { width: 200 });

      doc
        .font(FONT_REGULAR)
        .fontSize(8.5)
        .fillColor("#64748b")
        .text("Course Instructor", PAD, footerY + 32);

      doc
        .font(FONT_REGULAR)
        .fontSize(8.5)
        .fillColor("#64748b")
        .text("Cognon E-Learning Platform", PAD, footerY + 44);

      doc
        .font(FONT_REGULAR)
        .fontSize(7.5)
        .fillColor("#94a3b8")
        .text(`Certificate ID: ${certNumber}`, PAD, H - 22, {
          width: LEFT_W - PAD * 2,
        });

      doc.end();
    });
  },
};

module.exports = certificateService;
