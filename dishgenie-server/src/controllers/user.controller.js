const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const { getOrCreateUser } = require('../services/userService');
const favoriteService = require('../services/favoriteService');
const {
  DIETS,
  MEAL_TYPES,
  DIFFICULTIES,
  NUTRITION_GOALS
} = require('../constants/user.constants');

const asList = (v) =>
  Array.isArray(v)
    ? v.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
    : [];

const pickEnum = (v, allowed, fallback) =>
  allowed.includes(v) ? v : fallback;

/* ---------------------------------------------------------
   GET /api/preferences
--------------------------------------------------------- */
exports.getPreferences = asyncHandler(async (req, res) => {
  const user = await getOrCreateUser(req.user);
  res.json({
    profile: {
      name: user.name || '',
      email: user.email || ''
    },
    preferences: user.getOrCreatePreferences()
  });
});

/* ---------------------------------------------------------
   PUT /api/preferences
--------------------------------------------------------- */
exports.updatePreferences = asyncHandler(async (req, res) => {
  const user = await getOrCreateUser(req.user);
  const body = req.body && req.body.preferences ? req.body.preferences : req.body || {};

  if (body.diet !== undefined)
    user.preferences.diet = pickEnum(String(body.diet), DIETS, 'any');

  if (body.favoriteCuisines !== undefined)
    user.preferences.favoriteCuisines = asList(body.favoriteCuisines);

  if (body.favoriteIngredients !== undefined)
    user.preferences.favoriteIngredients = asList(body.favoriteIngredients);

  if (body.dislikedIngredients !== undefined)
    user.preferences.dislikedIngredients = asList(body.dislikedIngredients);

  if (body.mealTypes !== undefined)
    user.preferences.mealTypes = asList(body.mealTypes).filter((m) =>
      MEAL_TYPES.includes(m)
    );

  if (body.maxCookingTime !== undefined) {
    const t = parseInt(body.maxCookingTime, 10);
    user.preferences.maxCookingTime =
      Number.isFinite(t) && t > 0 ? t : 60;
  }

  if (body.difficulty !== undefined)
    user.preferences.difficulty = pickEnum(
      String(body.difficulty),
      DIFFICULTIES,
      'any'
    );

  if (body.nutritionGoal !== undefined)
    user.preferences.nutritionGoal = pickEnum(
      String(body.nutritionGoal),
      NUTRITION_GOALS,
      'balanced'
    );

  await user.save();
  res.json({ preferences: user.getOrCreatePreferences() });
});

/* ---------------------------------------------------------
   POST /api/users/activity
   body: { type: 'view' | 'favorite' | 'unfavorite', recipeId }

   favorite/unfavorite delegate to favoriteService so all writes go
   through the same atomic, validated path. Response contract (`{ ok: true }`)
   is preserved for backward compatibility.
--------------------------------------------------------- */
exports.trackActivity = asyncHandler(async (req, res) => {
  const { type, recipeId } = req.body || {};

  if (!['view', 'favorite', 'unfavorite'].includes(type)) {
    return res.status(400).json({ message: 'Invalid activity type' });
  }
  if (!recipeId || !mongoose.Types.ObjectId.isValid(String(recipeId))) {
    return res.status(400).json({ message: 'Invalid recipeId' });
  }

  if (type === 'favorite') {
    await favoriteService.addFavorite(req.user, recipeId);
    return res.json({ ok: true });
  }
  if (type === 'unfavorite') {
    await favoriteService.removeFavorite(req.user, recipeId);
    return res.json({ ok: true });
  }

  const user = await getOrCreateUser(req.user);
  const idStr = String(recipeId);

  const existing = user.activity.views.find(
    (v) => String(v.recipeId) === idStr
  );
  if (existing) {
    existing.count += 1;
    existing.lastViewedAt = new Date();
  } else {
    user.activity.views.push({ recipeId, count: 1 });
  }
  if (user.activity.views.length > 200) {
    user.activity.views = user.activity.views.slice(-200);
  }

  await user.save();
  res.json({ ok: true });
});
