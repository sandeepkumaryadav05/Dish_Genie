const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { trackActivity } = require('../controllers/user.controller');
const {
  getFavorites,
  addFavorite,
  removeFavorite
} = require('../controllers/favorite.controller');

router.post('/activity', requireAuth, trackActivity);
router.get('/favorites', requireAuth, getFavorites);
router.post('/favorites/:recipeId', requireAuth, addFavorite);
router.delete('/favorites/:recipeId', requireAuth, removeFavorite);

module.exports = router;
