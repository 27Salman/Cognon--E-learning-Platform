const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendVerificationOTP = async (email, name, otp) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Cognon E-Learning" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - Cognon',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #8b5cf6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Cognon!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for registering with Cognon E-Learning Platform!</p>
            <p>Please verify your email address using the OTP code below:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>This code will expire in 5 minutes.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>2026 Cognon E-Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetOTP = async (email, name, otp) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Cognon E-Learning" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - Cognon',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #8b5cf6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password for your Cognon account.</p>
            <p>Use the OTP code below to reset your password:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>This code will expire in 5 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>2026 Cognon E-Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationOTP,
  sendPasswordResetOTP,
  sendOTPEmail: async (email, otp, purpose) => {
    const subjects = {
      email_change: 'Email Change Request - Cognon',
      password_change: 'Password Change Request - Cognon',
    };
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Cognon E-Learning" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subjects[purpose] || 'OTP - Cognon',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0">
          <h1>Cognon E-Learning</h1>
        </div>
        <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px">
          <p>Your OTP code is:</p>
          <div style="background:white;border:2px solid #8b5cf6;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#8b5cf6;margin:20px 0;border-radius:8px">${otp}</div>
          <p><strong>This code expires in 5 minutes.</strong></p>
        </div>
      </div>`
    });
  }
};