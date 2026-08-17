const mongoose = require('mongoose');
const UserPreferencesSchema = require('./UserPreferences.model');
const UserActivitySchema = require('./UserActivity.model');
const {
  DIETS,
  MEAL_TYPES,
  DIFFICULTIES,
  NUTRITION_GOALS
} = require('../constants/user.constants');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    // Firebase Auth UID — the stable, unique identifier linking Firebase
    // authentication to the MongoDB application record.
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    photoURL: { type: String, default: '' },

    // Authorization role. Only 'admin' may access the admin APIs. This field is
    // never writable through any user-facing route — it is set exclusively via
    // the server-side promotion script (scripts/setAdminRole.js).
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    preferences: { type: UserPreferencesSchema, default: () => ({}) },

    activity: { type: UserActivitySchema, default: () => ({}) }
  },
  { timestamps: true }
);

UserSchema.methods.getOrCreatePreferences = function () {
  return {
    diet: this.preferences.diet,
    favoriteCuisines: this.preferences.favoriteCuisines,
    favoriteIngredients: this.preferences.favoriteIngredients,
    dislikedIngredients: this.preferences.dislikedIngredients,
    mealTypes: this.preferences.mealTypes,
    maxCookingTime: this.preferences.maxCookingTime,
    difficulty: this.preferences.difficulty,
    nutritionGoal: this.preferences.nutritionGoal
  };
};

const UserModel = mongoose.model('User', UserSchema);

// Backward-compatible constant exports (previously attached to the model).
module.exports = UserModel;
module.exports.DIETS = DIETS;
module.exports.MEAL_TYPES = MEAL_TYPES;
module.exports.DIFFICULTIES = DIFFICULTIES;
module.exports.NUTRITION_GOALS = NUTRITION_GOALS;
