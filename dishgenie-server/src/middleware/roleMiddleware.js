const User = require('../model/User.model.js');

// Admin authorization middleware.
//
// MUST run AFTER requireAuth so req.user.firebaseUid comes from a verified Firebase ID
// token. Authorization is decided server-side from the persisted User document
// (role === 'admin'). It never trusts the request body, headers, query params
// or any client-supplied role value.
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid })
      .select('firebaseUid role')
      .lean();

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAdmin };
