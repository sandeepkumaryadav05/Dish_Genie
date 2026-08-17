import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAdminRecipes, deleteAdminRecipe } from "../../api/adminService";
import { SAFE_IMG, DIFFICULTY_LABEL } from "../../constants.js";

const LIMIT = 20;

export default function AdminRecipeList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    area: "",
    category: "",
    isVeg: "",
    difficulty: "",
    hasNutrition: ""
  });

  const [deleting, setDeleting] = useState(null); // recipe being confirmed
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || "");

  // Consume the notice passed from the create/edit form.
  useEffect(() => {
    if (location.state?.notice) {
      window.history.replaceState({}, "");
      window.setTimeout(() => setNotice(""), 4000);
    }
  }, [location.state]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminRecipes({ ...filters, page, limit: LIMIT });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.message || "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      area: "",
      category: "",
      isVeg: "",
      difficulty: "",
      hasNutrition: ""
    });
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      setDeleteBusy(true);
      await deleteAdminRecipe(deleting._id);
      setNotice(`"${deleting.name}" was deleted.`);
      setDeleting(null);
      await load();
      window.setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete recipe");
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="page-container admin-page">
      <div className="admin-head-row">
        <div>
          <h2>📋 Recipe Management</h2>
          <p className="page-subtitle">
            {total} recipe{total === 1 ? "" : "s"} in the DishGenie database
          </p>
        </div>
        <div className="admin-head-actions">
          <Link to="/admin" className="back-btn">
            Dashboard
          </Link>
          <Link to="/admin/recipes/new" className="action-btn">
            ➕ Add Recipe
          </Link>
        </div>
      </div>

      {notice && <p className="success-message">{notice}</p>}

      {/* Filters */}
      <div className="admin-filters">
        <input
          className="pref-input"
          type="text"
          placeholder="Search recipe name..."
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
        />
        <input
          className="pref-input"
          type="text"
          placeholder="Area (e.g. Indian)"
          value={filters.area}
          onChange={(e) => setFilter("area", e.target.value)}
        />
        <input
          className="pref-input"
          type="text"
          placeholder="Category (e.g. Dinner)"
          value={filters.category}
          onChange={(e) => setFilter("category", e.target.value)}
        />
        <select
          className="pref-input"
          value={filters.isVeg}
          onChange={(e) => setFilter("isVeg", e.target.value)}
        >
          <option value="">Any diet</option>
          <option value="true">🌱 Vegetarian</option>
          <option value="false">🍗 Non-Vegetarian</option>
        </select>
        <select
          className="pref-input"
          value={filters.difficulty}
          onChange={(e) => setFilter("difficulty", e.target.value)}
        >
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          className="pref-input"
          value={filters.hasNutrition}
          onChange={(e) => setFilter("hasNutrition", e.target.value)}
        >
          <option value="">Nutrition: any</option>
          <option value="true">Has nutrition</option>
          <option value="false">No nutrition</option>
        </select>
        {hasActiveFilters && (
          <button className="back-btn" onClick={resetFilters}>
            ✖ Clear filters
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading recipes...</p>
        </div>
      ) : items.length === 0 ? (
        <p className="error-message" style={{ color: "#888" }}>
          No recipes match your filters. Try adjusting or clearing them.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Area</th>
                <th>Category</th>
                <th>Diet</th>
                <th>Time</th>
                <th>Difficulty</th>
                <th>Nutrition</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  <td>
                    <img
                      className="admin-thumb"
                      src={r.thumbnail || SAFE_IMG}
                      alt={r.name}
                      onError={(e) => (e.currentTarget.src = SAFE_IMG)}
                    />
                  </td>
                  <td className="admin-name">{r.name}</td>
                  <td>{r.area || "Global"}</td>
                  <td>{r.category || "—"}</td>
                  <td>
                    <span className={`tag ${r.isVeg ? "veg" : "non-veg"}`}>
                      {r.isVeg ? "🌱 Veg" : "🍗 Non-Veg"}
                    </span>
                  </td>
                  <td>{r.cookingTime ? `${r.cookingTime} min` : "—"}</td>
                  <td>{DIFFICULTY_LABEL[r.difficulty] || "—"}</td>
                  <td>
                    {r.nutrition && r.nutrition.calories != null
                      ? `${r.nutrition.calories} kcal`
                      : "—"}
                  </td>
                  <td>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="admin-actions">
                    <button
                      className="table-btn"
                      onClick={() => navigate(`/recipe/${r._id}`)}
                      title="View"
                    >
                      👁
                    </button>
                    <button
                      className="table-btn"
                      onClick={() => navigate(`/admin/recipes/${r._id}/edit`)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="table-btn table-btn-danger"
                      onClick={() => setDeleting(r)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="admin-pagination">
              <button
                className="week-nav-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ⬅ Prev
              </button>
              <span className="week-label">
                Page {page} of {pages}
              </span>
              <button
                className="week-nav-btn"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ➡
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🗑 Delete recipe?</h3>
            <p style={{ textAlign: "center", margin: "1rem 0" }}>
              Are you sure you want to delete{" "}
              <strong>“{deleting.name}”</strong>? This cannot be undone and it
              will be removed from users&apos; favorites and meal plans.
            </p>
            <div className="modal-actions">
              <button
                className="back-btn"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                style={{ width: "auto" }}
                onClick={handleDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? "Deleting..." : "Yes, delete it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
