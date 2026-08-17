const asyncHandler = require('../middleware/asyncHandler');
const favoriteService = require('../services/favoriteService');

/* ---------------------------------------------------------
   GET /api/users/favorites
--------------------------------------------------------- */
exports.getFavorites = asyncHandler(async (req, res) => {
  const recipes = await favoriteService.getFavorites(req.user);
  res.json({ recipes });
});

/* ---------------------------------------------------------
   POST /api/users/favorites/:recipeId
--------------------------------------------------------- */
exports.addFavorite = asyncHandler(async (req, res) => {
  const result = await favoriteService.addFavorite(req.user, req.params.recipeId);
  res.json(result);
});

/* ---------------------------------------------------------
   DELETE /api/users/favorites/:recipeId
--------------------------------------------------------- */
exports.removeFavorite = asyncHandler(async (req, res) => {
  const result = await favoriteService.removeFavorite(req.user, req.params.recipeId);
  res.json(result);
});
