import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RecipeCard from "../components/RecipeCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useFavorites } from "../context/favoritesContext.js";
import {
  getRecipesByIngredient,
  getRandomMeals,
} from "../api/mealService.js";
import { getRecommendations } from "../api/recommendationService.js";
import { SAFE_IMG } from "../constants.js";

const QUICK_GOALS = [
  { label: "High Protein", icon: "💪", filter: "high-protein", mealType: "all" },
  { label: "Low Calorie", icon: "🔥", filter: "low-calorie", mealType: "all" },
  { label: "Vegetarian", icon: "🥗", filter: "", mealType: "veg" },
  { label: "Quick Meals", icon: "⚡", filter: "", mealType: "all" },
  { label: "Healthy", icon: "🥑", filter: "high-fiber", mealType: "all" },
];

const EXPLORE_GOALS = [
  { icon: "💪", label: "High Protein", desc: "Build protein-rich meals", filter: "high-protein" },
  { icon: "🔥", label: "Low Calorie", desc: "Light & healthy meals", filter: "low-calorie" },
  { icon: "🥗", label: "Vegetarian", desc: "Fresh vegetarian recipes", filter: "" },
  { icon: "⚡", label: "Quick Meals", desc: "Ready in 30 minutes", filter: "" },
];

export default function Home() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [searchInput, setSearchInput] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mealType, setMealType] = useState("all");
  const [nutrition, setNutrition] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const searchSeq = useRef(0);

  const [featured, setFeatured] = useState(null);
  const [dailyPicks, setDailyPicks] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [homeLoading, setHomeLoading] = useState(true);

  const vegFlag = useMemo(
    () =>
      mealType === "veg" ? true : mealType === "nonveg" ? false : undefined,
    [mealType]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setHomeLoading(true);
        const [randomFull, recs] = await Promise.all([
          getRandomMeals({ count: 9 }),
          getRecommendations({ limit: 6 }).catch(() => []),
        ]);

        if (!alive) return;

        const items = (randomFull || []).filter((r) => r && r._id && r.name);
        if (items.length > 0) {
          setFeatured(items[0]);
          setDailyPicks(items.slice(1, 5));
          setPopular(items.slice(5));
        }

        const recItems = (recs || [])
          .map((r) => r.recipe)
          .filter((r) => r && r._id && r.name);
        setRecommendations(recItems.slice(0, 6));
      } catch (err) {
        console.error("Home load error:", err);
      } finally {
        if (alive) setHomeLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const applyFilters = useCallback(
    async (ingredients, veg, nutritionFilter) => {
      const seq = ++searchSeq.current;
      setLoading(true);
      setError("");
      setRecipes([]);

      try {
        let result = [];
        if (ingredients.trim()) {
          result = await getRecipesByIngredient(ingredients, {
            veg,
            nutrition: nutritionFilter,
          });
        }

        if (seq !== searchSeq.current) return;
        setRecipes((result || []).filter((r) => r && r._id && r.name));
      } catch (err) {
        if (seq !== searchSeq.current) return;
        console.error(err);
        setError("Something went wrong while fetching recipes.");
      } finally {
        if (seq === searchSeq.current) setLoading(false);
      }
    },
    []
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    setLastSearch(q);
    if (q) applyFilters(q, vegFlag, nutrition);
    else {
      setRecipes([]);
      setError("");
    }
  };

  const handleQuickGoal = (goal) => {
    if (goal.mealType === "veg") {
      setMealType("veg");
      setNutrition("");
      setLastSearch("");
      setRecipes([]);
      applyFilters(searchInput.trim(), true, "");
    } else {
      setMealType("all");
      setNutrition(goal.filter);
      if (searchInput.trim()) {
        setLastSearch(searchInput.trim());
        applyFilters(searchInput.trim(), undefined, goal.filter);
      }
    }
  };

  const handleGoalCard = (goal) => {
    if (goal.label === "Vegetarian") {
      setMealType((prev) => (prev === "veg" ? "all" : "veg"));
      setNutrition("");
    } else if (goal.label === "Quick Meals") {
      setMealType("all");
      setNutrition("");
    } else {
      setNutrition((prev) => (prev === goal.filter ? "" : goal.filter));
      setMealType("all");
    }
    if (searchInput.trim()) {
      setLastSearch(searchInput.trim());
      applyFilters(
        searchInput.trim(),
        goal.label === "Vegetarian" ? true : undefined,
        goal.filter || ""
      );
    }
  };

  useEffect(() => {
    if (lastSearch) {
      applyFilters(lastSearch, vegFlag, nutrition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealType, nutrition]);

  const showSearch = lastSearch || loading || recipes.length > 0;
  const showResults = !loading && recipes.length > 0 && !error && lastSearch;
  const showEmpty = !loading && recipes.length === 0 && !error && !!lastSearch;

  return (
    <div className="page-container">
      {/* ============ HERO SECTION ============ */}
      <section className="hero">
        <div className="hero-badge">🍽️ What&apos;s cooking today?</div>
        <h1>
          Discover delicious recipes<br />
          from the <span className="accent">ingredients</span> you have
        </h1>
        <p className="hero-sub">
          Search by what&apos;s in your kitchen, pick a nutrition goal, and get
          recipes tailored to you.
        </p>

        <form className="hero-search" onSubmit={handleSearch}>
          <span className="hero-search-icon">🔍</span>
          <input
            type="text"
            placeholder="e.g. paneer, tomato, onion..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className="hero-clear"
              onClick={() => {
                setSearchInput("");
                setLastSearch("");
                setRecipes([]);
              }}
            >
              ✕
            </button>
          )}
          <button type="submit" className="hero-search-btn">
            Search
          </button>
        </form>

        <div className="quick-goals">
          {QUICK_GOALS.map((g) => (
            <button
              key={g.label}
              className={`quick-goal${
                (g.mealType === "veg" && mealType === "veg") ||
                (g.filter && nutrition === g.filter)
                  ? " active"
                  : ""
              }`}
              onClick={() => handleQuickGoal(g)}
            >
              {g.icon} {g.label}
            </button>
          ))}
        </div>
      </section>

      {showSearch && (
        <>
          {lastSearch && (
            <div className="section-header animate-in" style={{ marginTop: "1rem" }}>
              <div>
                <h2 className="section-title">
                  Results for &ldquo;{lastSearch}&rdquo;
                </h2>
                <span className="section-subtitle">
                  {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} found
                  {mealType !== "all" ? ` · ${mealType}` : ""}
                  {nutrition ? ` · ${nutrition.replace("-", " ")}` : ""}
                </span>
              </div>
            </div>
          )}

          {loading && (
            <div className="recipe-grid animate-in">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {showEmpty && (
            <p
              className="error-message"
              style={{ textAlign: "center", marginBottom: "2rem" }}
            >
              No recipes found. Try different ingredients or filters.
            </p>
          )}

          {showResults && (
            <div className="recipe-grid animate-in">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe._id} recipe={recipe} />
              ))}
            </div>
          )}

          {lastSearch && <div style={{ marginTop: "2.5rem" }} />}
        </>
      )}

      {!showSearch && !homeLoading && (featured || dailyPicks.length > 0) && (
        <section className="featured-section animate-in-delay-1">
          <div className="featured-grid">
            {featured && (
              <div
                className="featured-card"
                onClick={() => navigate(`/recipe/${featured._id}`)}
              >
                <div className="featured-image-wrap">
                  <img
                    src={featured.thumbnail || SAFE_IMG}
                    alt={featured.name}
                    onError={(e) => (e.currentTarget.src = SAFE_IMG)}
                    loading="lazy"
                  />
                  <span className="featured-tag">✨ Featured Recipe</span>
                  <button
                    className={`featured-fav-btn${
                      isFavorite(featured._id) ? " is-fav" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(featured);
                    }}
                    aria-label="Toggle favorite"
                  >
                    {isFavorite(featured._id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="featured-body">
                  <div className="featured-name">{featured.name}</div>
                  <div className="featured-meta">
                    {featured.rating != null && (
                      <span className="featured-rating">
                        ⭐ {featured.rating}
                      </span>
                    )}
                    {featured.cookingTime && (
                      <span className="featured-time">
                        ⏱ {featured.cookingTime} min
                      </span>
                    )}
                    {featured.isVeg !== undefined && (
                      <span
                        className={`featured-time`}
                        style={{
                          color: featured.isVeg
                            ? "var(--green)"
                            : "var(--red)",
                          fontWeight: 600,
                        }}
                      >
                        {featured.isVeg ? "🌱 Veg" : "🍗 Non-Veg"}
                      </span>
                    )}
                  </div>
                  <div className="featured-nutrition">
                    {featured.nutrition?.calories != null && (
                      <span className="nutrition-pill">
                        🔥{" "}
                        <span className="val">
                          {featured.nutrition.calories}
                        </span>{" "}
                        kcal
                      </span>
                    )}
                    {featured.nutrition?.protein != null && (
                      <span className="nutrition-pill">
                        💪{" "}
                        <span className="val">
                          {featured.nutrition.protein}g
                        </span>{" "}
                        protein
                      </span>
                    )}
                    {featured.nutrition?.carbohydrates != null && (
                      <span className="nutrition-pill">
                        🥑{" "}
                        <span className="val">
                          {featured.nutrition.carbohydrates}g
                        </span>{" "}
                        carbs
                      </span>
                    )}
                    {featured.nutrition?.fat != null && (
                      <span className="nutrition-pill">
                        🥜{" "}
                        <span className="val">
                          {featured.nutrition.fat}g
                        </span>{" "}
                        fat
                      </span>
                    )}
                  </div>
                  <button className="featured-cta">
                    View Recipe →
                  </button>
                </div>
              </div>
            )}

            {dailyPicks.length > 0 && (
              <div>
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Your Daily Picks</h2>
                    <span className="section-subtitle">
                      Freshly curated for you
                    </span>
                  </div>
                </div>
                <div className="daily-picks-list">
                  {dailyPicks.map((r) => (
                    <div
                      className="daily-pick-card"
                      key={r._id}
                      onClick={() => navigate(`/recipe/${r._id}`)}
                    >
                      <img
                        className="daily-pick-img"
                        src={r.thumbnail || SAFE_IMG}
                        alt={r.name}
                        onError={(e) => (e.currentTarget.src = SAFE_IMG)}
                        loading="lazy"
                      />
                      <div className="daily-pick-info">
                        <div className="daily-pick-name">{r.name}</div>
                        <div className="daily-pick-meta">
                          {r.nutrition?.calories != null && (
                            <span>🔥 {r.nutrition.calories} kcal</span>
                          )}
                          {r.nutrition?.protein != null && (
                            <span>💪 {r.nutrition.protein}g protein</span>
                          )}
                          {r.cookingTime && <span>⏱ {r.cookingTime} min</span>}
                        </div>
                      </div>
                      <div className="daily-pick-actions">
                        <button
                          className={`pick-fav-btn${
                            isFavorite(r._id) ? " is-fav" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(r);
                          }}
                          aria-label="Toggle favorite"
                        >
                          {isFavorite(r._id) ? "♥" : "♡"}
                        </button>
                        <button
                          className="pick-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/recipe/${r._id}`);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {!showSearch && homeLoading && (
        <div className="recipe-grid animate-in" style={{ marginTop: "1.5rem" }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!showSearch && !homeLoading && popular.length > 0 && (
        <section className="goals-section animate-in-delay-2">
          <div className="section-header">
            <div>
              <h2 className="section-title">Explore by Goal</h2>
              <span className="section-subtitle">
                Find recipes that match your lifestyle
              </span>
            </div>
          </div>
          <div className="goals-grid">
            {EXPLORE_GOALS.map((g) => (
              <div
                className="goal-card"
                key={g.label}
                onClick={() => handleGoalCard(g)}
              >
                <span className="goal-icon">{g.icon}</span>
                <div className="goal-label">{g.label}</div>
                <div className="goal-desc">{g.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!showSearch && !homeLoading && (
        <section className="ai-cta-section animate-in-delay-3">
          <div className="ai-cta-card">
            <div className="ai-cta-text">
              <h3>✨ Can&apos;t decide what to cook?</h3>
              <p>
                Tell AI Chef what you have and get personalized suggestions in
                seconds.
              </p>
            </div>
            <button
              className="ai-cta-btn"
              onClick={() => navigate("/assistant")}
            >
              Ask AI Chef →
            </button>
          </div>
        </section>
      )}

      {!showSearch && !homeLoading && recommendations.length > 0 && (
        <section className="personalized-section animate-in-delay-4">
          <div className="section-header">
            <div>
              <h2 className="section-title">✨ Made for You</h2>
              <span className="section-subtitle">
                Based on your preferences and nutrition goals
              </span>
            </div>
            <span className="personalized-badge">Personalized</span>
          </div>
          <div className="recipe-grid">
            {recommendations.map((r) => (
              <RecipeCard key={r._id} recipe={r} />
            ))}
          </div>
        </section>
      )}

      {!showSearch && !homeLoading && popular.length > 0 && (
        <section
          className="personalized-section animate-in-delay-4"
          style={{ marginTop: "2.5rem" }}
        >
          <div className="section-header">
            <div>
              <h2 className="section-title">Popular Recipes</h2>
              <span className="section-subtitle">
                Trending in the community
              </span>
            </div>
          </div>
          <div className="recipe-grid">
            {popular.map((r) => (
              <RecipeCard key={r._id} recipe={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
