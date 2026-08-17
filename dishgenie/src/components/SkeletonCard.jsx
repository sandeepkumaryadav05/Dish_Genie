import "./SkeletonCard.css";

export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-title shimmer" />
        <div className="skeleton-meta shimmer" />
        <div className="skeleton-btns">
          <div className="skeleton-btn shimmer" />
        </div>
      </div>
    </div>
  );
}
