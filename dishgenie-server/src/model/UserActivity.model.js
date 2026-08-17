const mongoose = require('mongoose');
const RecipeViewSchema = require('./RecipeView.model');

const { Schema } = mongoose;

// Activity data embedded inside the User document. `favoriteRecipeIds` must
// stay under `activity.favoriteRecipeIds` for backward compatibility with
// existing documents and the recommendation service.
const UserActivitySchema = new Schema(
  {
    views: {
      type: [RecipeViewSchema],
      default: []
    },
    favoriteRecipeIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
      default: []
    }
  },
  { _id: false }
);

module.exports = UserActivitySchema;
