// Same-origin `/api`:
// - local: Vite proxies /api → VITE_API_BASE_URL (avoids CORS; backend allowlists :5005 only)
// - production: vercel.json rewrites /api → backend
export const BASE_URL = "/api";

const TOKEN_KEY = "hal_pos_token";
export const SESSION_KEY = "hal_pos_user";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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
 * - Sets Content-Type: application/json unless the body is FormData
 * - Injects the Bearer token when present
 * - Throws a descriptive error on non-2xx responses
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

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

    // Expired / invalid session — force re-login. Login itself uses a raw fetch.
    if (res.status === 401 && token) {
      clearToken();
      localStorage.removeItem(SESSION_KEY);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }

    throw new ApiError(message, res.status);
  }

  // Some endpoints return 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
