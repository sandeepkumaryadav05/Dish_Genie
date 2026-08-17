const asyncHandler = require('../middleware/asyncHandler');
const recipeAdminService = require('../services/recipeAdminService');

/* ---------------------------------------------------------
   GET /api/admin/me
   Confirms the authenticated user holds an admin role. Used by
   the frontend admin route guard (UX only — the API itself is
   already protected by requireAuth + requireAdmin).
--------------------------------------------------------- */
exports.adminStatus = asyncHandler(async (req, res) => {
  res.json({
    isAdmin: true,
    user: { firebaseUid: req.user.firebaseUid, email: req.user.email || '' }
  });
});

/* ---------------------------------------------------------
   GET /api/admin/stats
   Lightweight dashboard counts.
--------------------------------------------------------- */
exports.stats = asyncHandler(async (req, res) => {
  const stats = await recipeAdminService.getStats();
  res.json(stats);
});

/* ---------------------------------------------------------
   GET /api/admin/recipes
   Supports q, area, category, isVeg, difficulty, hasNutrition,
   page, limit query params.
--------------------------------------------------------- */
exports.listAdminRecipes = asyncHandler(async (req, res) => {
  const result = await recipeAdminService.listRecipes(req.query);
  res.json(result);
});

/* ---------------------------------------------------------
   GET /api/admin/recipes/:id
--------------------------------------------------------- */
exports.getAdminRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeAdminService.getRecipe(req.params.id);
  res.json(recipe);
});

/* ---------------------------------------------------------
   POST /api/admin/recipes
--------------------------------------------------------- */
exports.createAdminRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeAdminService.createRecipe(req.body);
  res.status(201).json(recipe);
});

/* ---------------------------------------------------------
   PUT /api/admin/recipes/:id
--------------------------------------------------------- */
exports.updateAdminRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeAdminService.updateRecipe(req.params.id, req.body);
  res.json(recipe);
});

/* ---------------------------------------------------------
   DELETE /api/admin/recipes/:id
   Also cleans up user favorites and meal-plan slots.
--------------------------------------------------------- */
exports.deleteAdminRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeAdminService.deleteRecipe(req.params.id);
  res.json({ success: true, message: 'Recipe deleted', deletedId: recipe._id });
});
