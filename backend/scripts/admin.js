require('dotenv').config({ debug: false });
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const mongoose = require('mongoose');


const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = 'cognon.elearning@gmail.com';
    const adminPassword = 'Admin@123456';

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin already exists');
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      phone: '9999999999',
      password: adminPassword, 
      role: 'admin',
      isVerified: true,
      status: 'active',
      profileImage: 'default-avatar.png'
    });

    console.log('Admin created successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();