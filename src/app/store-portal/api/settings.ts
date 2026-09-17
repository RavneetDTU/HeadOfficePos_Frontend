import { apiFetch } from "@/app/lib/api";

export type UserLevel = 1 | 2 | 3 | 4;

export type PermissionGuidelines = {
  1: string[];
  2: string[];
  3: string[];
  4: string[];
};

function asLevel(value: unknown): UserLevel | null {
  const n = Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return null;
}

function asLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((line) => String(line)).filter(Boolean);
}

export async function fetchPermissionGuidelines(): Promise<PermissionGuidelines | null> {
  try {
    const raw = await apiFetch<Record<string, unknown>>("/settings/permission-guidelines");
    const mapped: PermissionGuidelines = {
      1: asLines(raw["1"] ?? raw.level1),
      2: asLines(raw["2"] ?? raw.level2),
      3: asLines(raw["3"] ?? raw.level3),
      4: asLines(raw["4"] ?? raw.level4),
    };
    if (!mapped[1].length && !mapped[2].length) return null;
    return mapped;
  } catch {
    return null;
  }
}

export async function savePermissionGuidelines(data: PermissionGuidelines): Promise<boolean> {
  try {
    await apiFetch("/settings/permission-guidelines", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateUserLevel(
  userId: number,
  level: UserLevel
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch(`/auth/users/${userId}/level`, {
      method: "PATCH",
      body: JSON.stringify({ level }),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export function levelFromUser(raw: { role?: string; level?: unknown }): UserLevel {
  return asLevel(raw.level) ?? (raw.role === "admin" ? 1 : 2);
}
