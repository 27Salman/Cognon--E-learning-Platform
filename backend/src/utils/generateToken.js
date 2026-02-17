const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    const payload = {
        id: userId,
        role: role
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'      
        }
    );

    return token;
};

// const generateRefreshToken = (userId) => {
//     return jwt.sign(
//         { id: userId },
//         process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
//         { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
//     );
// };

module.exports = generateToken;

