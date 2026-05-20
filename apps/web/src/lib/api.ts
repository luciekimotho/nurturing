const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const USER_ID = import.meta.env.VITE_USER_ID ?? "demo";
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE ?? "header").toLowerCase();

let authTokenGetter: (() => Promise<string | null>) | null = null;

export function configureAuthTokenGetter(getter: (() => Promise<string | null>) | null) {
  authTokenGetter = getter;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (AUTH_MODE === "clerk" && authTokenGetter) {
    const token = await authTokenGetter();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } else {
    headers.set("x-user-id", USER_ID);
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
}
