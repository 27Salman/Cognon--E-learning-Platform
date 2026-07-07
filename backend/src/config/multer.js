const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');
const path = require('path');

// Profile
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Cognon/profiles',
        allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
        public_id: (req, file) => `user-${req.user._id}-${Date.now()}`,
    },
});

// Course thumbnail 
const courseStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Cognon/courses',
        allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
        public_id: (req, file) => `course-${req.user._id}-${Date.now()}`,
    },
});

// Combined lesson uploader
const lessonCombinedStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'Cognon/lessons';
        let resource_type = 'auto'; 
        let public_id = '';
        
        if (file.fieldname === 'thumbnail') {
            public_id = `lesson-thumb-${req.user._id}-${Date.now()}`;
        } else if (file.fieldname === 'pdfNotes') {
            folder = 'Cognon/pdfs';
            public_id = `notes-${req.user._id}-${Date.now()}`;
        } else if (file.fieldname === 'video') {
            folder = 'Cognon/videos';
            resource_type = 'video';
            public_id = `video-${req.user._id}-${Date.now()}`;
        } else {
            public_id = `file-${req.user._id}-${Date.now()}`;
        }

        return {
            folder: folder,
            resource_type: resource_type,
            public_id: public_id,
        };
    },
});

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
    } else if (file.fieldname === 'video') {
        const allowed = /mp4|mov|avi|wmv|mkv/;
        const isValid = allowed.test(ext) && file.mimetype.startsWith('video/');
        isValid
            ? cb(null, true)
            : cb(new Error('Only video files are allowed for lesson videos'), false);
    } else {
        cb(new Error('Unexpected field name'), false);
    }
};

module.exports = {
    uploadProfile: multer({ 
        storage: profileStorage, 
        limits: { fileSize: 5 * 1024 * 1024 } 
    }),
    uploadCourse: multer({ 
        storage: courseStorage, 
        limits: { fileSize: 5 * 1024 * 1024 } 
    }),
    
    uploadLessonFields: multer({
        storage: lessonCombinedStorage,
        fileFilter: lessonFieldFilter,
        limits: { fileSize: 500 * 1024 * 1024 } 
    })
};
