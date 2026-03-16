const User = require('../models/User');
const { deleteOldProfileImage } = require('../services/fileService');
const { createOTP, verifyOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/emailService');


exports.getProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const admin = await User.findById(req.user.id);
    
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    
    if (req.file) {
      if (admin.profileImage) {
        await deleteOldProfileImage(admin.profileImage);
      }
      
      admin.profileImage = req.file.filename;
    }
    
    await admin.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.requestEmailChange = async (req, res) => {
    try {
        const { newEmail } = req.body;
        
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Email already in use'
        });
        }
        
        const otp = await createOTP(req.user.email, 'email_change', newEmail);
        
        await sendOTPEmail(newEmail, otp, 'email_change');
        
        res.status(200).json({
        success: true,
        message: `OTP sent to ${newEmail}`
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};

exports.verifyEmailChange = async (req, res) => {
    try {
        const { newEmail, otp } = req.body;
        
        const otpDoc = await verifyOTP(req.user.email, otp, 'email_change');
        
        if (otpDoc.newEmail !== newEmail) {
        return res.status(400).json({
            success: false,
            message: 'Email mismatch'
        });
        }
        
        const admin = await User.findById(req.user.id);
        admin.email = newEmail;
        await admin.save();
        
        res.status(200).json({
        success: true,
        message: 'Email updated successfully',
        data: admin
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};

exports.requestPasswordChange = async (req, res) => {
    try {
        const otp = await createOTP(req.user.email, 'password_change');
        
        await sendOTPEmail(req.user.email, otp, 'password_change');
        
        res.status(200).json({
        success: true,
        message: `OTP sent to ${req.user.email}`
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message
        });
    }
};

exports.verifyPasswordChange = async (req, res) => {
    try {
        const { newPassword, otp } = req.body;
        
        await verifyOTP(req.user.email, otp, 'password_change');
        
        const admin = await User.findById(req.user.id);
        admin.password = newPassword; 
        await admin.save();
        
        res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again.'
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message
        });
    }
};
