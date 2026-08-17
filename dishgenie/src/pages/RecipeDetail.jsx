import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRecipeById } from "../api/mealService";
import { trackActivity } from "../api/userService";
import { setSlot, DAYS, MEAL_TYPES, weekStartParam, mondayOf } from "../api/mealPlanService";
import { useFavorites } from "../context/favoritesContext.js";
import { SAFE_IMG, DIFFICULTY_LABEL, NUTRIENT_KEYS } from "../constants.js";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const videoSectionRef = useRef(null);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planModal, setPlanModal] = useState(false);
  const [planDay, setPlanDay] = useState("monday");
  const [planMeal, setPlanMeal] = useState("dinner");
  const [planMsg, setPlanMsg] = useState("");

  useEffect(() => {
    async function fetchRecipe() {
      try {
        setLoading(true);
        const data = await getRecipeById(id);
        setRecipe(data);
        trackActivity("view", id);
      } catch (err) {
        console.error("Error fetching recipe details:", err);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [id]);

  const scrollToVideo = () => {
    videoSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleAddToPlan = async () => {
    try {
      setPlanMsg("");
      const iso = weekStartParam(mondayOf(new Date()));
      await setSlot(iso, planDay, planMeal, recipe._id);
      setPlanMsg("Added to your meal plan for this week!");
    } catch (err) {
      setPlanMsg(`Failed: ${err.message}`);
    }
  };

  if (loading)
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading recipe...</p>
      </div>
    );
  if (!recipe)
    return (
      <div className="loader-container">
        <p className="error-message">
          Recipe not found. It may have been removed.
        </p>
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
      </div>
    );

  const nutrition = recipe.nutrition || {};
  const hasNutrition = NUTRIENT_KEYS.some(([k]) => nutrition[k] != null);
  const isFav = isFavorite(recipe._id);

  return (
    <div className="meal-detail-container">
      {/* Back button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      {/* Scroll to video button (only if recipe has video) */}
      {recipe.youtube && (
        <button className="watch-video-btn" onClick={scrollToVideo}>
          🎥 Watch Video
        </button>
      )}

      {/* Header */}
      <div className="meal-header">
        <h1>{recipe.name}</h1>
        <img
          src={recipe.thumbnail}
          alt={recipe.name}
          className="meal-detail-img"
          onError={(e) => (e.currentTarget.src = SAFE_IMG)}
        />
      </div>

      {/* Tags / meta */}
      <div className="tags">
        {recipe.category && <span className="tag">{recipe.category}</span>}
        {recipe.area && <span className="tag">{recipe.area}</span>}
        {recipe.isVeg !== undefined && (
          <span className={`tag ${recipe.isVeg ? "veg" : "non-veg"}`}>
            {recipe.isVeg ? "🌱 Veg" : "🍗 Non-Veg"}
          </span>
        )}
        {recipe.cookingTime ? (
          <span className="tag">⏱️ {recipe.cookingTime} min</span>
        ) : null}
        {recipe.difficulty && DIFFICULTY_LABEL[recipe.difficulty] ? (
          <span className="tag">📊 {DIFFICULTY_LABEL[recipe.difficulty]}</span>
        ) : null}
        {recipe.servings ? (
          <span className="tag">🍽️ {recipe.servings} servings</span>
        ) : null}
      </div>

      {/* Action buttons */}
      <div className="detail-actions">
        <button
          className={`action-btn ${isFav ? "btn-delete" : ""}`}
          onClick={() => toggleFavorite(recipe)}
        >
          {isFav ? "💔 Remove from Favorites" : "❤️ Add to Favorites"}
        </button>
        <button className="action-btn" onClick={() => setPlanModal(true)}>
          📅 Add to Meal Plan
        </button>
        <button className="action-btn" onClick={() => navigate(`/assistant?recipe=${recipe._id}`)}>
          🤖 Ask AI about this
        </button>
      </div>

      {/* Nutrition */}
      <div className="section">
        <div className="section-head-row">
          <h2>🥗 Nutrition</h2>
          {nutrition.estimated ? (
            <span className="nutrition-estimated" title="Values are estimated from the ingredient list and may vary.">
              Estimated
            </span>
          ) : null}
        </div>
        {hasNutrition ? (
          <>
            <p className="nutrition-caption">
              Per serving{recipe.servings ? ` (serves ${recipe.servings})` : ""}
            </p>
            <div className="nutrition-grid">
              {NUTRIENT_KEYS.filter(([k]) => nutrition[k] != null).map(([k, label, unit]) => (
                <div className="nutrition-item" key={k}>
                  <span className="nutrition-value">{nutrition[k]}</span>
                  <span className="nutrition-unit">{unit}</span>
                  <span className="nutrition-label">{label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: "#888" }}>
            Nutrition information is not available for this recipe yet.
          </p>
        )}
      </div>

      {/* Ingredients */}
      <div className="section">
        <h2>🥕 Ingredients</h2>
        <ul className="ingredients-list">
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ing, idx) => (
              <li key={idx}>
                ✅ <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))
          ) : (
            <li>No ingredients available.</li>
          )}
        </ul>
      </div>

      {/* Instructions */}
      <div className="section">
        <h2>📌 Instructions</h2>
        <ol className="instructions">
          {Array.isArray(recipe.instructions)
            ? recipe.instructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))
            : <p>No instructions available.</p>}
        </ol>
      </div>

      {/* YouTube video */}
      {recipe.youtube && (
        <div className="video-section" ref={videoSectionRef}>
          <h2>🎥 Watch Tutorial</h2>
          <iframe
            src={`https://www.youtube.com/embed/${recipe.youtube.slice(-11)}`}
            title="Recipe Tutorial"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Add-to-plan modal */}
      {planModal && (
        <div className="modal-overlay" onClick={() => { setPlanModal(false); setPlanMsg(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>📅 Add to meal plan</h3>
            <label className="pref-label">Day</label>
            <select className="pref-input" value={planDay} onChange={(e) => setPlanDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
            <label className="pref-label">Meal</label>
            <select className="pref-input" value={planMeal} onChange={(e) => setPlanMeal(e.target.value)}>
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
            {planMsg && (
              <p className={planMsg.startsWith("Failed") ? "error-message" : "success-message"}>
                {planMsg}
              </p>
            )}
            <div className="modal-actions">
              <button className="back-btn" onClick={() => { setPlanModal(false); setPlanMsg(""); }}>
                Cancel
              </button>
              <button className="action-btn" onClick={handleAddToPlan}>Save Slot</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
