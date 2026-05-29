require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function cleanup() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Find the admin user first so we can preserve it
    const usersCol = db.collection('users');
    const admin = await usersCol.findOne({ role: 'admin' });

    if (!admin) {
        console.error('No admin user found — aborting to avoid wiping everything.');
        process.exit(1);
    }

    console.log(`Preserving admin: ${admin.email}`);

    // Collections to wipe completely
    const collectionsToWipe = [
        'courses', 'lessons', 'orders', 'carts', 'wishlists',
        'coupons', 'offers', 'chats', 'otps', 'wallets',
        'withdrawalrequests', 'categories'
    ];

    for (const name of collectionsToWipe) {
        try {
            const result = await db.collection(name).deleteMany({});
            console.log(`  ${name}: deleted ${result.deletedCount} documents`);
        } catch (e) {
            console.log(`  ${name}: skipped (${e.message})`);
        }
    }

    // Delete all users except the admin
    const userResult = await usersCol.deleteMany({ _id: { $ne: admin._id } });
    console.log(`  users: deleted ${userResult.deletedCount} non-admin users`);

    // Reset admin wallet if it exists
    try {
        const walletResult = await db.collection('wallets').deleteMany({ owner: admin._id });
        console.log(`  admin wallet: reset (${walletResult.deletedCount} deleted)`);
    } catch (e) {
        // already wiped above
    }

    console.log('\nCleanup complete. Admin account preserved.');
    await mongoose.disconnect();
}

cleanup().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
