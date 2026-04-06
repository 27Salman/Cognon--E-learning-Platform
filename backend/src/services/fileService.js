const fs = require('fs');
const path = require('path');

const deleteOldProfileImage = async (filename) => {
    if (!filename || filename.startsWith('http')) return;
    try {
        const filePath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('Failed to delete old profile image:', err.message);
    }
};

module.exports = { deleteOldProfileImage };
