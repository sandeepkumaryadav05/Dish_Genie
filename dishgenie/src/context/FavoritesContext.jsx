import { useCallback, useEffect, useState } from "react";
import {
  getFavorites,
  addFavorite,
  removeFavorite
} from "../api/favoriteService";
import { useAuth } from "./authContext.js";
import { FavoritesContext } from "./favoritesContext.js";

export default function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getFavorites();
      setFavorites(items);
      setFavoriteIds(items.map((r) => r._id));
    } catch {
      /* keep existing state; favorites must never break the UI */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds([]);
      setLoading(false);
      return;
    }
    reload();
  }, [user, reload]);

  const isFavorite = useCallback(
    (recipeId) => favoriteIds.includes(recipeId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (recipe) => {
      const id = recipe && recipe._id;
      if (!id) return;

      const wasFavorite = favoriteIds.includes(id);
      setFavoriteIds((prev) =>
        wasFavorite ? prev.filter((x) => x !== id) : [...prev, id]
      );
      setFavorites((prev) =>
        wasFavorite
          ? prev.filter((r) => r._id !== id)
          : prev.some((r) => r._id === id)
          ? prev
          : [...prev, recipe]
      );

      try {
        if (wasFavorite) await removeFavorite(id);
        else await addFavorite(id);
      } catch {
        setFavoriteIds((prev) =>
          wasFavorite ? [...prev, id] : prev.filter((x) => x !== id)
        );
        setFavorites((prev) =>
          wasFavorite
            ? prev.some((r) => r._id === id)
              ? prev
              : [...prev, recipe]
            : prev.filter((r) => r._id !== id)
        );
      }
    },
    [favoriteIds]
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, favoriteIds, loading, isFavorite, toggleFavorite, reload }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
