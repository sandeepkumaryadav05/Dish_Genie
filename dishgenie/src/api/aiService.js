import { fetchJson } from "./apiClient";

export async function sendChat(message) {
  return fetchJson("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message })
  });
}
