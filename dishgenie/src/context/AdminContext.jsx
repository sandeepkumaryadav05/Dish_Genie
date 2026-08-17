import { useCallback, useEffect, useState } from "react";
import { getAdminStatus } from "../api/adminService";
import { useAuth } from "./authContext.js";
import { AdminContext } from "./adminContext.js";

export default function AdminProvider({ children }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return false;
    }
    setLoading(true);
    try {
      await getAdminStatus();
      setIsAdmin(true);
      return true;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AdminContext.Provider value={{ isAdmin, loading, refresh }}>
      {children}
    </AdminContext.Provider>
  );
}
