// Seeds brand-new recipes from recipeSeedData.js into the existing DishGenie
// database. This is a safe, idempotent upsert-style import:
//   - connects to the existing MongoDB database (no new collections),
//   - validates every recipe through the existing Recipe Mongoose model,
//   - skips any recipe whose slug already exists,
//   - inserts only brand-new recipes, and
//   - never deletes, overwrites or resets any existing documents.
//
// Usage:
//   npm run seed:recipes
//   node scripts/seedRecipes.js
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../src/db/connectDB');
const Recipe = require('../src/model/recipe.model.js');
const recipeSeedData = require('./recipeSeedData.js');

(async () => {
  try {
    if (!process.env.SEED_KEY) {
      console.error(
        'SEED_KEY is not set. Add SEED_KEY to your .env file to confirm you want to seed recipes.'
      );
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URL);

    const totalProcessed = recipeSeedData.length;
    const slugs = recipeSeedData.map((r) => r.slug);
    const existing = await Recipe.find({ slug: { $in: slugs } }, 'slug').lean();
    const existingSlugs = new Set(existing.map((r) => r.slug));

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const recipe of recipeSeedData) {
      if (existingSlugs.has(recipe.slug)) {
        skipped++;
        continue;
      }

      try {
        const doc = new Recipe(recipe);
        const validationError = doc.validateSync();
        if (validationError) {
          failed++;
          console.error(`❌ Validation failed for "${recipe.name}":`, validationError.message);
          continue;
        }
        await doc.save();
        inserted++;
        console.log(`🌱 Inserted: ${recipe.name}`);
      } catch (err) {
        failed++;
        console.error(`❌ Failed to insert "${recipe.name}":`, err.message);
      }
    }

    console.log('Recipe seeding completed.');
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped duplicates: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total processed: ${totalProcessed}`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
})();
