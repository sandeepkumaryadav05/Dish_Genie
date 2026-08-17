import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DAYS,
  MEAL_TYPES,
  getWeekPlan,
  setSlot,
  clearSlot,
  mondayOf,
  weekStartParam
} from "../api/mealPlanService";
import { fetchByIngredient } from "../api/mealService";

const DAY_LABELS = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun"
};

const MEAL_LABELS = { breakfast: "🌅", lunch: "🌞", dinner: "🌙", snack: "🍿" };

export default function MealPlanner() {
  const navigate = useNavigate();
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(null); // { day, mealType }
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const iso = weekStartParam(week);

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getWeekPlan(iso);
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message || "Failed to load meal plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  const shiftWeek = (delta) => {
    const next = new Date(week);
    next.setDate(next.getDate() + delta * 7);
    setWeek(mondayOf(next));
    setPicker(null);
  };

  const slotFor = (day, mealType) =>
    slots.find((s) => s.day === day && s.mealType === mealType);

  const handleAssign = async (recipe) => {
    try {
      await setSlot(iso, picker.day, picker.mealType, recipe._id);
      await loadPlan();
      setPicker(null);
    } catch (err) {
      setError(err.message || "Failed to save slot");
    }
  };

  const handleClear = async (day, mealType) => {
    try {
      await clearSlot(iso, day, mealType);
      await loadPlan();
    } catch (err) {
      setError(err.message || "Failed to clear slot");
    }
  };

  const openPicker = (day, mealType) => {
    setPicker({ day, mealType });
    setQuery("");
    setResults([]);
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    try {
      setSearching(true);
      setResults(await fetchByIngredient(q, { limit: 20 }));
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const label = week.toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric"
  });

  return (
    <div className="page-container">
      <h2>📅 Weekly Meal Planner</h2>
      <p className="page-subtitle">
        Plan your week — every slot saves to your account and reappears here.
      </p>

      <div className="week-nav">
        <button className="week-nav-btn" onClick={() => shiftWeek(-1)}>⬅ Prev</button>
        <span className="week-label">Week of {label}</span>
        <button className="week-nav-btn" onClick={() => shiftWeek(1)}>Next ➡</button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading plan...</p>
        </div>
      )}

      {!loading && (
        <div className="plan-table">
          <div className="plan-row plan-head">
            <span className="plan-meal-col">Meal</span>
            {DAYS.map((d) => (
              <span key={d} className="plan-day-col">{DAY_LABELS[d]}</span>
            ))}
          </div>

          {MEAL_TYPES.map((mt) => (
            <div className="plan-row" key={mt}>
              <span className="plan-meal-col">
                {MEAL_LABELS[mt]} {mt}
              </span>
              {DAYS.map((day) => {
                const slot = slotFor(day, mt);
                return (
                  <span className="plan-day-col" key={day}>
                    {slot ? (
                      <div className="plan-slot">
                        <button
                          className="plan-slot-name"
                          onClick={() => navigate(`/recipe/${slot.recipe._id}`)}
                          title={slot.recipe.name}
                        >
                          {slot.recipe.name}
                        </button>
                        <button
                          className="plan-slot-remove"
                          onClick={() => handleClear(day, mt)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button className="plan-add" onClick={() => openPicker(day, mt)}>
                        ＋
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {picker && (
        <div className="modal-overlay" onClick={() => setPicker(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {DAY_LABELS[picker.day]}, {picker.mealType}
            </h3>
            <div className="picker-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search recipes by ingredient..."
                autoFocus
              />
              <button onClick={runSearch} disabled={searching}>
                {searching ? "..." : "Search"}
              </button>
            </div>
            <div className="picker-results">
              {results.length === 0 && !searching && (
                <p className="picker-empty">Type an ingredient and press Search.</p>
              )}
              {results.map((r) => (
                <div className="picker-result" key={r._id}>
                  <span>{r.name}</span>
                  <button onClick={() => handleAssign(r)}>Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
