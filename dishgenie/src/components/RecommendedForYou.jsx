import { useEffect, useState } from "react";
import { getRecommendations } from "../api/recommendationService";
import RecipeCard from "./RecipeCard";
import SkeletonCard from "./SkeletonCard";

export default function RecommendedForYou({ limit = 6 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const recs = await getRecommendations({ limit });
        if (alive) setItems(recs);
      } catch {
        /* silently skip */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [limit]);

  if (loading) {
    return (
      <div className="recipe-grid">
        {[...Array(limit)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="rec-section">
      <h2 className="section-title">✨ Recommended for you</h2>
      <div className="recipe-grid">
        {items.map((item) => (
          <div className="rec-card-wrap" key={item.recipe._id}>
            <RecipeCard recipe={item.recipe} />
            <div className="rec-meta">
              <span className="rec-score">⭐ {item.score}/100</span>
              {item.reasons && item.reasons[0] && (
                <span className="rec-reason" title={item.reasons.join("\n")}>
                  {item.reasons[0]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
