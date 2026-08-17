const mongoose = require('mongoose');
const slugify = require('slugify');
const Recipe = require('../model/recipe.model.js');
const User = require('../model/User.model.js');
const MealPlan = require('../model/MealPlan.model.js');
const { DIFFICULTIES, NUTRITION_KEYS } = require('../constants/recipe.constants');
const { escapeRegExp, badRequest, parseBool } = require('../utils/helpers');

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */
function notFound(message = 'Recipe not found') {
  return Object.assign(new Error(message), { status: 404 });
}

function conflict(message) {
  return Object.assign(new Error(message), { status: 409 });
}

function toTagList(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
}

function toUrl(value) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  try {
    const url = new URL(v);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    return v;
  } catch {
    throw badRequest('Invalid URL provided');
  }
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */
function validateIngredients(value) {
  if (!Array.isArray(value)) {
    throw badRequest('ingredients must be an array');
  }

  const list = value
    .map((ing) => {
      if (!ing || typeof ing !== 'object') return null;
      const name = String(ing.name ?? '').trim();
      if (!name) return null;
      return {
        name: name.toLowerCase(),
        quantity: String(ing.quantity ?? '').trim()
      };
    })
    .filter(Boolean);

  if (!list.length) {
    throw badRequest('at least one ingredient with a name is required');
  }
  return list;
}

function validateNutrition(value, { partial = false } = {}) {
  if (value === null) return null;
  if (typeof value !== 'object') {
    throw badRequest('nutrition must be an object');
  }

  const out = {};
  let hasValue = false;

  for (const key of NUTRITION_KEYS) {
    const raw = value[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) {
      throw badRequest(`nutrition.${key} must be a number >= 0`);
    }
    out[key] = num;
    hasValue = true;
  }

  if (value.estimated !== undefined) {
    const b = parseBool(value.estimated);
    if (b === undefined) throw badRequest('nutrition.estimated must be a boolean');
    out.estimated = b;
  }
  if (value.perServing !== undefined) {
    const b = parseBool(value.perServing);
    if (b === undefined) throw badRequest('nutrition.perServing must be a boolean');
    out.perServing = b;
  }

  // No values at all: on update, explicitly clear existing nutrition; on
  // create, leave the field unset (nutrition is optional).
  if (!hasValue && out.estimated === undefined && out.perServing === undefined) {
    return partial ? null : undefined;
  }
  return out;
}

// Builds a validated patch object containing only whitelisted, present fields.
// When `partial` is true the caller may send a subset of the fields; when
// false (create) required fields are enforced.
function validateRecipePayload(body, { partial = false } = {}) {
  const input = body && typeof body === 'object' ? body : {};
  const out = {};

  /* name — required */
  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) throw badRequest('name is required');
    if (name.length > 200) throw badRequest('name is too long (max 200 characters)');
    out.name = name;
  } else if (!partial) {
    throw badRequest('name is required');
  }

  /* slug — optional; preserved on update unless explicitly provided */
  if (input.slug !== undefined) {
    const slug = String(input.slug).trim().toLowerCase();
    if (!slug) throw badRequest('slug cannot be empty');
    out.slug = slug;
  }

  if (input.area !== undefined) {
    out.area = String(input.area).trim() || 'Global';
  }

  if (input.isVeg !== undefined) {
    const b = parseBool(input.isVeg);
    if (b === undefined) throw badRequest('isVeg must be a boolean');
    out.isVeg = b;
  }

  if (input.category !== undefined) {
    out.category = String(input.category).trim();
  }

  if (input.tags !== undefined) {
    out.tags = toTagList(input.tags);
  }

  /* ingredients — required (create), non-empty when present (update) */
  if (input.ingredients !== undefined) {
    out.ingredients = validateIngredients(input.ingredients);
  } else if (!partial) {
    throw badRequest('ingredients are required');
  }

  if (input.instructions !== undefined) {
    out.instructions = Array.isArray(input.instructions)
      ? input.instructions.map((s) => String(s).trim()).filter(Boolean)
      : [];
  }

  for (const key of ['thumbnail', 'youtube', 'sourceUrl']) {
    if (input[key] !== undefined) out[key] = toUrl(input[key]);
  }

  if (input.cookingTime !== undefined) {
    const t = Number(input.cookingTime);
    if (input.cookingTime === '' || input.cookingTime === null) {
      out.cookingTime = null; // explicitly clear on update
    } else if (!Number.isFinite(t) || t < 0) {
      throw badRequest('cookingTime must be a number >= 0');
    } else {
      out.cookingTime = t;
    }
  }

  if (input.servings !== undefined) {
    const s = Number(input.servings);
    if (input.servings === '' || input.servings === null) {
      out.servings = null; // explicitly clear on update
    } else if (!Number.isFinite(s) || s < 1) {
      throw badRequest('servings must be a number >= 1');
    } else {
      out.servings = s;
    }
  }

  if (input.difficulty !== undefined) {
    const d = String(input.difficulty ?? '').trim().toLowerCase();
    if (d !== '' && !DIFFICULTIES.includes(d)) {
      throw badRequest(`difficulty must be one of: ${['', ...DIFFICULTIES].join(', ')}`);
    }
    out.difficulty = d;
  }

  if (input.nutrition !== undefined) {
    out.nutrition = validateNutrition(input.nutrition, { partial });
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Slug handling                                                       */
/* ------------------------------------------------------------------ */
async function ensureUniqueSlug(slug, excludeId) {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Recipe.exists(filter)) {
    throw conflict(`A recipe with the slug "${slug}" already exists`);
  }
  return slug;
}

async function generateUniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true }) || 'recipe';
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    if (!(await Recipe.exists(filter))) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */
async function listRecipes(query = {}) {
  const filter = {};

  const q = String(query.q || '').trim();
  if (q) filter.name = { $regex: escapeRegExp(q), $options: 'i' };

  const area = String(query.area || '').trim();
  if (area) filter.area = { $regex: escapeRegExp(area), $options: 'i' };

  const category = String(query.category || '').trim();
  if (category) filter.category = { $regex: escapeRegExp(category), $options: 'i' };

  if (query.isVeg !== undefined && query.isVeg !== null && query.isVeg !== '') {
    const b = parseBool(query.isVeg);
    if (b !== undefined) filter.isVeg = b;
  }

  const difficulty = String(query.difficulty || '').trim().toLowerCase();
  if (difficulty && DIFFICULTIES.includes(difficulty)) filter.difficulty = difficulty;

  if (String(query.hasNutrition || '').toLowerCase() === 'true') {
    filter.nutrition = { $ne: null };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));

  const cursor = Recipe.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([cursor.lean(), Recipe.countDocuments(filter)]);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    items
  };
}

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */
async function getRecipe(id) {
  const idStr = String(id || '');
  if (!mongoose.Types.ObjectId.isValid(idStr)) throw badRequest('Invalid recipe id');
  const recipe = await Recipe.findById(idStr).lean();
  if (!recipe) throw notFound();
  return recipe;
}

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */
async function createRecipe(body) {
  const data = validateRecipePayload(body, { partial: false });

  // Nutrition is optional on create — don't write nulls for empty objects.
  if (data.nutrition === null || data.nutrition === undefined) {
    delete data.nutrition;
  }

  if (data.slug) {
    data.slug = await ensureUniqueSlug(data.slug);
  } else {
    data.slug = await generateUniqueSlug(data.name);
  }

  return Recipe.create(data);
}

/* ------------------------------------------------------------------ */
/* Update                                                              */
/* ------------------------------------------------------------------ */
async function updateRecipe(id, body) {
  const idStr = String(id || '');
  if (!mongoose.Types.ObjectId.isValid(idStr)) throw badRequest('Invalid recipe id');

  const existing = await Recipe.findById(idStr);
  if (!existing) throw notFound();

  const data = validateRecipePayload(body, { partial: true });

  // Slug: preserve the existing slug when the admin does not provide one
  // (matches the current model behavior — slugs are only generated once).
  // When explicitly provided, enforce uniqueness.
  if (data.slug !== undefined && data.slug !== existing.slug) {
    data.slug = await ensureUniqueSlug(data.slug, idStr);
  } else {
    delete data.slug;
  }

  const updated = await Recipe.findByIdAndUpdate(idStr, data, {
    new: true,
    runValidators: true
  });
  return updated;
}

/* ------------------------------------------------------------------ */
/* Delete                                                              */
/* ------------------------------------------------------------------ */
async function deleteRecipe(id) {
  const idStr = String(id || '');
  if (!mongoose.Types.ObjectId.isValid(idStr)) throw badRequest('Invalid recipe id');

  const recipe = await Recipe.findByIdAndDelete(idStr);
  if (!recipe) throw notFound();

  // Keep dependent data consistent: drop the deleted recipe from every user's
  // favorites and from any meal-plan slots so no stale ObjectIds are left.
  await Promise.all([
    User.updateMany({}, { $pull: { 'activity.favoriteRecipeIds': recipe._id } }),
    MealPlan.updateMany({}, { $pull: { slots: { recipeId: recipe._id } } })
  ]);

  return recipe;
}

/* ------------------------------------------------------------------ */
/* Stats (admin dashboard)                                             */
/* ------------------------------------------------------------------ */
async function getStats() {
  const [total, veg, nonVeg, withNutrition] = await Promise.all([
    Recipe.countDocuments({}),
    Recipe.countDocuments({ isVeg: true }),
    Recipe.countDocuments({ isVeg: false }),
    Recipe.countDocuments({ nutrition: { $ne: null } })
  ]);
  return { total, veg, nonVeg, withNutrition };
}

module.exports = {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getStats,
  validateRecipePayload
};
