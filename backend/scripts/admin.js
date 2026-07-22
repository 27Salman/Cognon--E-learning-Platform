require('dotenv').config({ path: require('path').join(__dirname, '../.env'), debug: false });
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const mongoose = require('mongoose');


const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin already exists:', adminEmail);
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
    });

    console.log('Admin created successfully');
    console.log('Email:', adminEmail);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();