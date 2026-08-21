// Sync Firebase Authentication users → MongoDB.
//
// Lists every user from Firebase Authentication and ensures each one has
// a corresponding MongoDB User document. Existing MongoDB users are updated
// with any missing profile data (email, name). Firebase users without a
// MongoDB record are auto-provisioned.
//
// IMPORTANT: This script requires Firebase service account credentials to call
// listUsers(). If credentials are not configured, the script will explain how
// to set them up. The runtime sync (getOrCreateUser upsert) in the API handles
// the same job automatically when users log in — every authenticated Firebase
// user gets a MongoDB record on their first API call.
//
// Usage:
//   node scripts/syncFirebaseUsers.js
//
// Requires:
//   - FIREBASE_PROJECT_ID in .env
//   - FIREBASE_SERVICE_ACCOUNT in .env  (JSON string of service account key)
//     OR GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON file)
//   - MONGO_URL in .env
//   - SEED_KEY in .env (safety guard)
//
// NOTE: This script NEVER assigns roles. Admin promotion is handled
// exclusively by scripts/setAdminRole.js so that authorization is always
// derived from the persisted MongoDB role of a verified Firebase UID —
// never from an email address.

require('dotenv').config();

const connectDB = require('../src/db/connectDB');
const User = require('../src/model/User.model.js');

function printCredentialHelp() {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  Firebase Admin SDK requires service account credentials     ║');
  console.error('║  to list users. Add one of the following to .env:           ║');
  console.error('║                                                              ║');
  console.error('║  FIREBASE_SERVICE_ACCOUNT=<JSON string of service account>   ║');
  console.error('║  GOOGLE_APPLICATION_CREDENTIALS=<path to service acc file>   ║');
  console.error('║                                                              ║');
  console.error('║  NOTE: The runtime sync (getOrCreateUser upsert) handles    ║');
  console.error('║  this automatically. Every Firebase user gets a MongoDB      ║');
  console.error('║  record on their first authenticated API call. This script   ║');
  console.error('║  is only needed for pre-populating records.                  ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
}

(async () => {
  try {
    if (!process.env.SEED_KEY) {
      console.error('SEED_KEY is not set. Add SEED_KEY to your .env file.');
      process.exit(1);
    }
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('FIREBASE_PROJECT_ID is not set.');
      process.exit(1);
    }

    // Check for credentials before importing firebase-admin
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!hasServiceAccount && !hasGoogleCreds) {
      printCredentialHelp();
      process.exit(1);
    }

    const { initializeApp, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');

    // Initialize Firebase Admin SDK with service account
    let firebaseApp;
    if (hasServiceAccount) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      firebaseApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    console.log('✅ Firebase Admin SDK initialized\n');

    // Connect to MongoDB
    await connectDB(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // List all Firebase users (paginated)
    let allFirebaseUsers = [];
    let nextPageToken;
    do {
      const result = await getAuth(firebaseApp).listUsers(100, nextPageToken);
      allFirebaseUsers = allFirebaseUsers.concat(result.users);
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    console.log(`📋 Found ${allFirebaseUsers.length} Firebase user(s)\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const fbUser of allFirebaseUsers) {
      const fbUid = fbUser.uid;
      const fbEmail = fbUser.email || '';
      const fbName = fbUser.displayName || '';

      if (!fbEmail) {
        console.log(`   ⏭️  Skipping Firebase user ${fbUid} — no email`);
        skipped++;
        continue;
      }

      const now = new Date();
      const mongoUser = await User.findOneAndUpdate(
        { firebaseUid: fbUid },
        {
          $set: {
            email: fbEmail,
            updatedAt: now
          },
          $setOnInsert: {
            firebaseUid: fbUid,
            name: fbName,
            role: 'user',
            createdAt: now
          }
        },
        {
          new: true,
          upsert: true
        }
      );

      if (fbName && !mongoUser.name) {
        mongoUser.name = fbName;
        await mongoUser.save();
      }

      const timeDiff = Math.abs(mongoUser.updatedAt.getTime() - now.getTime());
      const isNew = timeDiff < 1000;

      if (isNew) {
        console.log(`   ✅ Created: ${fbEmail} (firebaseUid: ${fbUid}, role: user)`);
        created++;
      } else {
        console.log(`   🔄 Exists:  ${fbEmail} (firebaseUid: ${fbUid})`);
        updated++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`   Firebase users:     ${allFirebaseUsers.length}`);
    console.log(`   Created in MongoDB: ${created}`);
    console.log(`   Already existed:    ${updated}`);
    console.log(`   Skipped:            ${skipped}`);

    const mongoCount = await User.countDocuments();
    console.log(`\n   MongoDB users now:  ${mongoCount}`);

    console.log('\n✅ Sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  }
})();
