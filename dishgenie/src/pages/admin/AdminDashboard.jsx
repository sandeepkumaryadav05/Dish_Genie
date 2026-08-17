import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../../api/adminService";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setStats(await getAdminStats());
      } catch (err) {
        setError(err.message || "Failed to load admin statistics");
      }
    })();
  }, []);

  const cards = [
    { label: "Total Recipes", value: stats?.total ?? 0, icon: "🍽️" },
    { label: "Vegetarian", value: stats?.veg ?? 0, icon: "🌱" },
    { label: "Non-Vegetarian", value: stats?.nonVeg ?? 0, icon: "🍗" },
    { label: "With Nutrition", value: stats?.withNutrition ?? 0, icon: "🥗" }
  ];

  return (
    <div className="page-container admin-page">
      <h2>🛡️ Admin Dashboard</h2>
      <p className="page-subtitle">Manage DishGenie recipes from a single place.</p>

      {error && <p className="error-message">{error}</p>}

      {!stats && !error && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      )}

      {stats && (
        <div className="admin-stats">
          {cards.map((c) => (
            <div className="admin-stat-card" key={c.label}>
              <span className="admin-stat-icon">{c.icon}</span>
              <span className="admin-stat-value">{c.value}</span>
              <span className="admin-stat-label">{c.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="admin-quick-links">
        <Link to="/admin/recipes" className="action-btn">
          📋 Manage Recipes
        </Link>
        <Link to="/admin/recipes/new" className="action-btn">
          ➕ Add Recipe
        </Link>
      </div>
    </div>
  );
}
