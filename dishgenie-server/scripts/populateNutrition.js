// One-off migration: estimate and store per-serving nutrition for every recipe.
//
//   node scripts/populateNutrition.js
//
// Safe to re-run — it updates existing documents in place by _id and never
// creates new documents.
const dotenv = require('dotenv');
const connectDB = require('../src/db/connectDB');
const Recipe = require('../src/model/recipe.model.js');
const { estimateRecipeNutrition } = require('../src/services/nutritionService.js');

dotenv.config();

(async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const total = await Recipe.countDocuments();
    const before = await Recipe.countDocuments({ nutrition: { $exists: true, $ne: null } });
    console.log(`📊 Recipes: ${total} (${before} already have nutrition)`);

    const recipes = await Recipe.find({}).lean();
    let updated = 0;
    let missing = 0;

    for (const recipe of recipes) {
      const nutrition = estimateRecipeNutrition(recipe);
      if (!nutrition) {
        missing++;
        console.log(`  ⚠️ ${recipe.name}: could not estimate nutrition`);
        continue;
      }
      await Recipe.updateOne(
        { _id: recipe._id },
        {
          $set: {
            nutrition: {
              calories: nutrition.calories,
              protein: nutrition.protein,
              carbohydrates: nutrition.carbohydrates,
              fat: nutrition.fat,
              fiber: nutrition.fiber,
              sugar: nutrition.sugar,
              sodium: nutrition.sodium,
              estimated: nutrition.estimated,
              perServing: nutrition.perServing
            },
            servings: nutrition.servings
          }
        }
      );
      updated++;
    }

    const after = await Recipe.countDocuments({ nutrition: { $exists: true, $ne: null } });
    console.log(`✅ Updated ${updated} recipes, ${missing} skipped`);
    console.log(`📊 Recipes with nutrition now: ${after}/${total}`);
    if (after !== total || updated !== total) {
      console.error('❌ Some recipes are still missing nutrition.');
      process.exitCode = 1;
    } else {
      console.log('🎉 All recipes now have per-serving nutrition.');
    }

    await mongooseDisconnect();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})();

function mongooseDisconnect() {
  return Recipe.db.close();
}
