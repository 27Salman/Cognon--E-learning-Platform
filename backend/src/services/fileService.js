const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const deleteCloudinaryAsset = async (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary')) return;
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return;

        let resource_type = 'image';
        if (uploadIndex > 1) {
            resource_type = parts[uploadIndex - 1]; 
        }
        
        const fileWithExtension = parts.slice(uploadIndex + 2).join('/');
        const publicId = fileWithExtension.replace(/\.[^/.]+$/, "");

        await cloudinary.uploader.destroy(publicId, { resource_type });
    } catch (err) {
        console.error('Failed to delete Cloudinary asset:', err.message);
    }
};

module.exports = { deleteCloudinaryAsset };
