const mongoose = require('mongoose');
const {
  DIETS,
  MEAL_TYPES,
  DIFFICULTIES,
  NUTRITION_GOALS
} = require('../constants/user.constants');

const { Schema } = mongoose;

// Embedded preference snapshot stored inside the User document. Kept as a
// plain nested object (`_id: false`) to stay identical to the pre-refactor
// document shape stored in MongoDB.
const UserPreferencesSchema = new Schema(
  {
    diet: { type: String, enum: DIETS, default: 'any' },
    favoriteCuisines: [{ type: String, trim: true, lowercase: true }],
    favoriteIngredients: [{ type: String, trim: true, lowercase: true }],
    dislikedIngredients: [{ type: String, trim: true, lowercase: true }],
    mealTypes: [{ type: String, enum: MEAL_TYPES }],
    maxCookingTime: { type: Number, default: 60, min: 0 }, // minutes
    difficulty: { type: String, enum: DIFFICULTIES, default: 'any' },
    nutritionGoal: { type: String, enum: NUTRITION_GOALS, default: 'balanced' }
  },
  { _id: false }
);

module.exports = UserPreferencesSchema;
