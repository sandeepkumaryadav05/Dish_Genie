const mongoose = require('mongoose');
const User = require('../model/User.model');
const Recipe = require('../model/recipe.model');
const { getOrCreateUser } = require('./userService');
const { badRequest } = require('../utils/helpers');

async function ensureValidRecipeId(recipeId, { requireExisting } = {}) {
  const idStr = String(recipeId || '');
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    throw badRequest('Invalid recipeId');
  }
  if (requireExisting) {
    const recipe = await Recipe.exists({ _id: idStr });
    if (!recipe) {
      throw Object.assign(new Error('Recipe not found'), { status: 404 });
    }
  }
  return idStr;
}

async function addFavorite(authUser, recipeId) {
  await ensureValidRecipeId(recipeId, { requireExisting: true });
  const user = await getOrCreateUser(authUser);
  await User.findOneAndUpdate(
    { firebaseUid: user.firebaseUid },
    { $addToSet: { 'activity.favoriteRecipeIds': recipeId } },
    { new: true }
  );
  return { success: true, isFavorite: true, message: 'Recipe added to favorites' };
}

async function removeFavorite(authUser, recipeId) {
  await ensureValidRecipeId(recipeId, { requireExisting: false });
  const user = await getOrCreateUser(authUser);
  await User.findOneAndUpdate(
    { firebaseUid: user.firebaseUid },
    { $pull: { 'activity.favoriteRecipeIds': recipeId } },
    { new: true }
  );
  return { success: true, isFavorite: false, message: 'Recipe removed from favorites' };
}

async function getFavorites(authUser) {
  const user = await getOrCreateUser(authUser);
  const favoriteIds = (user.activity && user.activity.favoriteRecipeIds) || [];
  if (!favoriteIds.length) return [];
  return Recipe.find({ _id: { $in: favoriteIds } }).lean();
}

module.exports = { addFavorite, removeFavorite, getFavorites };
