require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const users = await User.find({}, 'name email role authProvider phone isVerified').lean();
    console.table(users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        authProvider: u.authProvider,
        phone: u.phone,
        isVerified: u.isVerified
    })));
    await mongoose.disconnect();
});
