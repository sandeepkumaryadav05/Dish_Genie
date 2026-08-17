import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import FavoritesProvider from "./context/FavoritesContext.jsx";
import AdminProvider from "./context/AdminContext.jsx";
import ThemeProvider from "./context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <AdminProvider>
            <App />
          </AdminProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
