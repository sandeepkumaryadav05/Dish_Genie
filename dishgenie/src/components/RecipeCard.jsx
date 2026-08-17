import { useNavigate } from "react-router-dom";
import { useFavorites } from "../context/favoritesContext.js";
import { SAFE_IMG } from "../constants.js";

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isValidRecipe = recipe && typeof recipe === "object" && recipe._id;

  if (!isValidRecipe) return null;

  const isFav = isFavorite(recipe._id);
  const handleToggle = (e) => {
    e.stopPropagation();
    toggleFavorite(recipe);
  };

  const n = recipe.nutrition || {};

  return (
    <div className="recipe-card">
      <div
        className="recipe-card-image"
        onClick={() => navigate(`/recipe/${recipe._id}`)}
      >
        <img
          src={recipe.thumbnail || SAFE_IMG}
          alt={recipe.name || "Recipe"}
          onError={(e) => (e.currentTarget.src = SAFE_IMG)}
          loading="lazy"
        />
        {recipe.isVeg !== undefined && (
          <span
            className={`recipe-card-tag${recipe.isVeg ? "" : " non-veg"}`}
          >
            {recipe.isVeg ? "🌱 Vegetarian" : "🍗 Non-Veg"}
          </span>
        )}
        <button
          className={`recipe-card-fav${isFav ? " is-fav" : ""}`}
          onClick={handleToggle}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          {isFav ? "♥" : "♡"}
        </button>
      </div>

      <div className="recipe-card-body">
        <div
          className="recipe-card-title"
          onClick={() => navigate(`/recipe/${recipe._id}`)}
          style={{ cursor: "pointer" }}
        >
          {recipe.name || "Untitled recipe"}
        </div>

        {recipe.rating != null && (
          <div className="recipe-card-rating">⭐ {recipe.rating}</div>
        )}

        <div className="recipe-card-stats">
          {n.calories != null && (
            <span className="recipe-stat cal">🔥 {n.calories} kcal</span>
          )}
          {n.protein != null && (
            <span className="recipe-stat prot">💪 {n.protein}g protein</span>
          )}
          {recipe.cookingTime && (
            <span className="recipe-stat">⏱ {recipe.cookingTime} min</span>
          )}
        </div>

        <div className="recipe-card-cta">
          <button
            className="view-recipe-btn"
            onClick={() => navigate(`/recipe/${recipe._id}`)}
          >
            View Recipe →
          </button>
        </div>
      </div>
    </div>
  );
}
