// src/middleware/validateHandler.js
// NOTE: Express 5 re-parses req.query on every access, so we must NOT mutate
// it. Instead, the normalized values are attached to req.validatedQuery.

const { parseBool } = require('../utils/helpers');

function toArray(val) {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val.flatMap(v => String(v).split(","));
  if (typeof val === "string") return val.split(",");
  return [];
}

function validateRecipeQuery(req, _res, next) {
  try {
    // Accept both "ingredients" (used by the frontend) and "ingredient" (legacy)
    const ingRaw = req.query.ingredients ?? req.query.ingredient;
    const ingredients = toArray(ingRaw)
      .map(s => String(s).trim().toLowerCase())
      .filter(Boolean);

    const isVeg = parseBool(req.query.veg ?? req.query.isVeg);

    // Nutrition filters: high-protein | low-calorie | low-carb | high-fiber
    const nutrition = String(req.query.nutrition || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) =>
        ['high-protein', 'low-calorie', 'low-carb', 'high-fiber'].includes(s)
      );

    let page = parseInt(req.query.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;

    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    req.validatedQuery = { ingredients, isVeg, nutrition, page, limit };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { validateRecipeQuery };
