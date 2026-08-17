import { createContext, useContext } from "react";

export const FavoritesContext = createContext(null);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (ctx === null) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return ctx;
}
