// Data migration: renames the legacy `uid` field → `firebaseUid` in all
// existing MongoDB User documents.
//
// Usage:
//   node scripts/migrateUidToFirebaseUid.js
//
// Requires SEED_KEY in .env (safety guard).
// Idempotent — skips documents that already have `firebaseUid`.

require('dotenv').config();

const connectDB = require('../src/db/connectDB');
const User = require('../src/model/User.model.js');

(async () => {
  try {
    if (!process.env.SEED_KEY) {
      console.error('SEED_KEY is not set. Add SEED_KEY to your .env file.');
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Find users that still have the old `uid` field but no `firebaseUid`
    // We use raw collection access since Mongoose schema no longer defines `uid`
    const db = User.db;
    const collection = db.collection('users');

    const usersWithOldUid = await collection
      .find({ uid: { $exists: true }, firebaseUid: { $exists: false } })
      .toArray();

    console.log(`📋 Found ${usersWithOldUid.length} user(s) with legacy uid field\n`);

    if (usersWithOldUid.length === 0) {
      console.log('   Nothing to migrate — all users already have firebaseUid');
      console.log('\n✅ Migration complete (no changes)');
      process.exit(0);
    }

    let migrated = 0;
    let skipped = 0;

    for (const doc of usersWithOldUid) {
      const oldUid = doc.uid;
      const email = doc.email || 'unknown';

      if (!oldUid) {
        console.log(`   ⏭️  Skipping ${email} — uid is empty`);
        skipped++;
        continue;
      }

      // Check if another document already has this firebaseUid (would conflict)
      const existing = await collection.findOne({ firebaseUid: oldUid });
      if (existing) {
        console.log(`   ⚠️  ${email}: firebaseUid ${oldUid} already exists on another document`);
        console.log(`      Merging into existing document and removing duplicate`);

        // Remove the old document (keep the one that already has firebaseUid)
        await collection.deleteOne({ _id: doc._id });
        skipped++;
        continue;
      }

      // Rename uid → firebaseUid using $rename
      await collection.updateOne(
        { _id: doc._id },
        { $rename: { uid: 'firebaseUid' } }
      );

      console.log(`   ✅ Migrated ${email}: uid → firebaseUid = ${oldUid}`);
      migrated++;
    }

    // Verify no documents still have the old uid field
    const remaining = await collection.countDocuments({ uid: { $exists: true } });

    console.log('\n--- Summary ---');
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped:  ${skipped}`);
    console.log(`   Documents still with legacy uid: ${remaining}`);

    if (remaining > 0) {
      console.error('\n❌ Some documents still have the legacy uid field');
      process.exit(1);
    }

    console.log('\n✅ Migration complete — all users now use firebaseUid');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})();
