const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getRecommendations
} = require('../controllers/recommendation.controller');

router.get('/', requireAuth, getRecommendations);

module.exports = router;
