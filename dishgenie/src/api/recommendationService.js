import { fetchJson, qs } from "./apiClient";

export async function getRecommendations({ limit = 12, ingredients } = {}) {
  const query = qs({ limit, ingredients });
  const data = await fetchJson(`/api/recommendations?${query}`);
  return data.items || [];
}
