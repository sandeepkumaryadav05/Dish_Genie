const mongoose = require('mongoose');
const slugify = require('slugify');

const IngredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    quantity: { type: String, default: '' }
  },
  { _id: false }
);

// Nutrition per serving. All values optional — recipes without verified
// nutrition data keep these null/undefined. DishGenie estimates are flagged
// `estimated: true` and are always expressed per serving (`perServing: true`).
const NutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, min: 0 },     // kcal
    protein: { type: Number, min: 0 },      // grams
    carbohydrates: { type: Number, min: 0 },// grams
    fat: { type: Number, min: 0 },          // grams
    fiber: { type: Number, min: 0 },        // grams
    sugar: { type: Number, min: 0 },        // grams
    sodium: { type: Number, min: 0 },       // milligrams
    estimated: { type: Boolean, default: false },
    perServing: { type: Boolean, default: false }
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    area: { type: String, trim: true, default: 'Global' },
    isVeg: { type: Boolean, default: true },
    category: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true, lowercase: true }],

    ingredients: {
      type: [IngredientSchema],
      validate: v => Array.isArray(v) && v.length > 0
    },

    instructions: [{ type: String, trim: true }],

    thumbnail: { type: String, default: '' },
    youtube: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },

    nutrition: { type: NutritionSchema, default: undefined },
    cookingTime: { type: Number, min: 0 },  // minutes
    difficulty: {
      type: String,
      enum: ['', 'easy', 'medium', 'hard'],
      default: ''
    },
    servings: { type: Number, min: 1 }
  },
  { timestamps: true }
);

RecipeSchema.index({ 'ingredients.name': 1 });
RecipeSchema.index({ area: 1, isVeg: 1 });
RecipeSchema.index({ name: 'text', tags: 'text', area: 'text' });

RecipeSchema.pre('save', function (next) {
  if (!this.slug) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

module.exports = mongoose.model('Recipe', RecipeSchema);
