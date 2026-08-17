const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { chat } = require('../controllers/ai.controller');

router.post('/chat', requireAuth, chat);

module.exports = router;
