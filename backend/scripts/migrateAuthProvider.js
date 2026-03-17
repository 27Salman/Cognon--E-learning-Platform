require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const r1 = await User.updateMany(
        { authProvider: { $exists: false }, phone: null },
        { $set: { authProvider: 'google' } }
    );
    console.log('Marked as google (null phone):', r1.modifiedCount);

    const r2 = await User.updateMany(
        { authProvider: { $exists: false } },
        { $set: { authProvider: 'local' } }
    );
    console.log('Marked as local (remaining):', r2.modifiedCount);

    await mongoose.disconnect();
    console.log('Migration complete');
});
