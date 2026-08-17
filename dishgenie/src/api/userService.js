import { fetchJson } from "./apiClient";

export async function getPreferences() {
  return fetchJson("/api/preferences");
}

export async function updatePreferences(preferences) {
  return fetchJson("/api/preferences", {
    method: "PUT",
    body: JSON.stringify({ preferences })
  });
}

export async function trackActivity(type, recipeId) {
  try {
    await fetchJson("/api/users/activity", {
      method: "POST",
      body: JSON.stringify({ type, recipeId })
    });
  } catch {
    /* best-effort mirroring of favorites/views — never block the UI */
  }
}
