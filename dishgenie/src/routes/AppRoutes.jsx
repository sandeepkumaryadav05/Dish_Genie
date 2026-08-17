import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Favorites from "../pages/Favorites";
import RecipeDetail from "../pages/RecipeDetail";
import MealPlanner from "../pages/MealPlanner";
import AIAssistant from "../pages/AIAssistant";
import Preferences from "../pages/Preferences";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import AdminRoute from "../components/AdminRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminRecipeList from "../pages/admin/AdminRecipeList";
import AdminRecipeForm from "../pages/admin/AdminRecipeForm";
import { useAuth } from "../context/authContext.js";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <PrivateRoute>
            <Favorites />
          </PrivateRoute>
        }
      />
      <Route
        path="/recipe/:id"
        element={
          <PrivateRoute>
            <RecipeDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <PrivateRoute>
            <MealPlanner />
          </PrivateRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <PrivateRoute>
            <AIAssistant />
          </PrivateRoute>
        }
      />
      <Route
        path="/preferences"
        element={
          <PrivateRoute>
            <Preferences />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/recipes"
        element={
          <AdminRoute>
            <AdminRecipeList />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/recipes/new"
        element={
          <AdminRoute>
            <AdminRecipeForm />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/recipes/:id/edit"
        element={
          <AdminRoute>
            <AdminRecipeForm />
          </AdminRoute>
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
