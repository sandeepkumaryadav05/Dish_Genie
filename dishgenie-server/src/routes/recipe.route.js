const express = require("express");
const router = express.Router();
const {
  listRecipes,
  getRecipe,
  randomRecipes
} = require("../controllers/recipe.controller");
const { validateRecipeQuery } = require("../middleware/validateHandler");

router.get("/", validateRecipeQuery, listRecipes);
router.get("/random", randomRecipes); // ✅ route for RandomMeals
router.get("/:id", getRecipe);

module.exports = router;

