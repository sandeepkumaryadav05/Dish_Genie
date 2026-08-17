// Nutrition estimator for DishGenie.
//
// Computes estimated per-serving nutrition for a recipe from its ingredient
// list using the local food database in ../data/nutritionData.js. Values are
// approximations — every result is flagged `estimated: true`.
const { FOODS, ALIASES, UNIT_OPTIONS, SPICE_KEYS } = require('../data/nutritionData.js');

const GRAMS_PER_POUND = 453.592;
const GRAMS_PER_OUNCE = 28.3495;
const GRAMS_PER_KILO = 1000;

const FRACTIONS = { '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };

// Quantity words that imply a fixed tiny/one portion when no number is given.
const WORD_UNITS = {
  pinch: { unit: 'pinch', amount: 1 },
  dash: { unit: 'dash', amount: 1 },
  knob: { unit: 'knob', amount: 1 },
  handful: { unit: 'handful', amount: 1 },
  splash: { unit: 'tbsp', amount: 1 },
  sprig: { unit: 'sprig', amount: 1 },
  sprinkle: { unit: 'pinch', amount: 1 },
  dusting: { unit: 'pinch', amount: 1 },
  'to taste': { unit: 'pinch', amount: 1 },
  garnish: { unit: 'pinch', amount: 1 },
  'for serving': { unit: 'pinch', amount: 1 },
  'as needed': { unit: 'pinch', amount: 1 },
  boiling: { unit: '', amount: null },
  boiled: { unit: '', amount: null },
  cooked: { unit: '', amount: null }
};

// Priority order for matching a unit word after the amount.
const UNIT_PATTERNS = [
  { re: /^(kilograms|kilos|kilo|kg)\b/, unit: 'kg' },
  { re: /^(grams|gram|gr|g)\b/, unit: 'g' },
  { re: /^(pounds|pound|lb|lbs)\b/, unit: 'lb' },
  { re: /^(ounces|ounce|oz)\b/, unit: 'oz' },
  { re: /^(milliliters|millilitres|milliliter|millilitre|ml)\b/, unit: 'ml' },
  { re: /^(liters|litres|liter|litre|l)\b/, unit: 'l' },
  { re: /^(tablespoons|tablespoon|tbsp|tbs|tblespn|tblsp)\b/, unit: 'tbsp' },
  { re: /^(teaspoons|teaspoon|tsp|tsps)\b/, unit: 'tsp' },
  { re: /^(cups|cup)\b/, unit: 'cup' },
  { re: /^(cloves|clove)\b/, unit: 'clove' },
  { re: /^(rashers|rasher)\b/, unit: 'rasher' },
  { re: /^(fillets|fillet)\b/, unit: 'fillet' },
  { re: /^(sprigs|sprig)\b/, unit: 'sprig' },
  { re: /^(leaves|leaf)\b/, unit: 'leaf' },
  { re: /^(sticks|stick)\b/, unit: 'stick' },
  { re: /^(stalks|stalk)\b/, unit: 'stalk' },
  { re: /^(heads|head)\b/, unit: 'head' },
  { re: /^(florets|floret)\b/, unit: 'floret' },
  { re: /^(bunches|bunch)\b/, unit: 'bunch' },
  { re: /^(packets|packet|packets|pack)\b/, unit: 'packet' },
  { re: /^(cans|can|tins|tin)\b/, unit: 'can' },
  { re: /^(jars|jar)\b/, unit: 'jar' },
  { re: /^(pots|pot)\b/, unit: 'pot' },
  { re: /^(scoops|scoop)\b/, unit: 'scoop' },
  { re: /^(squares|square)\b/, unit: 'square' },
  { re: /^(strips|strip)\b/, unit: 'strip' },
  { re: /^(tails|tail)\b/, unit: 'tail' },
  { re: /^(wedges|wedge)\b/, unit: 'wedge' },
  { re: /^(chunks|chunk)\b/, unit: 'chunk' },
  { re: /^(pieces|piece)\b/, unit: 'piece' },
  { re: /^(slices|slice)\b/, unit: 'slice' },
  { re: /^(units|unit|items|item)\b/, unit: 'unit' },
  { re: /^(pinches|pinch)\b/, unit: 'pinch' },
  { re: /^(dashes|dash)\b/, unit: 'dash' },
  { re: /^(knobs|knob)\b/, unit: 'knob' },
  { re: /^(handfuls|handful)\b/, unit: 'handful' },
  { re: /^(large|medium|small)\b/, unit: 'size' }
];

const AMOUNT_RE = /^\s*(\d+(?:\.\d+)?(?:[-\/]\d+(?:\.\d+)?)?(?:\s+\d+(?:\/\d+)?)?)\s*(.*)$/;
const PAREN_WEIGHT_RE = /\((\d+(?:\.\d+)?)\s*(g|kg|oz|lb)\)/i;
const MULTI_RE = /^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(g|kg|oz|lb|ml|l|cup|tbsp|tsp)\b/;

function normalize(raw) {
  let s = String(raw || '').toLowerCase().replace(/[–—]/g, '-').trim();
  for (const [from, to] of Object.entries(FRACTIONS)) s = s.split(from).join(` ${to} `);
  s = s.replace(/(\d)\s*-\s*(\d)\s*\/\s*(\d)/g, '$1 $2/$3');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function evalAmount(token) {
  if (!token) return null;
  const t = token.trim();
  if (!t) return null;
  if (t.includes(' ')) {
    const [whole, ...rest] = t.split(' ');
    const w = parseFloat(whole);
    if (!Number.isFinite(w)) return null;
    const fracToken = rest.join(' ');
    // Only treat the trailing part as a fraction when it actually contains "/".
    return fracToken.includes('/') && evalFraction(fracToken) != null ? w + evalFraction(fracToken) : w;
  }
  if (t.includes('/')) {
    const [a, b] = t.split('/');
    const n = parseFloat(a);
    const d = parseFloat(b);
    return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : null;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function evalFraction(token) {
  const t = token.trim();
  if (!t) return null;
  const parts = t.split('/');
  if (parts.length === 2) {
    const n = parseFloat(parts[0]);
    const d = parseFloat(parts[1]);
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) return n / d;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

// Returns { amount, unit } where amount is null when the quantity has no number.
function parseQuantity(raw) {
  const s = normalize(raw);

  if (!s) return { amount: null, unit: '' };

  for (const [word, mapping] of Object.entries(WORD_UNITS)) {
    if (s === word) return mapping;
  }

  const paren = s.match(PAREN_WEIGHT_RE);
  if (paren) {
    const grams = paren[2] === 'kg' ? parseFloat(paren[1]) * GRAMS_PER_KILO
      : paren[2] === 'oz' ? parseFloat(paren[1]) * GRAMS_PER_OUNCE
      : paren[2] === 'lb' ? parseFloat(paren[1]) * GRAMS_PER_POUND
      : parseFloat(paren[1]);
    return { amount: grams, unit: 'g' };
  }

  const multi = s.match(MULTI_RE);
  if (multi) {
    const n = parseFloat(multi[1]) * parseFloat(multi[2]);
    return { amount: n, unit: multi[3] === 'kg' ? 'kg' : multi[3] === 'oz' ? 'oz' : multi[3] === 'lb' ? 'lb' : multi[3] };
  }

  const m = s.match(AMOUNT_RE);
  if (!m) return { amount: null, unit: '' };

  const amount = evalAmount(m[1]);
  const rest = m[2].trim();

  let unit = '';
  if (rest) {
    for (const { re, unit: u } of UNIT_PATTERNS) {
      const mm = rest.match(re);
      if (mm) {
        unit = u;
        break;
      }
    }
  }
  return { amount, unit };
}

function lookupIngredient(name) {
  let n = String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  n = n.replace(/^(a |an )?(can|tin|jar|pack|packet|pot|bag) of\s+/, '');
  if (!n) return null;

  const exact = ALIASES[n];
  if (exact && FOODS[exact]) return { key: exact, food: FOODS[exact] };
  if (FOODS[n]) return { key: n, food: FOODS[n] };

  const cleaned = n
    .replace(/\b(chopped|diced|sliced|minced|ground|fresh|frozen|dried|smoked|cooked|raw|beaten|finely|roughly|peeled|crushed|grated|mashed|salted|unsalted|mature|soft|free-range|whole|golden|plain|strong|dark|light|floury|baby|new|small|king|tiger|extra|virgin|smooth|crunchy|gluten-free)\b/g, '')
    .replace(/\b(caster|granulated|powdered|icing|muscovado|brown|white|soft|golden|ground|flaked|rolled|porridge)\b/g, '')
    .replace(/\s+/g, ' ').trim();
  if (FOODS[cleaned]) return { key: cleaned, food: FOODS[cleaned] };

  const singular = cleaned.length > 1 && cleaned.endsWith('s') ? cleaned.slice(0, -1) : cleaned;
  if (FOODS[singular]) return { key: singular, food: FOODS[singular] };

  return null;
}

function gramsToGrams(amount, unit, opts) {
  if (amount == null) return null;
  const density = opts.density != null ? opts.density : 1;
  switch (unit) {
    case 'g': return amount;
    case 'kg': return amount * GRAMS_PER_KILO;
    case 'lb': return amount * GRAMS_PER_POUND;
    case 'oz': return amount * GRAMS_PER_OUNCE;
    case 'ml': return amount * density;
    case 'l': return amount * 1000 * density;
    case 'cup': return amount * (opts.perCup != null ? opts.perCup : density * 240);
    case 'tbsp': {
      if (opts.perTbsp != null) return amount * opts.perTbsp;
      if (opts.perTsp != null) return amount * opts.perTsp * 3;
      return amount * density * 15;
    }
    case 'tsp': {
      if (opts.perTsp != null) return amount * opts.perTsp;
      if (opts.perTbsp != null) return amount * opts.perTbsp / 3;
      return amount * density * 5;
    }
    default: return null; // handled by count logic in ingredientGrams
  }
}

function ingredientGrams(ingName, rawQuantity) {
  const lookup = lookupIngredient(ingName);
  if (!lookup) return null;
  const { key, food } = lookup;
  const opts = UNIT_OPTIONS[key] || {};
  const { amount, unit } = parseQuantity(rawQuantity);

  if (amount == null) {
    // No numeric quantity: flavorings get a light portion; real foods use a
    // cooked default portion (or half a cup) as a fallback.
    let def;
    if (SPICE_KEYS.has(key) || key === 'salt' || key === 'pepper') def = 2;
    else if (opts.perTbsp != null) def = opts.perTbsp;
    else if (opts.perDefault != null) def = opts.perDefault;
    else if (opts.perCup != null) def = opts.perCup / 2;
    else def = 120;
    if (DRY_STARCH_KEYS.has(key)) def = def * DRY_TO_COOKED_FACTOR;
    return { grams: def, food, key };
  }

  let grams = gramsToGrams(amount, unit, opts);
  if (grams == null) {
    if (unit === 'size') {
      // "1 large/medium/small" -> grams per item at that size.
      const sizeKey = { large: 'large', medium: 'medium', small: 'small' }[firstWord(rawQuantity) || 'medium'];
      const perItem = opts[sizeKey] != null ? opts[sizeKey] : opts.perUnit;
      grams = amount * (perItem != null ? perItem : 50);
    } else if (unit && unit !== '') {
      const perProp = 'per' + unit.charAt(0).toUpperCase() + unit.slice(1);
      const per = opts[perProp] != null ? opts[perProp]
        : unit === 'pinch' ? (opts.perTsp != null ? opts.perTsp / 4 : 0.5)
        : unit === 'dash' ? 0.5
        : unit === 'knob' ? (opts.perTbsp != null ? opts.perTbsp : 10)
        : unit === 'handful' ? 15
        : unit === 'slice' ? (opts.perSlice != null ? opts.perSlice : 20)
        : SPICE_KEYS.has(key) ? (unit === 'tsp' ? 2 : 6)
        : null;
      grams = per != null ? amount * per : amount * (opts.perUnit != null ? opts.perUnit : 50);
    } else {
      // Plain count with no unit ("2 lemons", "4 bay leaves").
      let per;
      if (opts.perUnit != null) per = opts.perUnit;
      else if (SPICE_KEYS.has(key)) per = opts.perLeaf != null ? opts.perLeaf : opts.perSprig != null ? opts.perSprig : 2;
      else per = 50;
      grams = amount * per;
    }
  }

  return { grams, food, key };
}

function firstWord(raw) {
  const m = String(raw || '').match(/\b(large|medium|small)\b/);
  return m ? m[1] : null;
}

const NUTRIENT_KEYS = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium'];

// Foods whose per-100g values describe the dry/raw form. When only a cooked
// default portion is given (e.g. "Boiled rice"), we scale to the dry equivalent.
const DRY_STARCH_KEYS = new Set([
  'rice', 'basmati rice', 'sushi rice', 'quinoa', 'couscous', 'bulgur wheat',
  'pasta', 'noodles', 'egg noodles', 'rice noodles', 'udon noodles',
  'oats', 'mixed grain', 'whole wheat'
]);
const DRY_TO_COOKED_FACTOR = 0.45;

function sanitizeNutrition(nutrition) {
  const out = {};
  for (const k of NUTRIENT_KEYS) {
    let v = Number(nutrition[k]);
    if (!Number.isFinite(v) || v < 0) v = 0;
    out[k] = v > 0 && v < 1 ? 1 : Math.round(v);
  }
  return out;
}

// Estimates per-serving nutrition for a recipe.
// recipe: { ingredients: [{ name, quantity }], servings?: number }
// Returns the nutrition object (per serving) plus metadata, or null when there
// are no ingredients at all.
function estimateRecipeNutrition(recipe, servingsOverride) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (ingredients.length === 0) return null;

  const servings = Number(servingsOverride) >= 1
    ? Number(servingsOverride)
    : Number(recipe.servings) >= 1 ? Number(recipe.servings) : 4;

  const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };

  for (const ing of ingredients) {
    const res = ingredientGrams(ing.name, ing.quantity);
    if (!res) continue;
    const factor = res.grams / 100;
    for (const k of NUTRIENT_KEYS) {
      const v = Number(res.food[k]);
      if (Number.isFinite(v)) totals[k] += v * factor;
    }
  }

  const perServing = {};
  for (const k of NUTRIENT_KEYS) perServing[k] = totals[k] / servings;

  return {
    ...sanitizeNutrition(perServing),
    estimated: true,
    perServing: true,
    servings
  };
}

module.exports = {
  parseQuantity,
  lookupIngredient,
  ingredientGrams,
  estimateRecipeNutrition,
  sanitizeNutrition,
  NUTRIENT_KEYS
};
