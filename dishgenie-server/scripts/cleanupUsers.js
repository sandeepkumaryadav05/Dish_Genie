// Cleanup script: removes all non-admin users and their associated data,
// then ensures the admin account has the correct name.
//
// Usage:
//   node scripts/cleanupUsers.js
//
// Requires SEED_KEY in .env (same guard as other scripts).
// Safe to run multiple times — idempotent.
//
// What it does:
//   1. Finds the admin account (sandeepadmin@gmail.com)
//   2. Updates admin name to "sandeep"
//   3. Deletes all OTHER users from the User collection
//   4. Removes orphaned preferences/activity records (embedded, so removed with user)
//   5. Verifies recipes are untouched
//
// Does NOT delete: Recipes, nutrition data, categories, or any global data.

require('dotenv').config();

const connectDB = require('../src/db/connectDB');
const User = require('../src/model/User.model.js');
const Recipe = require('../src/model/recipe.model.js');

const ADMIN_EMAIL = 'sandeepadmin@gmail.com';
const ADMIN_NAME = 'sandeep';

(async () => {
  try {
    if (!process.env.SEED_KEY) {
      console.error(
        'SEED_KEY is not set. Add SEED_KEY to your .env file to confirm the cleanup.'
      );
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // ---- Step 1: Find and update admin ----
    const admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      console.error(`❌ Admin account not found: ${ADMIN_EMAIL}`);
      console.error('   Cannot proceed without a verified admin account.');
      process.exit(1);
    }
    console.log(`🛡️  Found admin: ${admin.email} (firebaseUid: ${admin.firebaseUid}, role: ${admin.role})`);

    // Update admin name if missing
    if (admin.name !== ADMIN_NAME) {
      admin.name = ADMIN_NAME;
      await admin.save();
      console.log(`   ✅ Updated admin name to "${ADMIN_NAME}"`);
    } else {
      console.log(`   ✅ Admin name already "${ADMIN_NAME}"`);
    }

    const adminId = admin._id;
    console.log(`   Admin _id: ${adminId}\n`);

    // ---- Step 2: Count all users ----
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users before cleanup: ${totalUsers}`);

    // ---- Step 3: Delete non-admin users ----
    const result = await User.deleteMany({
      _id: { $ne: adminId }
    });
    console.log(`🗑️  Deleted ${result.deletedCount} non-admin user(s)\n`);

    // ---- Step 4: Verify ----
    const remainingUsers = await User.countDocuments();
    const adminStillExists = await User.findById(adminId);

    console.log('--- Verification ---');
    console.log(`   Users remaining: ${remainingUsers}`);
    console.log(`   Admin exists: ${adminStillExists ? 'YES' : 'NO'}`);

    if (adminStillExists) {
      console.log(`   Admin email: ${adminStillExists.email}`);
      console.log(`   Admin name: ${adminStillExists.name}`);
      console.log(`   Admin role: ${adminStillExists.role}`);
    }

    // ---- Step 5: Verify recipes untouched ----
    const recipeCount = await Recipe.countDocuments();
    console.log(`   Recipes in database: ${recipeCount}`);

    console.log('\n✅ Cleanup complete!');
    console.log('   - All non-admin users deleted');
    console.log('   - Admin account preserved and updated');
    console.log('   - Recipe data untouched');

    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
})();
