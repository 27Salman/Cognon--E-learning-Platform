const crypto = require('crypto');

const otpStore = new Map();

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = (email, otp, expiryMinutes = 10) => {
    const key = email.toLowerCase();
    const expiryTime = Date.now() + expiryMinutes * 60 * 1000;

    otpStore.set(key, {
        otp: otp,
        expiresAt: expiryTime,
        attempts: 0
    });

    setTimeout(()=>{
        otp.store.delete(key);
    }, expiryMinutes * 60 * 1000)
};


const verifyOTP = (email, otp) => {
    const key = email.toLowerCase();
    const stored = otpStore.get(key);
    
    if (!stored) {
        return { valid: false, message: 'OTP expired or not found' };
    }
    
    if (stored.attempts >= 3) {
        otpStore.delete(key);
        return { valid: false, message: 'Maximum verification attempts exceeded' };
    }
    
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(key);
        return { valid: false, message: 'OTP has expired' };
    }
    
    if (stored.otp !== otp) {
        stored.attempts += 1;
        return { valid: false, message: 'Invalid OTP code' };
    }
    
    otpStore.delete(key);
    return { valid: true, message: 'OTP verified successfully' };
};

const clearOTP = (email) => {
    const key = email.toLowerCase();
    otpStore.delete(key);
};

module.exports = {
    generateOTP,
    storeOTP,
    verifyOTP,
    clearOTP
};