const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getPreferences,
  updatePreferences
} = require('../controllers/user.controller');

router.get('/', requireAuth, getPreferences);
router.put('/', requireAuth, updatePreferences);

module.exports = router;
