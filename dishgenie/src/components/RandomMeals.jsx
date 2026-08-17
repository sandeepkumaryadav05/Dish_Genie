import { useCallback, useEffect, useState } from "react";
import RecipeCard from "./RecipeCard";
import SkeletonCard from "./SkeletonCard";
import { getRandomMeals } from "../api/mealService";

export default function RandomMeals({ mealType = "all" }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRandom = useCallback(async () => {
    try {
      setLoading(true);

      const veg =
        mealType === "veg"
          ? true
          : mealType === "nonveg"
          ? false
          : undefined;

      const items = await getRandomMeals({ count: 8, veg });
      setRecipes(items || []);
    } catch (err) {
      console.error("Error fetching random recipes:", err);
    } finally {
      setLoading(false);
    }
  }, [mealType]);

  useEffect(() => {
    fetchRandom();
  }, [fetchRandom]);

  return (
    <div className="random-meals-section">
      <h2 className="section-title">
        {mealType === "veg"
          ? "🌱 Discover Veg Delights"
          : mealType === "nonveg"
          ? "🍗 Explore Non-Veg Specials"
          : "🍽️ Discover Something New!"}
      </h2>

      {loading ? (
        <div className="recipe-grid">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : recipes.length ? (
        <>
          <div className="recipe-grid">
            {recipes.map((r) => (
              <RecipeCard key={r._id} recipe={r} />
            ))}
          </div>

          <button className="shuffle-btn" onClick={fetchRandom}>
            🔁 Shuffle Recipes
          </button>
        </>
      ) : (
        <p style={{ color: "#e63946", marginTop: "1rem" }}>
          No recipes found. Try again!
        </p>
      )}
    </div>
  );
}
