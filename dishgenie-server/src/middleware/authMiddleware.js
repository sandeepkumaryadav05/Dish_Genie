// firebase-admin v14 exposes a modular API. The legacy `admin.auth()`
// namespace was removed in v13+, so we import the submodules explicitly.
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Firebase token verification only needs the project id — the public signing
// keys are fetched from Google automatically, so no service account file is
// required. Set FIREBASE_PROJECT_ID in the server .env file.
let firebaseApp = null;

function initFirebase() {
  if (!firebaseApp && process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
  return firebaseApp;
}

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const app = initFirebase();
    if (!app) {
      return res.status(503).json({
        message:
          'Authentication is not configured on the server (missing FIREBASE_PROJECT_ID).'
      });
    }

    const token = extractBearer(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const decoded = await getAuth(app).verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      firebaseUid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || ''
    };
    return next();
  } catch (err) {
    if (err && (err.code === 'auth/id-token-expired' || err.code === 'auth/id-token-revoked')) {
      return res
        .status(401)
        .json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, initFirebase };
