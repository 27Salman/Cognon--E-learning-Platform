require('dotenv').config({ debug: false });
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const mongoose = require('mongoose');


const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = 'admin@cognon.com';
    const adminPassword = 'Admin@123456';

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      process.exit(1);
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      phone: '9999999999',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      status: 'active',
      profileImage: 'default-avatar.png'
    });

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();