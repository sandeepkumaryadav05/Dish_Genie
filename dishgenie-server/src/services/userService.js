const User = require('../model/User.model.js');

/**
 * Atomic upsert: find a user by Firebase UID and create if missing.
 *
 * This is the single point of entry for ensuring every authenticated
 * Firebase user has a corresponding MongoDB document. It runs on every
 * authenticated API call, so even Firebase-only users (who never went
 * through a MongoDB signup flow) get auto-provisioned.
 *
 * Uses findOneAndUpdate with upsert to avoid race conditions.
 */
async function getOrCreateUser({ uid, email = '', name = '' }) {
  if (!uid) throw Object.assign(new Error('Missing user firebaseUid'), { status: 401 });

  const now = new Date();

  const user = await User.findOneAndUpdate(
    { firebaseUid: uid },
    {
      $set: {
        email,
        updatedAt: now
      },
      $setOnInsert: {
        firebaseUid: uid,
        name: name || '',
        role: 'user',
        createdAt: now
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  // If the user existed but was missing a name and we have one, update it.
  if (name && !user.name) {
    user.name = name;
    await user.save();
  }

  return user;
}

module.exports = { getOrCreateUser };
