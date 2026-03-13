/**
 * Migration Script: Update User Model Indexes
 * 
 * This script:
 * 1. Drops the old unique index on email field
 * 2. Creates a new compound unique index on (email + role)
 * 3. Allows same email to register as both student and tutor
 * 
 * Run this ONCE after updating the User model:
 * node backend/scripts/migrateUserIndex.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function migrateIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get existing indexes
    console.log('\nCurrent indexes:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the old email unique index if it exists
    try {
      console.log('\nDropping old email_1 index...');
      await usersCollection.dropIndex('email_1');
      console.log('✓ Dropped email_1 index');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('✓ email_1 index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // Drop the old phone unique index if it exists
    try {
      console.log('\nDropping old phone_1 index...');
      await usersCollection.dropIndex('phone_1');
      console.log('✓ Dropped phone_1 index');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('✓ phone_1 index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // Create new compound unique index on email + role
    console.log('\nCreating new compound index on (email + role)...');
    await usersCollection.createIndex(
      { email: 1, role: 1 },
      { unique: true, name: 'email_1_role_1' }
    );
    console.log('✓ Created compound unique index: email_1_role_1');

    // Verify new indexes
    console.log('\nNew indexes:');
    const newIndexes = await usersCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\nWhat this means:');
    console.log('- Users can now register with the same email as both student AND tutor');
    console.log('- Each email+role combination must be unique');
    console.log('- Login now requires both email and role to identify the correct account');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateIndexes();
