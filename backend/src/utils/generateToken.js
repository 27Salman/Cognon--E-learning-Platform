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

module.exports = generateToken;

