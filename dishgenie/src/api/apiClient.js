import { auth } from "../firebase/authService";

const BASE = import.meta.env.VITE_API_URL || "";

export async function getAuthToken(force = false) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(force);
  } catch {
    return null;
  }
}

export async function fetchJson(url, init = {}, retried = false) {
  const headers = { ...(init.headers || {}) };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...init, headers });

  if (res.status === 401 && !retried) {
    const fresh = await getAuthToken(true);
    if (fresh) {
      headers.Authorization = `Bearer ${fresh}`;
      return fetchJson(url, { ...init, headers }, true);
    }
    try {
      await auth.signOut();
    } catch {
      /* session already gone */
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((val) => p.append(k, val));
    else p.set(k, String(v));
  });
  return p.toString();
}
