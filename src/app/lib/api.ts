// ─── Base URL resolution ──────────────────────────────────────────────────────
// On HTTPS (Vercel production) browsers block HTTP backend calls (mixed content).
// vercel.json rewrites /api/* → http://103.55.104.142:5022/* server-side,
// so we use the /api proxy path when served over HTTPS.
// On plain HTTP (local dev) we use the direct backend URL from .env.
const isDev = window.location.protocol === "http:";
const BASE_URL = isDev
  ? ((import.meta.env.VITE_API_BASE_URL as string) ?? "")
  : "/api";

const TOKEN_KEY = "hal_pos_token";

/** Save the JWT access token to localStorage */
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Read the JWT access token from localStorage */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove the JWT access token from localStorage */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Thin wrapper around `fetch` that:
 * - Prepends BASE_URL
 * - Sets Content-Type: application/json
 * - Injects the Bearer token when present
 * - Throws a descriptive error on non-2xx responses
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    // Try to pull a human-readable message from the response body.
    // FastAPI returns detail as an array of validation objects on 422.
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      const detail = body?.detail ?? body?.message;
      if (Array.isArray(detail)) {
        // FastAPI validation errors: [{ loc, msg, type }, ...]
        message = detail
          .map((d: { msg?: string; loc?: string[] }) => {
            const field = d.loc ? d.loc[d.loc.length - 1] : "";
            return field ? `${field}: ${d.msg}` : d.msg ?? "Validation error";
          })
          .join(" · ");
      } else if (typeof detail === "string") {
        message = detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  // Some endpoints return 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
