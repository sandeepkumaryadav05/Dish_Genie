const Recipe = require("../model/recipe.model.js");
const asyncHandler = require("../middleware/asyncHandler");
const { escapeRegExp } = require("../utils/helpers");

/* ---------------------------------------------------------
   FILTER BUILDER — ingredient + veg
--------------------------------------------------------- */

const NUTRITION_FILTERS = {
  "high-protein": { "nutrition.protein": { $gte: 20 } },
  "low-calorie": { "nutrition.calories": { $lte: 500 } },
  "low-carb": { "nutrition.carbohydrates": { $lte: 30 } },
  "high-fiber": { "nutrition.fiber": { $gte: 5 } }
};

const buildFilters = ({ ingredients, isVeg, nutrition }) => {
  const filters = {};

  if (ingredients && ingredients.length) {
    filters["ingredients.name"] = {
      $all: ingredients.map((n) => new RegExp(escapeRegExp(n), "i")) // substring match
    };
  }

  if (typeof isVeg === "boolean") {
    filters.isVeg = isVeg;
  }

  if (Array.isArray(nutrition) && nutrition.length) {
    const or = nutrition
      .filter((n) => NUTRITION_FILTERS[n])
      .map((n) => NUTRITION_FILTERS[n]);
    if (or.length === 1) Object.assign(filters, or[0]);
    else if (or.length > 1) filters.$or = or;
  }

  return filters;
};

/* ---------------------------------------------------------
    LIST RECIPES
--------------------------------------------------------- */
exports.listRecipes = asyncHandler(async (req, res) => {
  // Normalized query from validateRecipeQuery (falls back to raw query)
  const q = req.validatedQuery || req.query || {};

  /* ------------ Parse ingredients properly ------------ */
  let ingredients = [];

  if (q.ingredients) {
    if (Array.isArray(q.ingredients)) {
      ingredients = q.ingredients.map((s) =>
        String(s).trim().toLowerCase()
      );
    } else {
      ingredients = String(q.ingredients)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  /* ------------ Veg flag ------------ */
  let isVeg = undefined;
  const vegRaw = q.isVeg !== undefined ? q.isVeg : q.veg;
  if (vegRaw !== undefined) {
    const v = String(vegRaw).toLowerCase();
    if (["true", "1", "yes", "y"].includes(v)) isVeg = true;
    if (["false", "0", "no", "n"].includes(v)) isVeg = false;
  }

  /* ------------ Pagination ------------ */
  const page = Math.max(
    1,
    parseInt(q.page ?? req.query.page ?? 1, 10) || 1
  );
  const limit = Math.min(
    100,
    Math.max(1, parseInt(q.limit ?? req.query.limit ?? 20, 10) || 20)
  );

  /* ------------ Build Filters ------------ */
  const filters = buildFilters({
    ingredients,
    isVeg,
    nutrition: q.nutrition
  });

  const cursor = Recipe.find(filters)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([
    cursor.lean(),
    Recipe.countDocuments(filters),
  ]);

  res.json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    filters: { ingredients, isVeg, nutrition: q.nutrition },
    items,
  });
});

/* ---------------------------------------------------------
    GET SINGLE RECIPE
--------------------------------------------------------- */
exports.getRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).lean();

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  res.json(recipe);
});

/* ---------------------------------------------------------
    RANDOM RECIPES
--------------------------------------------------------- */
exports.randomRecipes = asyncHandler(async (req, res) => {
  let count = parseInt(req.query.count, 10);
  if (isNaN(count) || count < 1) count = 1;
  if (count > 10) count = 10;

  let isVeg;
  if (req.query.veg !== undefined) {
    const value = String(req.query.veg).toLowerCase();
    if (["true", "1", "yes", "y"].includes(value)) isVeg = true;
    if (["false", "0", "no", "n"].includes(value)) isVeg = false;
  }

  const filter = {};
  if (isVeg !== undefined) filter.isVeg = isVeg;

  const items = await Recipe.aggregate([
    { $match: filter },
    { $sample: { size: count } },
  ]);

  res.json(items);
});
