import { fetchJson, qs } from "./apiClient";

export async function getAdminStatus() {
  return fetchJson("/api/admin/me");
}

export async function getAdminStats() {
  return fetchJson("/api/admin/stats");
}

export async function getAdminRecipes({
  q = "",
  area = "",
  category = "",
  isVeg = "",
  difficulty = "",
  hasNutrition = "",
  page = 1,
  limit = 20
} = {}) {
  const query = qs({
    q,
    area,
    category,
    isVeg,
    difficulty,
    hasNutrition,
    page,
    limit
  });
  return fetchJson(`/api/admin/recipes?${query}`);
}

export async function getAdminRecipe(id) {
  return fetchJson(`/api/admin/recipes/${id}`);
}

export async function createAdminRecipe(payload) {
  return fetchJson("/api/admin/recipes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAdminRecipe(id, payload) {
  return fetchJson(`/api/admin/recipes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteAdminRecipe(id) {
  return fetchJson(`/api/admin/recipes/${id}`, {
    method: "DELETE"
  });
}
