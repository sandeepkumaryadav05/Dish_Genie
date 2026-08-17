const mongoose = require('mongoose');
const { MEAL_TYPES } = require('../constants/user.constants');

const { Schema } = mongoose;

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

// One planned recipe in a specific day/mealType slot.
const MealSlotSchema = new Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    mealType: { type: String, enum: MEAL_TYPES, required: true },
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true }
  },
  { _id: false }
);

const MealPlanSchema = new Schema(
  {
    // Owner of the plan
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Monday 00:00 of the week this plan belongs to (server timezone UTC)
    weekStart: { type: Date, required: true, index: true },
    slots: { type: [MealSlotSchema], default: [] }
  },
  { timestamps: true }
);

MealPlanSchema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', MealPlanSchema);
module.exports.DAYS = DAYS;
module.exports.MEAL_TYPES = MEAL_TYPES;
