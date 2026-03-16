const crypto = require('crypto');
const OTP = require('../models/OTP');

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const createOTP = async (email, purpose, newEmail = null) => {
    const otp = generateOTP();

    await OTP.deleteMany({ email, purpose, verified: false });

    await OTP.create({
        email,
        otp,
        purpose,
        newEmail
    });

    return otp;
};

const verifyOTP = async (email, otp, purpose) => {
    const otpDoc = await OTP.findOne({ email, purpose, verified: false });

    if (!otpDoc) {
        throw new Error('OTP expired or not found. Please request a new one.');
    }

    if (otpDoc.attempts >= 3) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    if (otpDoc.otp !== otp) {
        otpDoc.attempts += 1;
        await otpDoc.save();
        throw new Error(`Invalid OTP code. ${3 - otpDoc.attempts} attempts remaining.`);
    }

    otpDoc.verified = true;
    await otpDoc.save();

    return otpDoc;
};

module.exports = { generateOTP, createOTP, verifyOTP };