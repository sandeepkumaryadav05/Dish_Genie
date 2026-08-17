import { fetchJson } from "./apiClient";

export async function getFavorites() {
  const data = await fetchJson("/api/users/favorites");
  return data.recipes || [];
}

export async function addFavorite(recipeId) {
  return fetchJson(`/api/users/favorites/${recipeId}`, {
    method: "POST"
  });
}

export async function removeFavorite(recipeId) {
  return fetchJson(`/api/users/favorites/${recipeId}`, {
    method: "DELETE"
  });
}
