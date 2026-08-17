import { useEffect, useState } from "react";
import { authListener, login, signup, logout } from "../firebase/authService.js";
import { AuthContext } from "./authContext.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = authListener((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = {
    user,
    login,
    signup,
    logout
  };

  if (loading) return <div className="loader-container"><div className="spinner" /><p>Loading...</p></div>;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
