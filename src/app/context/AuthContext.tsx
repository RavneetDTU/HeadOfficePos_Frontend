import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch, saveToken, getToken, clearToken } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = "admin" | "user" | "store_manager";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  warehouse: string | null;
  /** storeId is set for store_manager users (from /auth/me) */
  storeId: number | null;
  created_at: string;
}

// ─── API response shapes ───────────────────────────────────────────────────────

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  warehouse: string;
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  warehouse: string | null;
  storeId?: number | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive display-friendly fields from a raw backend user object */
function toUser(u: UserResponse): User {
  const parts = u.username.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : u.username.slice(0, 2).toUpperCase();

  return {
    id: u.id,
    username: u.username,
    name: u.username,
    email: u.email,
    role: u.role,
    warehouse: u.warehouse,
    storeId: u.storeId ?? null,
    initials,
    created_at: u.created_at,
  };
}

/**
 * Decode a JWT payload without signature verification.
 * Used client-side to read user claims from the access token.
 */
function decodeJWT(token: string): Record<string, unknown> {
  try {
    // JWT = header.payload.signature — decode the middle part
    const base64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/**
 * Build a User object from a JWT access token.
 * The backend embeds sub (username), id, email, role, warehouse in the JWT payload.
 */
function userFromToken(token: string): User {
  const p = decodeJWT(token);

  const username = (p.sub as string) ?? (p.username as string) ?? "User";
  const parts = username.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : username.slice(0, 2).toUpperCase();

  return {
    id: (p.id as number) ?? (p.user_id as number) ?? 0,
    username,
    name: username,
    email: (p.email as string) ?? "",
    role: ((p.role as Role) ?? "user") as Role,
    warehouse: (p.warehouse as string | null) ?? null,
    storeId: (p.storeId as number | null) ?? null,
    initials,
    created_at: (p.created_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Try to fetch a fresh user profile from /auth/me (optional endpoint).
 * Falls back silently — if the endpoint doesn't exist we just use the JWT data.
 */
async function tryFetchMe(): Promise<User | null> {
  try {
    const raw = await apiFetch<UserResponse>("/auth/me");
    return toUser(raw);
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isStoreManager: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserRole: (
    userId: number,
    role: Role,
    warehouse: string | null
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserStatus: (
    userId: number,
    isActive: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: number) => Promise<{ success: boolean; error?: string }>;
  fetchUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "hal_pos_user";

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        const token = getToken();

        if (stored && token) {
          // Immediately restore from localStorage so the app is interactive
          setUser(JSON.parse(stored));

          // Optionally refresh from /auth/me in background (no-op if not available)
          const fresh = await tryFetchMe();
          if (fresh) {
            setUser(fresh);
            localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
          }
        }
      } catch {
        // Corrupt localStorage — clean up
        clearToken();
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseUrl = window.location.protocol === "http:"
        ? ((import.meta.env.VITE_API_BASE_URL as string) ?? "")
        : "/api";
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let message = "Invalid credentials. Please try again.";
        try {
          const body = await res.json();
          const detail = body?.detail ?? body?.message;
          if (Array.isArray(detail)) {
            message = detail
              .map((d: { msg?: string; loc?: string[] }) => {
                const field = d.loc ? d.loc[d.loc.length - 1] : "";
                return field ? `${field}: ${d.msg}` : (d.msg ?? "Validation error");
              })
              .join(" · ");
          } else if (typeof detail === "string") {
            message = detail;
          }
        } catch { /* ignore */ }
        return { success: false, error: message };
      }

      const data: LoginResponse = await res.json();
      saveToken(data.access_token);

      // Primary: decode user info directly from the JWT (no extra round-trip)
      let loggedInUser = userFromToken(data.access_token);

      // Enhancement: try /auth/me to get richer data (e.g. email, warehouse)
      const fresh = await tryFetchMe();
      if (fresh) loggedInUser = fresh;

      setUser(loggedInUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: message };
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────

  const register = async (
    payload: RegisterPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch<UserResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: message };
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = () => {
    setUser(null);
    clearToken();
    localStorage.removeItem(SESSION_KEY);
  };

  // ── Admin: Update User Role ────────────────────────────────────────────────

  const updateUserRole = async (
    userId: number,
    role: Role,
    warehouse: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch<UserResponse>(`/auth/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role, warehouse }),
      });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      return { success: false, error: message };
    }
  };

  // ── Admin: Fetch All Users ─────────────────────────────────────────────────

  const fetchUsers = async (): Promise<User[]> => {
    const raw = await apiFetch<UserResponse[]>("/auth/users");
    return raw.map(toUser);
  };

  // ── Admin: Update User Status ──────────────────────────────────────────────

  const updateUserStatus = async (
    userId: number,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch<UserResponse>(`/auth/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      return { success: false, error: message };
    }
  };

  // ── Admin: Delete User ─────────────────────────────────────────────────────

  const deleteUser = async (
    userId: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch<void>(`/auth/users/${userId}`, { method: "DELETE" });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed";
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === "admin",
        isStoreManager: user?.role === "store_manager",
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        fetchUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
