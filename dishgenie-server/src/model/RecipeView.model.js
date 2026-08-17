const mongoose = require('mongoose');

const { Schema } = mongoose;

// Loose per-recipe view tracking (lightweight activity, not a full analytics
// pipeline). Kept as an embedded array to avoid over-engineering. Each view
// entry does not need its own MongoDB id, hence `_id: false`.
const RecipeViewSchema = new Schema(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    count: { type: Number, default: 1, min: 1 },
    lastViewedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

module.exports = RecipeViewSchema;
