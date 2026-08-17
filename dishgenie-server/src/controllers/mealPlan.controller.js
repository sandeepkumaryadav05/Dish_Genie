const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const MealPlan = require('../model/MealPlan.model.js');
const Recipe = require('../model/recipe.model.js');
const { getOrCreateUser } = require('../services/userService');

const { DAYS, MEAL_TYPES } = MealPlan;

/* Normalize any date to the Monday (UTC) that starts its week. */
function mondayOf(date) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function parseWeekStart(input) {
  if (!input) return mondayOf(new Date());
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return mondayOf(d);
}

const isoDay = (d) => d.toISOString().slice(0, 10);

/* ---------------------------------------------------------
   GET /api/meal-plans?week=YYYY-MM-DD
--------------------------------------------------------- */
exports.getWeekPlan = asyncHandler(async (req, res) => {
  const user = await getOrCreateUser(req.user);
  const weekStart = parseWeekStart(req.query.week);
  if (!weekStart) {
    return res.status(400).json({ message: 'Invalid week date' });
  }

  const plan = await MealPlan.findOne({ user: user._id, weekStart });

  if (!plan || !plan.slots.length) {
    return res.json({ weekStart: isoDay(weekStart), slots: [] });
  }

  const recipeIds = [...new Set(plan.slots.map((s) => s.recipeId))];
  const recipes = await Recipe.find({ _id: { $in: recipeIds } }).lean();
  const recipeById = new Map(recipes.map((r) => [String(r._id), r]));

  const slots = plan.slots
    .filter((s) => recipeById.has(String(s.recipeId)))
    .map((s) => ({
      day: s.day,
      mealType: s.mealType,
      recipe: recipeById.get(String(s.recipeId))
    }));

  res.json({ weekStart: isoDay(weekStart), slots });
});

/* ---------------------------------------------------------
   PUT /api/meal-plans/:week
   body: { day, mealType, recipeId }
--------------------------------------------------------- */
exports.setSlot = asyncHandler(async (req, res) => {
  const user = await getOrCreateUser(req.user);
  const weekStart = parseWeekStart(req.params.week);
  if (!weekStart) {
    return res.status(400).json({ message: 'Invalid week date' });
  }

  const { day, mealType, recipeId } = req.body || {};
  if (!DAYS.includes(day)) {
    return res.status(400).json({ message: `day must be one of: ${DAYS.join(', ')}` });
  }
  if (!MEAL_TYPES.includes(mealType)) {
    return res.status(400).json({ message: `mealType must be one of: ${MEAL_TYPES.join(', ')}` });
  }
  if (!mongoose.Types.ObjectId.isValid(String(recipeId))) {
    return res.status(400).json({ message: 'Invalid recipeId' });
  }

  const recipe = await Recipe.findById(recipeId).lean();
  if (!recipe) {
    return res.status(404).json({ message: 'Recipe not found' });
  }

  let plan = await MealPlan.findOne({ user: user._id, weekStart });
  if (!plan) {
    plan = new MealPlan({ user: user._id, weekStart, slots: [] });
  }
  plan.slots = plan.slots.filter(
    (s) => !(s.day === day && s.mealType === mealType)
  );
  plan.slots.push({ day, mealType, recipeId });
  await plan.save();

  res.json({
    weekStart: isoDay(weekStart),
    slot: { day, mealType, recipeId }
  });
});

/* ---------------------------------------------------------
   DELETE /api/meal-plans/:week/:day/:mealType
--------------------------------------------------------- */
exports.clearSlot = asyncHandler(async (req, res) => {
  const user = await getOrCreateUser(req.user);
  const weekStart = parseWeekStart(req.params.week);
  if (!weekStart) {
    return res.status(400).json({ message: 'Invalid week date' });
  }

  const { day, mealType } = req.params;
  if (!DAYS.includes(day) || !MEAL_TYPES.includes(mealType)) {
    return res.status(400).json({ message: 'Invalid day or mealType' });
  }

  const plan = await MealPlan.findOne({ user: user._id, weekStart });
  if (plan) {
    plan.slots = plan.slots.filter(
      (s) => !(s.day === day && s.mealType === mealType)
    );
    await plan.save();
  }

  res.json({ ok: true });
});
