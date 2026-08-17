import { useEffect } from "react";
import RecipeCard from "../components/RecipeCard";
import { useFavorites } from "../context/favoritesContext.js";

export default function Favorites() {
  const { favorites, loading, reload } = useFavorites();

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading && favorites.length === 0) {
    return (
      <div className="page-container">
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>❤️ Your Favorite Recipes</h2>

      {favorites.length > 0 ? (
        <div className="recipe-grid">
          {favorites.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p style={{ color: "#888", textAlign: "center", marginTop: "2rem" }}>
          No favorites yet 😋
        </p>
      )}
    </div>
  );
}
