const dotenv = require("dotenv");
const connectDB = require("./src/db/connectDB");
const Recipe = require("./src/model/recipe.model.js");
const slugify = require("slugify");
const { estimateRecipeNutrition } = require("./src/services/nutritionService.js");

dotenv.config();

const API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

const nonVegWords = [
  "chicken", "hen", "turkey", "duck", "goose", "quail", "pheasant",
  "beef", "pork", "lamb", "mutton", "goat", "veal",
  "bacon", "ham", "sausage", "salami", "pepperoni", "steak", "meat",
  "fish", "salmon", "tuna", "sardine", "anchovy", "mackerel", "shrimp", "crab",
  "lobster", "egg", "eggs", "yolk", "broth", "stock", "gelatin","prawn"
];

function detectVeg(meal) {
  const name = meal.strMeal.toLowerCase();
  if (nonVegWords.some(w => name.includes(w))) return false;

  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    if (ing && nonVegWords.some(w => ing.toLowerCase().includes(w))) {
      return false;
    }
  }
  return true;
}

async function fetchAllMeals() {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const allMeals = [];

  for (const letter of letters) {
    try {
      const res = await fetch(`${API_URL}${letter}`);
      const data = await res.json();

      if (data.meals) {
        console.log(`✅ Fetched ${data.meals.length} meals for '${letter.toUpperCase()}'`);
        allMeals.push(...data.meals);
      }
    } catch (err) {
      console.log(`❌ Error fetching meals for letter '${letter}':`, err.message);
    }
  }

  return allMeals;
}

(async () => {
  try {
    if (!process.env.SEED_KEY) {
      console.error(
        "SEED_KEY is not set. Add SEED_KEY to your .env file to confirm you want to re-seed the database."
      );
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const meals = await fetchAllMeals();
    console.log(`📦 Total Meals Fetched: ${meals.length}`);

    const formatted = meals.map((m) => {
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = m[`strIngredient${i}`];
        const qty = m[`strMeasure${i}`];
        if (ing && ing.trim()) ingredients.push({ name: ing.trim().toLowerCase(), quantity: qty?.trim() || "" });
      }

      const recipe = {
        name: m.strMeal,
        area: m.strArea || "Global",
        isVeg: detectVeg(m),
        category: m.strCategory || "",
        tags: (m.strTags ? m.strTags.split(",") : []).map((t) => t.trim().toLowerCase()),
        ingredients,
        instructions: m.strInstructions
          ? m.strInstructions.split(/\r?\n/).filter((s) => s.trim() !== "")
          : [],
        thumbnail: m.strMealThumb,
        youtube: m.strYoutube || "",
        sourceUrl: m.strSource || "",
        slug: slugify(m.strMeal, { lower: true, strict: true })
      };

      const nutrition = estimateRecipeNutrition(recipe);
      if (nutrition) {
        recipe.nutrition = {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbohydrates: nutrition.carbohydrates,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          sugar: nutrition.sugar,
          sodium: nutrition.sodium,
          estimated: nutrition.estimated,
          perServing: nutrition.perServing
        };
        recipe.servings = nutrition.servings;
      }

      return recipe;
    });

    // remove duplicates (by name)
    const unique = Array.from(new Map(formatted.map(r => [r.name, r])).values());

    await Recipe.deleteMany({});
    console.log("🗑 Old recipes cleared");

    await Recipe.insertMany(unique);
    console.log(`🌱 Inserted ${unique.length} recipes successfully!`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
})();
