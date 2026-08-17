const asyncHandler = require('../middleware/asyncHandler');
const { getOrCreateUser } = require('../services/userService');
const { getRecommendations } = require('../services/recommendationService');

/* ---------------------------------------------------------
   GET /api/recommendations?limit=12&ingredients=a,b
--------------------------------------------------------- */
exports.getRecommendations = asyncHandler(async (req, res) => {
  const user = await getOrCreateUser(req.user);

  let limit = parseInt(req.query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 12;
  if (limit > 30) limit = 30;

  const items = await getRecommendations({
    user,
    limit,
    ingredientHint: req.query.ingredients
  });

  res.json({ items });
});
