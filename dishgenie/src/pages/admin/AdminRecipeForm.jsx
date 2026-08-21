import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getAdminRecipe,
  createAdminRecipe,
  updateAdminRecipe
} from "../../api/adminService";
import { NUTRIENT_KEYS } from "../../constants.js";

const DIFFICULTIES = [
  { value: "", label: "Not specified" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

const emptyNutrition = {
  calories: "",
  protein: "",
  carbohydrates: "",
  fat: "",
  fiber: "",
  sugar: "",
  sodium: "",
  estimated: false,
  perServing: false
};

const emptyForm = {
  name: "",
  slug: "",
  area: "Global",
  category: "",
  isVeg: true,
  tags: "",
  ingredients: [{ name: "", quantity: "" }],
  instructions: [""],
  thumbnail: "",
  youtube: "",
  sourceUrl: "",
  cookingTime: "",
  difficulty: "",
  servings: "",
  nutrition: { ...emptyNutrition }
};

const toForm = (r) => ({
  name: r.name || "",
  slug: r.slug || "",
  area: r.area || "Global",
  category: r.category || "",
  isVeg: r.isVeg !== undefined ? r.isVeg : true,
  tags: Array.isArray(r.tags) ? r.tags.join(", ") : "",
  ingredients:
    r.ingredients && r.ingredients.length
      ? r.ingredients.map((i) => ({ name: i.name || "", quantity: i.quantity || "" }))
      : [{ name: "", quantity: "" }],
  instructions:
    r.instructions && r.instructions.length
      ? r.instructions.map((s) => s || "")
      : [""],
  thumbnail: r.thumbnail || "",
  youtube: r.youtube || "",
  sourceUrl: r.sourceUrl || "",
  cookingTime: r.cookingTime ?? "",
  difficulty: r.difficulty || "",
  servings: r.servings ?? "",
  nutrition: {
    calories: r.nutrition?.calories ?? "",
    protein: r.nutrition?.protein ?? "",
    carbohydrates: r.nutrition?.carbohydrates ?? "",
    fat: r.nutrition?.fat ?? "",
    fiber: r.nutrition?.fiber ?? "",
    sugar: r.nutrition?.sugar ?? "",
    sodium: r.nutrition?.sodium ?? "",
    estimated: Boolean(r.nutrition?.estimated),
    perServing: Boolean(r.nutrition?.perServing)
  }
});

export default function AdminRecipeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const recipe = await getAdminRecipe(id);
        setForm(toForm(recipe));
      } catch (err) {
        setError(err.message || "Failed to load recipe");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setNutrition = (key, value) => {
    setForm((f) => ({ ...f, nutrition: { ...f.nutrition, [key]: value } }));
  };

  const updateIngredient = (index, key, value) => {
    setForm((f) => {
      const ingredients = f.ingredients.map((ing, i) =>
        i === index ? { ...ing, [key]: value } : ing
      );
      return { ...f, ingredients };
    });
  };

  const addIngredient = () => {
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, { name: "", quantity: "" }]
    }));
  };

  const removeIngredient = (index) => {
    setForm((f) => {
      const ingredients = f.ingredients.filter((_, i) => i !== index);
      return { ...f, ingredients: ingredients.length ? ingredients : [{ name: "", quantity: "" }] };
    });
  };

  const updateInstruction = (index, value) => {
    setForm((f) => {
      const instructions = f.instructions.map((s, i) => (i === index ? value : s));
      return { ...f, instructions };
    });
  };

  const addInstruction = () => {
    setForm((f) => ({ ...f, instructions: [...f.instructions, ""] }));
  };

  const removeInstruction = (index) => {
    setForm((f) => {
      const instructions = f.instructions.filter((_, i) => i !== index);
      return { ...f, instructions: instructions.length ? instructions : [""] };
    });
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Recipe name is required";
    const hasIngredient = form.ingredients.some((i) => i.name.trim());
    if (!hasIngredient) errors.ingredients = "Add at least one ingredient with a name";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const nutrition = {};
    for (const [key] of NUTRIENT_KEYS) {
      const v = form.nutrition[key];
      if (v !== undefined && v !== null && v !== "") nutrition[key] = Number(v);
    }
    if (form.nutrition.estimated) nutrition.estimated = true;
    if (form.nutrition.perServing) nutrition.perServing = true;

    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      area: form.area.trim() || "Global",
      category: form.category.trim(),
      isVeg: form.isVeg,
      tags: form.tags,
      ingredients: form.ingredients
        .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() }))
        .filter((i) => i.name),
      instructions: form.instructions.map((s) => s.trim()).filter(Boolean),
      thumbnail: form.thumbnail.trim(),
      youtube: form.youtube.trim(),
      sourceUrl: form.sourceUrl.trim(),
      cookingTime: form.cookingTime === "" ? "" : Number(form.cookingTime),
      servings: form.servings === "" ? "" : Number(form.servings),
      difficulty: form.difficulty,
      nutrition
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    const payload = buildPayload();
    try {
      setSaving(true);
      if (isEdit) {
        await updateAdminRecipe(id, payload);
        navigate("/admin/recipes", {
          state: { notice: "Recipe updated successfully." }
        });
      } else {
        await createAdminRecipe(payload);
        navigate("/admin/recipes", {
          state: { notice: "Recipe created successfully." }
        });
      }
    } catch (err) {
      setError(err.message || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container admin-page">
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container admin-page admin-form-page">
      <div className="admin-head-row">
        <div>
          <h2>{isEdit ? "✏️ Edit Recipe" : "➕ Add Recipe"}</h2>
          <p className="page-subtitle">
            {isEdit
              ? "Update the recipe details below."
              : "Create a new recipe for the DishGenie database."}
          </p>
        </div>
        <Link to="/admin/recipes" className="back-btn">
          ⬅ Back to recipes
        </Link>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* Basic info */}
        <div className="admin-form-section">
          <h3>Basic Info</h3>

          <label className="pref-label">Recipe name *</label>
          <input
            className="pref-input"
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Chicken Curry"
          />
          {fieldErrors.name && (
            <p className="admin-field-error">{fieldErrors.name}</p>
          )}

          <label className="pref-label">Slug</label>
          <input
            className="pref-input"
            type="text"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder={
              isEdit ? "Leave blank to keep the current slug" : "Auto-generated from name"
            }
          />
          <p className="admin-hint">
            {isEdit
              ? "Leaving this blank preserves the existing slug."
              : "If left blank, a slug is generated automatically from the name."}
          </p>

          <div className="admin-form-grid">
            <div>
              <label className="pref-label">Area / Cuisine</label>
              <input
                className="pref-input"
                type="text"
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
                placeholder="e.g. Indian"
              />
            </div>
            <div>
              <label className="pref-label">Category</label>
              <input
                className="pref-input"
                type="text"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Dinner"
              />
            </div>
            <div>
              <label className="pref-label">Difficulty</label>
              <select
                className="pref-input"
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pref-label">Cooking time (minutes)</label>
              <input
                className="pref-input"
                type="number"
                min="0"
                value={form.cookingTime}
                onChange={(e) => set("cookingTime", e.target.value)}
                placeholder="e.g. 45"
              />
            </div>
            <div>
              <label className="pref-label">Servings</label>
              <input
                className="pref-input"
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) => set("servings", e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
            <div>
              <label className="pref-label">Diet</label>
              <select
                className="pref-input"
                value={form.isVeg ? "veg" : "nonveg"}
                onChange={(e) => set("isVeg", e.target.value === "veg")}
              >
                <option value="veg">🌱 Vegetarian</option>
                <option value="nonveg">🍗 Non-Vegetarian</option>
              </select>
            </div>
          </div>

          <label className="pref-label">Tags</label>
          <input
            className="pref-input"
            type="text"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="Comma separated, e.g. spicy, quick, dinner"
          />
        </div>

        {/* Ingredients */}
        <div className="admin-form-section">
          <h3>🥕 Ingredients *</h3>
          {fieldErrors.ingredients && (
            <p className="admin-field-error">{fieldErrors.ingredients}</p>
          )}
          {form.ingredients.map((ing, index) => (
            <div className="admin-ing-row" key={index}>
              <input
                className="pref-input"
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(index, "name", e.target.value)}
                placeholder={`Ingredient ${index + 1} name`}
              />
              <input
                className="pref-input"
                type="text"
                value={ing.quantity}
                onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                placeholder="Quantity (e.g. 500g, 2)"
              />
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => removeIngredient(index)}
                title="Remove ingredient"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="admin-add-btn" onClick={addIngredient}>
            ➕ Add ingredient
          </button>
        </div>

        {/* Instructions */}
        <div className="admin-form-section">
          <h3>📌 Instructions</h3>
          {form.instructions.map((step, index) => (
            <div className="admin-instr-row" key={index}>
              <textarea
                className="pref-input"
                rows="2"
                value={step}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder={`Step ${index + 1}: describe the step`}
              />
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => removeInstruction(index)}
                title="Remove step"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="admin-add-btn" onClick={addInstruction}>
            ➕ Add step
          </button>
        </div>

        {/* Media */}
        <div className="admin-form-section">
          <h3>🖼 Media & Links</h3>
          <label className="pref-label">Thumbnail URL</label>
          <input
            className="pref-input"
            type="url"
            value={form.thumbnail}
            onChange={(e) => set("thumbnail", e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          {form.thumbnail && (
            <div className="admin-thumb-preview">
              <img src={form.thumbnail} alt="Thumbnail preview" />
            </div>
          )}

          <label className="pref-label">YouTube URL</label>
          <input
            className="pref-input"
            type="url"
            value={form.youtube}
            onChange={(e) => set("youtube", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />

          <label className="pref-label">Source URL</label>
          <input
            className="pref-input"
            type="url"
            value={form.sourceUrl}
            onChange={(e) => set("sourceUrl", e.target.value)}
            placeholder="https://example.com/original-recipe"
          />
        </div>

        {/* Nutrition */}
        <div className="admin-form-section">
          <div className="section-head-row">
            <h3>🥗 Nutrition (per serving)</h3>
            <span className="admin-hint">All fields optional</span>
          </div>

          <div className="admin-form-grid admin-nutrition-grid">
            {NUTRIENT_KEYS.map(([key, label, unit]) => (
              <div key={key}>
                <label className="pref-label">
                  {label} ({unit})
                </label>
                <input
                  className="pref-input"
                  type="number"
                  min="0"
                  step="any"
                  value={form.nutrition[key]}
                  onChange={(e) => setNutrition(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="admin-nutrition-flags">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.nutrition.estimated}
                onChange={(e) => setNutrition("estimated", e.target.checked)}
              />
              Estimated nutrition (computed / approximate values)
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.nutrition.perServing}
                onChange={(e) => setNutrition("perServing", e.target.checked)}
              />
              Values are per serving
            </label>
          </div>
          <p className="admin-hint">
            Leave “Estimated” unchecked to mark these as verified values. Never
            mark estimated data as verified.
          </p>
        </div>

        <div className="admin-form-actions">
          <Link to="/admin/recipes" className="back-btn">
            Cancel
          </Link>
          <button className="save-btn" style={{ width: "auto" }} disabled={saving}>
            {saving
              ? "Saving..."
              : isEdit
              ? "💾 Save changes"
              : "✅ Create recipe"}
          </button>
        </div>
      </form>
    </div>
  );
}
