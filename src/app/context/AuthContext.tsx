import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch, saveToken, getToken, clearToken, SESSION_KEY, ApiError, BASE_URL } from "../lib/api";

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
  /** Assigned store from GET /auth/me — store_manager only */
  storeId: number | null;
  storeName: string | null;
  created_at: string;
  level?: number | null;
  isActive?: boolean;
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
  store_id?: number | null;
  storeName?: string | null;
  store_name?: string | null;
  created_at: string;
  level?: number | null;
  isActive?: boolean;
  is_active?: boolean;
}

function isHeadOfficeLocation(name: string | null | undefined): boolean {
  const n = (name ?? "").trim().toUpperCase();
  return n === "" || n === "HEAD OFFICE" || n === "HO";
}

export function isStoreRole(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "store_manager") return true;
  if (user.role !== "user") return false;
  // Live POST /auth/register always saves role "user" and often drops storeId.
  // Branch staff are identified by a non–Head Office warehouse / store.
  if (user.storeId != null && user.storeId !== 1) return true;
  if (user.storeName && !isHeadOfficeLocation(user.storeName)) return true;
  if (user.warehouse && !isHeadOfficeLocation(user.warehouse)) return true;
  return false;
}

export function homePathForUser(user: User | null | undefined): string {
  if (!user) return "/login";
  if (user.role === "admin") return "/";
  if (isStoreRole(user)) return "/store";
  return "/unauthorized";
}

export function homePathForRole(role: Role | string | null | undefined): string {
  if (role === "admin") return "/";
  if (role === "store_manager") return "/store";
  return "/unauthorized";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseStoreId(raw: Record<string, unknown>): number | null {
  const value = raw.storeId ?? raw.store_id;
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseStoreName(raw: Record<string, unknown>): string | null {
  const value = raw.storeName ?? raw.store_name;
  return typeof value === "string" && value.trim() ? value : null;
}

/** Derive display-friendly fields from a raw backend user object */
function toUser(u: UserResponse): User {
  const parts = u.username.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : u.username.slice(0, 2).toUpperCase();

  const raw = u as unknown as Record<string, unknown>;
  const active = raw.isActive ?? raw.is_active;
  return {
    id: u.id,
    username: u.username,
    name: u.username,
    email: u.email,
    role: u.role,
    warehouse: u.warehouse,
    storeId: parseStoreId(raw),
    storeName: parseStoreName(raw),
    initials,
    created_at: u.created_at,
    level: u.level != null ? Number(u.level) : null,
    isActive: typeof active === "boolean" ? active : true,
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
    storeId: parseStoreId(p),
    storeName: parseStoreName(p),
    initials,
    created_at: (p.created_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Try to fetch a fresh user profile from /auth/me (optional endpoint).
 * Falls back silently — if the endpoint doesn't exist we just use the JWT data.
 */
async function resolveStoreAssignment(user: User): Promise<User> {
  if (user.storeId != null && user.storeId !== 1 && user.storeName) return user;
  const loc = (user.storeName || user.warehouse || "").trim();
  if (!loc || isHeadOfficeLocation(loc)) {
    return user.storeId === 1 ? { ...user, storeId: null } : user;
  }
  try {
    const stores = await apiFetch<Array<Record<string, unknown>>>("/stores");
    const match = (stores ?? []).find(
      (s) => String(s.name ?? "").trim().toLowerCase() === loc.toLowerCase()
    );
    if (!match) return user;
    const id = Number(match.id);
    const name = String(match.name ?? loc);
    if (!Number.isFinite(id) || id === 1 || isHeadOfficeLocation(name)) {
      return { ...user, storeId: null, storeName: name };
    }
    return { ...user, storeId: id, storeName: name };
  } catch {
    return user;
  }
}

async function tryFetchMe(): Promise<User | null> {
  try {
    const raw = await apiFetch<UserResponse>("/auth/me");
    return resolveStoreAssignment(toUser(raw));
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
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; role?: Role; homePath?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserRole: (
    userId: number,
    role: Role,
    warehouse: string | null,
    storeId?: number | null
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserStatus: (
    userId: number,
    isActive: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: number) => Promise<{ success: boolean; error?: string }>;
  fetchUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          // Restore cached user so the first paint is not a blank spinner,
          // then replace it with GET /auth/me (source of truth for role/store).
          setUser(JSON.parse(stored) as User);

          try {
            const fresh = await apiFetch<UserResponse>("/auth/me");
            const mapped = await resolveStoreAssignment(toUser(fresh));
            setUser(mapped);
            localStorage.setItem(SESSION_KEY, JSON.stringify(mapped));
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              clearToken();
              localStorage.removeItem(SESSION_KEY);
              setUser(null);
            }
            // Other errors (network): keep the cached session until /auth/me works.
          }
        } else {
          clearToken();
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
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
  ): Promise<{ success: boolean; error?: string; role?: Role; homePath?: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
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

      // JWT is a fallback only. GET /auth/me is the source of truth for role/store.
      let loggedInUser = await resolveStoreAssignment(userFromToken(data.access_token));
      const fresh = await tryFetchMe();
      if (fresh) loggedInUser = fresh;

      setUser(loggedInUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));

      return {
        success: true,
        role: loggedInUser.role,
        homePath: homePathForUser(loggedInUser),
      };
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
    warehouse: string | null,
    storeId?: number | null
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch<UserResponse>(`/auth/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          role,
          // Backend rejects warehouse on admin and store_manager.
          warehouse: role === "user" ? warehouse : null,
          storeId: role === "store_manager" ? storeId ?? null : null,
        }),
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
        isStoreManager: isStoreRole(user),
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
