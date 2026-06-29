const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');

//Ensure directory exists
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Filter for images
const imageFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                  allowed.test(file.mimetype);
    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
};

// Profile
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

// Course thumbnail 
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

// Lesson thumbnail 
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

// PDF  
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

// Combined lesson uploader — handles both thumbnail (image) and pdfNotes (pdf) fields
const lessonFieldFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'thumbnail') {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const isValid = allowed.test(ext) && file.mimetype.startsWith('image/');
        isValid
            ? cb(null, true)
            : cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed for thumbnails'), false);
    } else if (file.fieldname === 'pdfNotes') {
        const isValid = ext === '.pdf' && file.mimetype === 'application/pdf';
        isValid
            ? cb(null, true)
            : cb(new Error('Only PDF files are allowed for notes'), false);
    } else {
        cb(new Error('Unexpected field name'), false);
    }
};

const lessonCombinedStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isImage = file.mimetype.startsWith('image/');
        const dest = path.join(uploadDir, isImage ? 'lessons' : 'pdfs');
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const prefix = file.mimetype.startsWith('image/') ? 'lesson-thumb' : 'notes';
        cb(null, `${prefix}-${req.user._id}-${Date.now()}${ext}`);
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
    }),
    uploadLessonFields: multer({
        storage: lessonCombinedStorage,
        fileFilter: lessonFieldFilter,
        limits: { fileSize: 20 * 1024 * 1024 }
    })
};
