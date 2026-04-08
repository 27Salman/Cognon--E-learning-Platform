const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');

// Helper to ensure directory exists
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Common file filter for images
const imageFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                  allowed.test(file.mimetype);
    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
};

// Profile image upload 
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(uploadDir, 'profiles');
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `user-${req.user._id}-${Date.now()}${ext}`);
    }
});

// Course thumbnail upload
const courseStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(uploadDir, 'courses');
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `course-${req.user._id}-${Date.now()}${ext}`);
    }
});

// Lesson thumbnail upload
const lessonThumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(uploadDir, 'lessons');
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `lesson-thumb-${req.user._id}-${Date.now()}${ext}`);
    }
});

// PDF notes upload
const pdfFilter = (req, file, cb) => {
    const valid = file.mimetype === 'application/pdf' ||
                  path.extname(file.originalname).toLowerCase() === '.pdf';
    valid ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
};

const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(uploadDir, 'pdfs');
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `notes-${req.user._id}-${Date.now()}${ext}`);
    }
});

module.exports = {
    uploadProfile: multer({ 
        storage: profileStorage, 
        fileFilter: imageFilter, 
        limits: { fileSize: 5 * 1024 * 1024 } 
    }),
    uploadCourse: multer({ 
        storage: courseStorage, 
        fileFilter: imageFilter, 
        limits: { fileSize: 5 * 1024 * 1024 } 
    }),
    uploadLesson: multer({
        storage: lessonThumbnailStorage,
        fileFilter: imageFilter,
        limits: { fileSize: 5 * 1024 * 1024 }
    }),
    uploadPdf: multer({
        storage: pdfStorage,
        fileFilter: pdfFilter,
        limits: { fileSize: 20 * 1024 * 1024 }
    })
};
