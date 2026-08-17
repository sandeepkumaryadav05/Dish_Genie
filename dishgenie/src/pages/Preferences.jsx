import { useEffect, useState } from "react";
import { getPreferences, updatePreferences } from "../api/userService";

const DIET_OPTIONS = [
  { value: "any", label: "No preference" },
  { value: "vegetarian", label: "🌱 Vegetarian" },
  { value: "vegan", label: "🌿 Vegan" }
];

const DIFFICULTY_OPTIONS = ["any", "easy", "medium", "hard"];

const NUTRITION_GOALS = [
  { value: "balanced", label: "Balanced" },
  { value: "high-protein", label: "High Protein" },
  { value: "low-calorie", label: "Low Calorie" },
  { value: "low-carb", label: "Low Carb" },
  { value: "high-fiber", label: "High Fiber" }
];

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" }
];

const CUISINE_SUGGESTIONS = [
  "Indian", "Italian", "Chinese", "Mexican", "Japanese",
  "Thai", "American", "French", "Mediterranean", "Greek"
];

const DEFAULT_PREFS = {
  diet: "any",
  favoriteCuisines: [],
  favoriteIngredients: [],
  dislikedIngredients: [],
  mealTypes: [],
  maxCookingTime: 60,
  difficulty: "any",
  nutritionGoal: "balanced",
  favoriteCuisinesRaw: "",
  favoriteIngredientsRaw: "",
  dislikedIngredientsRaw: ""
};

const toList = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

const toText = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

export default function Preferences() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getPreferences();
        const p = { ...DEFAULT_PREFS, ...data.preferences };
        setPrefs({
          ...p,
          favoriteCuisinesRaw: toText(p.favoriteCuisines),
          favoriteIngredientsRaw: toText(p.favoriteIngredients),
          dislikedIngredientsRaw: toText(p.dislikedIngredients)
        });
      } catch (err) {
        setError(err.message || "Failed to load preferences");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSavedMsg("");
  };

  const toggleMealType = (value) => {
    set("mealTypes", prefs.mealTypes.includes(value)
      ? prefs.mealTypes.filter((m) => m !== value)
      : [...prefs.mealTypes, value]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSavedMsg("");
      const payload = {
        diet: prefs.diet,
        favoriteCuisines: toList(prefs.favoriteCuisinesRaw),
        favoriteIngredients: toList(prefs.favoriteIngredientsRaw),
        dislikedIngredients: toList(prefs.dislikedIngredientsRaw),
        mealTypes: prefs.mealTypes,
        maxCookingTime: parseInt(prefs.maxCookingTime, 10) || 60,
        difficulty: prefs.difficulty,
        nutritionGoal: prefs.nutritionGoal
      };
      const data = await updatePreferences(payload);
      setPrefs((p) => ({
        ...p,
        ...data.preferences,
        favoriteCuisinesRaw: toText(data.preferences.favoriteCuisines),
        favoriteIngredientsRaw: toText(data.preferences.favoriteIngredients),
        dislikedIngredientsRaw: toText(data.preferences.dislikedIngredients)
      }));
      setSavedMsg("Preferences saved! Your recommendations will update.");
    } catch (err) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading preferences...</p>
      </div>
    );

  return (
    <div className="page-container">
      <h2>⚙️ Your Preferences</h2>
      <p className="page-subtitle">
        Tell DishGenie what you love — recommendations and your weekly plan adapt to this.
      </p>

      <div className="pref-card">
        <label className="pref-label">Diet</label>
        <div className="chip-row">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`chip ${prefs.diet === opt.value ? "active" : ""}`}
              onClick={() => set("diet", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="pref-label">Favorite cuisines</label>
        <input
          className="pref-input"
          type="text"
          placeholder="e.g. Indian, Italian"
          value={prefs.favoriteCuisinesRaw}
          onChange={(e) => set("favoriteCuisinesRaw", e.target.value)}
        />
        <div className="chip-row">
          {CUISINE_SUGGESTIONS.map((c) => (
            <button
              key={c}
              className="chip"
              onClick={() => {
                const current = toList(prefs.favoriteCuisinesRaw);
                const next = current.includes(c.toLowerCase())
                  ? current.filter((x) => x !== c.toLowerCase())
                  : [...current, c.toLowerCase()];
                set("favoriteCuisinesRaw", next.join(", "));
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="pref-label">Ingredients you love</label>
        <input
          className="pref-input"
          type="text"
          placeholder="e.g. paneer, mushroom, cheese (comma separated)"
          value={prefs.favoriteIngredientsRaw}
          onChange={(e) => set("favoriteIngredientsRaw", e.target.value)}
        />

        <label className="pref-label">Ingredients you avoid</label>
        <input
          className="pref-input"
          type="text"
          placeholder="e.g. onion, garlic (comma separated)"
          value={prefs.dislikedIngredientsRaw}
          onChange={(e) => set("dislikedIngredientsRaw", e.target.value)}
        />

        <label className="pref-label">Meal types</label>
        <div className="chip-row">
          {MEAL_TYPES.map((m) => (
            <button
              key={m.value}
              className={`chip ${prefs.mealTypes.includes(m.value) ? "active" : ""}`}
              onClick={() => toggleMealType(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="pref-label">
          Max cooking time: {prefs.maxCookingTime || 60} min
        </label>
        <input
          className="pref-input"
          type="range"
          min="10"
          max="180"
          step="5"
          value={prefs.maxCookingTime || 60}
          onChange={(e) => set("maxCookingTime", Number(e.target.value))}
        />

        <label className="pref-label">Cooking difficulty</label>
        <div className="chip-row">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              className={`chip ${prefs.difficulty === d ? "active" : ""}`}
              onClick={() => set("difficulty", d)}
            >
              {d === "any" ? "Any" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        <label className="pref-label">Nutrition goal</label>
        <div className="chip-row">
          {NUTRITION_GOALS.map((g) => (
            <button
              key={g.value}
              className={`chip ${prefs.nutritionGoal === g.value ? "active" : ""}`}
              onClick={() => set("nutritionGoal", g.value)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "💾 Save Preferences"}
        </button>

        {savedMsg && <p className="success-message">{savedMsg}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
