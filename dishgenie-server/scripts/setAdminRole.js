// Promotes / demotes a DishGenie user to admin (or back to user).
//
// Usage:
//   node scripts/setAdminRole.js --email=someone@example.com [--role=admin|user]
//   node scripts/setAdminRole.js --firebaseUid=<firebase-uid>   [--role=admin|user]
//
// The script requires SEED_KEY to be set in .env (same guard as seed.js) so an
// admin cannot be promoted by accident. Role changes happen server-side in
// MongoDB and are never exposed through any public API.
require('dotenv').config();

const connectDB = require('../src/db/connectDB');
const User = require('../src/model/User.model.js');

function parseArgs(argv) {
  const args = { role: 'admin' };
  for (const arg of argv) {
    const m = arg.match(/^--(\w+)=(.*)$/);
    if (!m) continue;
    if (m[1] === 'email' || m[1] === 'firebaseUid') args[m[1]] = m[2];
    if (m[1] === 'role') args.role = m[2].toLowerCase();
  }
  return args;
}

(async () => {
  try {
    if (!process.env.SEED_KEY) {
      console.error(
        'SEED_KEY is not set. Add SEED_KEY to your .env file to confirm the role change.'
      );
      process.exit(1);
    }

    const args = parseArgs(process.argv.slice(2));
    if (!args.email && !args.firebaseUid) {
      console.error('Provide either --email=<email> or --firebaseUid=<firebase-uid>.');
      process.exit(1);
    }
    if (!['admin', 'user'].includes(args.role)) {
      console.error('--role must be either "admin" or "user".');
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const query = args.firebaseUid ? { firebaseUid: args.firebaseUid } : { email: args.email };
    const user = await User.findOne(query);

    if (!user) {
      console.error(
        `User not found matching ${args.firebaseUid ? 'firebaseUid' : 'email'}: ${args.firebaseUid || args.email}`
      );
      process.exit(1);
    }

    user.role = args.role;
    await user.save();
    console.log(
      `✅ ${user.email || user.firebaseUid} (firebaseUid: ${user.firebaseUid}) is now role "${user.role}".`
    );
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to update role:', err);
    process.exit(1);
  }
})();
