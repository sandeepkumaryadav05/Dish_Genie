// Backfills the `youtube` (and missing `sourceUrl`) fields on existing recipes
// from recipeSeedData.js. Safe and idempotent:
//   - only sets youtube/sourceUrl when the recipe already has NO value,
//   - never overwrites existing values,
//   - never touches other fields or other recipes.
//
// Usage:
//   npm run update:recipe-videos
//   node scripts/updateRecipeVideos.js
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../src/db/connectDB');
const Recipe = require('../src/model/recipe.model.js');
const recipeSeedData = require('./recipeSeedData.js');

(async () => {
  try {
    if (!process.env.SEED_KEY) {
      console.error(
        'SEED_KEY is not set. Add SEED_KEY to your .env file to confirm you want to update recipe videos.'
      );
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URL);

    const slugs = recipeSeedData.map((r) => r.slug);
    const existing = await Recipe.find({ slug: { $in: slugs } }).lean();
    const bySlug = new Map(existing.map((r) => [r.slug, r]));

    let updated = 0;
    let unchanged = 0;

    for (const recipe of recipeSeedData) {
      const doc = bySlug.get(recipe.slug);
      if (!doc) continue;

      const set = {};
      if (recipe.youtube && !doc.youtube) set.youtube = recipe.youtube;
      if (recipe.sourceUrl && !doc.sourceUrl) set.sourceUrl = recipe.sourceUrl;

      if (Object.keys(set).length) {
        await Recipe.updateOne({ _id: doc._id }, { $set: set });
        updated++;
        console.log(`🎬 Updated: ${recipe.name} -> ${set.youtube || set.sourceUrl}`);
      } else {
        unchanged++;
      }
    }

    console.log('Recipe video update completed.');
    console.log(`Updated: ${updated}`);
    console.log(`Unchanged (already set): ${unchanged}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Video update failed:', err);
    process.exit(1);
  }
})();
