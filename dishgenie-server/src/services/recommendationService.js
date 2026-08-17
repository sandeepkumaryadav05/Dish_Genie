const Recipe = require('../model/recipe.model.js');
const { escapeRegExp } = require('../utils/helpers');

const VEG_DIETS = ['vegetarian', 'vegan'];

function dietFilter(user) {
  const diet = user.preferences && user.preferences.diet;
  if (VEG_DIETS.includes(diet)) return { isVeg: true };
  return {};
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function ingredientNames(recipe) {
  return (recipe.ingredients || []).map((i) => String(i.name || '').toLowerCase());
}

function hasIngredient(recipe, token) {
  return ingredientNames(recipe).some((n) => n.includes(token));
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

/* ------------------------------------------------------------------ */
/* Ingredient normalization                                            */
/* ------------------------------------------------------------------ */

// Reduce a common-plural ingredient word to its singular form so that
// "tomatoes" matches "tomato", "potatoes" matches "potato", etc.
function singularizeIngredient(name) {
  let w = String(name || '').trim().toLowerCase();
  if (!w) return '';
  if (w.length <= 3) return w;
  if (/ies$/.test(w)) return w.slice(0, -3) + 'y'; // berries -> berry
  if (/oes$/.test(w)) return w.slice(0, -2); // tomatoes -> tomato
  if (/(ss|us)$/.test(w)) return w; // rice, asparagus-like forms stay
  if (/s$/.test(w)) return w.slice(0, -1); // onions -> onion
  return w;
}

function normalizeIngredient(name) {
  return singularizeIngredient(name).trim();
}

function ingredientsMatch(recipeIngredient, token) {
  const a = normalizeIngredient(recipeIngredient);
  const b = normalizeIngredient(token);
  if (!a || !b || a.length < 3 || b.length < 3) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function countIngredientMatches(recipe, tokens) {
  const names = ingredientNames(recipe);
  return tokens.filter((t) => names.some((n) => ingredientsMatch(n, t))).length;
}

function matchedIngredientNames(recipe, tokens) {
  const names = ingredientNames(recipe);
  return tokens.filter((t) => names.some((n) => ingredientsMatch(n, t)));
}

/* ------------------------------------------------------------------ */
/* Intent detection from the free-text question                        */
/* ------------------------------------------------------------------ */

function detectMealType(message) {
  const msg = String(message || '').toLowerCase();
  if (/(breakfast|morning)/.test(msg)) return 'breakfast';
  if (/(lunch|afternoon|midday)/.test(msg)) return 'lunch';
  if (/(dinner|supper|evening|tonight|night)/.test(msg)) return 'dinner';
  if (/(snack|chai|evening tea)/.test(msg)) return 'snack';
  return null;
}

function detectVegIntent(message) {
  const msg = String(message || '').toLowerCase();
  if (/(non\s*-?\s*veg|meat|chicken|fish|mutton|pork|beef|egg)/.test(msg)) return false;
  if (/(vegan|vegetarian|\bveg\b)/.test(msg)) return true;
  return undefined;
}

function detectDifficulty(message) {
  const msg = String(message || '').toLowerCase();
  if (/(easy|simple|beginner|quick)/.test(msg)) return 'easy';
  if (/(hard|advanced|challenging|difficult)/.test(msg)) return 'hard';
  if (/(medium|moderate)/.test(msg)) return 'medium';
  return null;
}

function detectMaxCookingTime(message) {
  const m = String(message || '')
    .toLowerCase()
    .match(/(?:under|within|in|less than|below|max|fewer than|<)\s*(\d+)\s*(?:minutes?|mins?\b|min\b)/);
  return m ? parseInt(m[1], 10) : null;
}

function detectMaxCalories(message) {
  const m = String(message || '')
    .toLowerCase()
    .match(/(?:under|within|less than|below|max|<|at most)\s*(\d+)\s*(?:cal|kcal|calories?)\b/);
  return m ? parseInt(m[1], 10) : null;
}

const CUISINE_KEYWORDS = [
  ['indian', /\bindian\b|\bindia\b/i],
  ['italian', /\bitalian\b|\bitaly\b/i],
  ['chinese', /\b(?:chinese|indo[- ]?chinese)\b/i],
  ['thai', /\bthai\b/i],
  ['mexican', /\bmexican\b/i],
  ['japanese', /\bjapanese\b|\bjapan\b/i],
  ['korean', /\bkorean\b/i],
  ['american', /\bamerican\b|\busa\b/i]
];

function detectCuisine(message) {
  const msg = String(message || '');
  for (const [cuisine, re] of CUISINE_KEYWORDS) {
    if (re.test(msg)) return cuisine;
  }
  return null;
}

function detectSpicePreference(message) {
  const msg = String(message || '').toLowerCase();
  if (/(not|no|without|less|avoid)\s+spicy|mild|not\s+hot/.test(msg)) return 'mild';
  if (/\bspicy\b|\bhot\b|\bextra\s+spicy\b/.test(msg)) return 'spicy';
  return null;
}

function detectFavoritesIntent(message) {
  const msg = String(message || '').toLowerCase();
  return /(based on (what|my)|similar to (what|my)|what i like|my favorites?|my taste|my preferences|usually like|for me)/.test(msg);
}

// Phrases that ask about a specific recipe ("tell me about X", "how to make X").
function detectRecipeLookup(message) {
  const msg = String(message || '').trim();
  const lower = msg.toLowerCase();
  const patterns = [
    /(?:tell\s+me\s+(?:more\s+)?about|what(?:\s+is|'s|s)?|how\s+(?:do\s+i\s+)?(?:make|to\s+make|cook|prepare)|details?\s+(?:about|on)|info\s+(?:about|on))\s*(?:the\s+)?(.+?)[.?!]*$/,
    /(?:recipe\s+(?:for|of|to\s+make|called|named))\s*(?:the\s+)?(.+?)[.?!]*$/,
    /(?:called|named)\s+(.+?)[.?!]*$/
  ];
  for (const re of patterns) {
    const m = lower.match(re);
    if (m && m[1]) {
      const phrase = m[1].trim().replace(/^the\s+/i, '').trim();
      if (phrase.length >= 3 && phrase.length <= 60) return phrase;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Nutrition intent detection & checks                                 */
/* ------------------------------------------------------------------ */

const NUTRITION_INTENTS = {
  'high-protein': /(high.?protein|protein.?packed|protein.?rich|protein\b)/i,
  'low-calorie': /(low.?calorie|low.?cal|lighter|under\s+\d+\s*(cal|kcal)|fewer calories)/i,
  'low-carb': /(low.?carb|low.?carbs|keto|ketogenic)/i,
  'high-fiber': /(high.?fiber|high.?fibre|fiber.?rich)/i
};

function detectNutritionIntent(message) {
  const msg = String(message || '');
  for (const [intent, re] of Object.entries(NUTRITION_INTENTS)) {
    if (re.test(msg)) return intent;
  }
  return null;
}

function nutritionHit(recipe, intent) {
  const n = recipe.nutrition || {};
  if (intent === 'high-protein') return n.protein != null && n.protein >= 20 ? 1 : 0;
  if (intent === 'low-calorie') return n.calories != null && n.calories <= 500 ? 1 : 0;
  if (intent === 'low-carb') return n.carbohydrates == null || n.carbohydrates <= 30 ? 1 : 0;
  if (intent === 'high-fiber') return n.fiber != null && n.fiber >= 5 ? 1 : 0;
  return 0;
}

function isSpicyRecipe(recipe) {
  const tags = (recipe.tags || []).map((t) => String(t));
  if (tags.some((t) => /spicy|hot|chilli|chili|schezwan/.test(t))) return true;
  const names = ingredientNames(recipe).join(' ');
  return /chilli|chili|chilies|chiles|jalapeno|schezwan|serrano/.test(names);
}

/* ------------------------------------------------------------------ */
/* History (favorites + views) as recommendation signals               */
/* ------------------------------------------------------------------ */

async function historyContext(user) {
  const favs = (user && user.activity && user.activity.favoriteRecipeIds) || [];
  const views = (user && user.activity && user.activity.views) || [];
  const ids = Array.from(
    new Set([
      ...favs,
      ...views.map((v) => v && v.recipeId)
    ].map(String).filter(Boolean))
  );
  if (!ids.length) {
    return { docs: [], areas: new Set(), categories: new Set(), ingredients: new Set() };
  }
  const docs = await Recipe.find({ _id: { $in: ids } }).lean();
  const areas = new Set();
  const categories = new Set();
  const ingredients = new Set();
  for (const d of docs) {
    if (d.area) areas.add(String(d.area).toLowerCase());
    if (d.category) categories.add(String(d.category).toLowerCase());
    (d.ingredients || []).forEach((i) => {
      const name = String(i.name || '').toLowerCase();
      if (name) ingredients.add(name);
    });
  }
  return { docs, areas, categories, ingredients };
}

/* ------------------------------------------------------------------ */
/* Scoring — higher is better. Tuned for the fields available.         */
/* ------------------------------------------------------------------ */
function scoreRecipe(recipe, user) {
  const prefs = (user && user.preferences) || {};
  const reasons = [];
  let score = 0;

  const area = String(recipe.area || '').toLowerCase();
  const category = String(recipe.category || '').toLowerCase();

  /* Diet compatibility (20) */
  if (VEG_DIETS.includes(prefs.diet)) {
    // Non-veg recipes are already excluded at the query level.
    score += 20;
    reasons.push('Fits your vegetarian/vegan preference');
  } else {
    score += 10;
    reasons.push('Compatible with your diet');
  }

  /* Cuisine preference (15) */
  const favCuisines = prefs.favoriteCuisines || [];
  const matchedCuisine = favCuisines.find(
    (c) => area.includes(c) || category.includes(c)
  );
  if (matchedCuisine) {
    score += 15;
    reasons.push(`Matches your ${matchedCuisine} cuisine preference`);
  }

  /* Nutrition goal (15) — only when verified nutrition data exists */
  const n = recipe.nutrition || {};
  const goal = prefs.nutritionGoal;
  if (n.calories != null && goal && goal !== 'balanced') {
    let goalHit = false;
    if (goal === 'high-protein' && n.protein != null && n.protein >= 20) {
      goalHit = true;
    } else if (goal === 'low-calorie' && n.calories <= 500) {
      goalHit = true;
    } else if (goal === 'low-carb' && (n.carbohydrates == null || n.carbohydrates <= 30)) {
      goalHit = true;
    } else if (goal === 'high-fiber' && n.fiber != null && n.fiber >= 5) {
      goalHit = true;
    }
    if (goalHit) {
      score += 15;
      reasons.push(`Supports your ${goal.replace('-', ' ')} goal`);
    }
  }

  /* Cooking time (10) */
  if (recipe.cookingTime && prefs.maxCookingTime) {
    if (recipe.cookingTime <= prefs.maxCookingTime) {
      score += 10;
      reasons.push(`Ready in about ${recipe.cookingTime} minutes`);
    } else {
      score -= 10;
    }
  }

  /* Difficulty (5) */
  if (prefs.difficulty && prefs.difficulty !== 'any') {
    if (recipe.difficulty === prefs.difficulty) {
      score += 5;
      reasons.push(`Matches your ${prefs.difficulty} cooking level`);
    } else {
      score -= 3;
    }
  }

  /* Favorite ingredients (30) */
  const favIngredients = prefs.favoriteIngredients || [];
  const matchedFavs = favIngredients.filter((f) => hasIngredient(recipe, f));
  if (matchedFavs.length) {
    score += Math.min(30, matchedFavs.length * 10);
    reasons.push(`Uses ingredients you like: ${matchedFavs.join(', ')}`);
  }

  /* Disliked ingredients (−40) */
  const disliked = prefs.dislikedIngredients || [];
  if (disliked.some((d) => hasIngredient(recipe, d))) {
    score -= 40;
    reasons.push('Contains ingredients you usually avoid');
  }

  /* Meal-type preference (5) */
  const prefMeals = prefs.mealTypes || [];
  if (
    prefMeals.length &&
    prefMeals.some((m) => category.includes(m))
  ) {
    score += 5;
  }

  /* History / favorites (5) */
  if (user && user.activity && user.activity.favoriteRecipeIds) {
    if (
      user.activity.favoriteRecipeIds.some(
        (id) => String(id) === String(recipe._id)
      )
    ) {
      score += 5;
      reasons.push('One of your favorites');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, reasons };
}

/* ------------------------------------------------------------------ */
/* Intent-aware scoring used by the AI chat path                       */
/* ------------------------------------------------------------------ */
function scoreForIntent(recipe, intent, { tokens = [], history } = {}) {
  const reasons = [];
  let score = 0;

  const n = recipe.nutrition || {};
  const area = String(recipe.area || '').toLowerCase();
  const category = String(recipe.category || '').toLowerCase();
  const names = ingredientNames(recipe);

  /* Ingredient overlap (up to 40) */
  if (tokens.length) {
    const matched = tokens.filter((t) =>
      names.some((ing) => ingredientsMatch(ing, t))
    );
    if (matched.length) {
      score += Math.min(40, matched.length * 12);
      reasons.push(`Uses ingredients you have: ${matched.join(', ')}`);
    }
  }

  /* Nutrition goal match (20) */
  if (intent.nutritionIntent && nutritionHit(recipe, intent.nutritionIntent)) {
    score += 20;
    reasons.push(`Supports your ${intent.nutritionIntent.replace('-', ' ')} goal`);
  }

  /* Calorie cap (15 / −8) */
  if (intent.maxCalories != null) {
    if (n.calories != null) {
      if (n.calories <= intent.maxCalories) {
        score += 15;
        reasons.push(`Under ${intent.maxCalories} kcal per serving`);
      } else {
        score -= 8;
      }
    } else {
      score -= 2; // no nutrition data — slightly penalize
    }
  }

  /* Cooking time cap (10 / −8) */
  if (intent.maxCookingTime != null) {
    if (recipe.cookingTime != null) {
      if (recipe.cookingTime <= intent.maxCookingTime) {
        score += 10;
        reasons.push(`Ready in about ${recipe.cookingTime} minutes`);
      } else {
        score -= 8;
      }
    }
  }

  /* Difficulty (10 / −5) */
  if (intent.difficulty) {
    if (recipe.difficulty === intent.difficulty) {
      score += 10;
      reasons.push(`${capitalize(intent.difficulty)} to make`);
    } else if (recipe.difficulty) {
      score -= 5;
    }
  }

  /* Meal type (15) */
  if (intent.mealType && category.includes(intent.mealType)) {
    score += 15;
    reasons.push(`Great for ${intent.mealType}`);
  }

  /* Cuisine (12) */
  if (intent.cuisine && (area.includes(intent.cuisine) || category.includes(intent.cuisine))) {
    score += 12;
    reasons.push(`${capitalize(intent.cuisine)} cuisine`);
  }

  /* Vegetarian request (12) */
  if (intent.isVeg === true && recipe.isVeg) {
    score += 12;
    reasons.push('Vegetarian');
  }

  /* Spice preference (only when the data supports it) */
  if (intent.spice === 'mild') {
    if (isSpicyRecipe(recipe)) {
      score -= 8;
    } else {
      score += 6;
      reasons.push('Mild / not spicy');
    }
  } else if (intent.spice === 'spicy' && isSpicyRecipe(recipe)) {
    score += 6;
    reasons.push('Spicy');
  }

  /* History similarity (8) */
  if (history && (history.areas.has(area) || history.categories.has(category))) {
    score += 8;
    reasons.push('Similar to recipes you have liked or viewed');
  }

  return { score: Math.round(score), reasons };
}

/* ------------------------------------------------------------------ */
/* Personalized recommendation list                                    */
/* ------------------------------------------------------------------ */
async function getRecommendations({ user, limit = 12, ingredientHint }) {
  const filter = dietFilter(user);
  const hint = splitList(ingredientHint);
  if (hint.length) {
    filter['ingredients.name'] = { $in: hint };
  }

  const recipes = await Recipe.find(filter).limit(200).lean();

  const scored = recipes
    .map((recipe) => ({ recipe, ...scoreRecipe(recipe, user) }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ recipe, score, reasons }) => ({
    recipe,
    score,
    reasons
  }));
}

/* ------------------------------------------------------------------ */
/* Find recipes relevant to a free-text AI question                    */
/* ------------------------------------------------------------------ */
let distinctIngredientsCache = null;
let distinctIngredientsAt = 0;

async function getDistinctIngredients() {
  if (
    distinctIngredientsCache &&
    Date.now() - distinctIngredientsAt < 60 * 1000
  ) {
    return distinctIngredientsCache;
  }
  const names = await Recipe.distinct('ingredients.name');
  distinctIngredientsCache = names.map((n) => String(n).toLowerCase());
  distinctIngredientsAt = Date.now();
  return distinctIngredientsCache;
}

async function extractIngredientTokens(message, favoriteIngredients = []) {
  const all = await getDistinctIngredients();
  const msg = String(message || '').toLowerCase();
  const found = new Set();

  // Direct substring match against known ingredient names.
  for (const ing of all) {
    if (ing && msg.includes(ing) && ing.length > 2) {
      found.add(ing);
      if (found.size >= 8) break;
    }
  }

  // Word-level match with singularization ("tomatoes" -> "tomato").
  if (found.size < 8) {
    const words = msg.split(/[^a-z]+/).filter((w) => w.length > 2);
    for (const word of words) {
      if (found.size >= 8) break;
      const norm = normalizeIngredient(word);
      if (!norm || norm.length < 3) continue;
      const hit = all.find(
        (ing) =>
          norm === ing ||
          ing.includes(norm) ||
          norm.includes(ing)
      );
      if (hit) found.add(hit);
    }
  }

  // Merge favorite ingredients (the user explicitly likes them).
  for (const f of (favoriteIngredients || [])) {
    const fav = String(f).trim().toLowerCase();
    if (fav && all.includes(fav)) found.add(fav);
  }

  return Array.from(found).slice(0, 8);
}

async function findRecipeByName(phrase) {
  const q = String(phrase || '').trim();
  if (!q) return null;
  const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const nameRe = new RegExp(escapeRegExp(q), 'i');
  const recipe =
    (slug && (await Recipe.findOne({ slug }).lean())) ||
    (await Recipe.findOne({ name: nameRe }).lean());
  return recipe || null;
}

/**
 * Main entry point for the AI chat. Returns ranked candidates as
 * `{ recipe, score, reasons }[]` — every recipe is a real MongoDB document.
 */
async function searchRelevantRecipes({ message = '', user, limit = 15 }) {
  const lookupPhrase = detectRecipeLookup(message);
  if (lookupPhrase) {
    const recipe = await findRecipeByName(lookupPhrase);
    if (recipe) {
      const similar = await Recipe.find({
        _id: { $ne: recipe._id },
        $or: [
          { category: recipe.category || '::none::' },
          { area: recipe.area || '::none::' }
        ]
      })
        .limit(4)
        .lean();
      return [
        { recipe, score: 100, reasons: ['Direct match for your question'] },
        ...similar.map((r) => ({ recipe: r, score: 60, reasons: ['Similar to your search'] }))
      ].slice(0, limit);
    }
    // Fall through to general search — the requested recipe simply isn't in
    // the database, so we still return real candidates for the AI to compare.
  }

  const intent = {
    mealType: detectMealType(message),
    isVeg: detectVegIntent(message),
    difficulty: detectDifficulty(message),
    maxCookingTime: detectMaxCookingTime(message),
    maxCalories: detectMaxCalories(message),
    nutritionIntent: detectNutritionIntent(message),
    cuisine: detectCuisine(message),
    spice: detectSpicePreference(message),
    favoritesIntent: detectFavoritesIntent(message)
  };

  const history = await historyContext(user);

  let tokens = await extractIngredientTokens(
    message,
    user.preferences && user.preferences.favoriteIngredients
  );

  // "Similar to what I like" — fold history ingredients into the signal.
  if (intent.favoritesIntent || history.ingredients.size) {
    const histTokens = Array.from(history.ingredients)
      .filter((i) => i && i.length > 2)
      .slice(0, 4);
    tokens = Array.from(new Set([...tokens, ...histTokens])).slice(0, 8);
  }

  const filter = dietFilter(user);

  // Message-level veg/non-veg intent (never overrides a stored diet).
  const prefVeg = VEG_DIETS.includes(user.preferences && user.preferences.diet);
  if (!prefVeg && intent.isVeg !== undefined) {
    filter.isVeg = intent.isVeg;
  }

  if (intent.mealType) {
    filter.category = new RegExp(intent.mealType, 'i');
  }

  // Cuisine terms from the message + stored favorite cuisines.
  const cuisineTerms = Array.from(
    new Set([
      ...(intent.cuisine ? [intent.cuisine] : []),
      ...((user.preferences && user.preferences.favoriteCuisines) || [])
    ])
  ).filter(Boolean);
  if (cuisineTerms.length) {
    filter.$or = cuisineTerms.map((c) => [
      { area: { $regex: escapeRegExp(c), $options: 'i' } },
      { category: { $regex: escapeRegExp(c), $options: 'i' } }
    ]).flat();
  }

  let recipes = [];
  if (tokens.length) {
    recipes = await Recipe.find({
      ...filter,
      'ingredients.name': { $in: tokens }
    })
      .limit(200)
      .lean();
  } else {
    recipes = await Recipe.find(filter).limit(200).lean();
  }

  // Meal-type categories don't always exist in the data (e.g. "dinner") —
  // retry without that filter instead of returning nothing.
  if (intent.mealType && !recipes.length) {
    const { category, ...rest } = filter;
    recipes = await Recipe.find(rest).limit(200).lean();
  }

  // Ingredient query found nothing — fall back to the broad set so the AI can
  // still present the closest real matches instead of an empty answer.
  if (tokens.length && !recipes.length) {
    recipes = await Recipe.find(filter).limit(200).lean();
  }

  const scored = recipes
    .map((recipe) => {
      const base = scoreRecipe(recipe, user);
      const intentScore = scoreForIntent(recipe, intent, { tokens, history });
      const reasons = Array.from(
        new Set([...intentScore.reasons, ...base.reasons])
      ).slice(0, 6);
      return {
        recipe,
        score: Math.max(0, Math.min(100, Math.round(intentScore.score + base.score * 0.5))),
        reasons
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

module.exports = {
  getRecommendations,
  searchRelevantRecipes,
  scoreRecipe,
  // Exposed for unit tests / reuse.
  detectMealType,
  detectVegIntent,
  detectDifficulty,
  detectMaxCookingTime,
  detectMaxCalories,
  detectCuisine,
  detectNutritionIntent,
  detectRecipeLookup,
  normalizeIngredient,
  countIngredientMatches,
  scoreForIntent
};
