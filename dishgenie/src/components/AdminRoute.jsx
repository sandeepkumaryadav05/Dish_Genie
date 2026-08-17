import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext.js";
import { useAdmin } from "../context/adminContext.js";
export default function AdminRoute({ children }) {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Checking admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
