import { apiFetch } from "@/app/lib/api";

export interface CompanyInfo {
  name: string;
  address?: string | null;
  city?: string | null;
  tel?: string | null;
  email?: string | null;
  vatNo?: string | null;
  regNo?: string | null;
  website?: string | null;
}

export async function fetchCompany(): Promise<CompanyInfo | null> {
  try {
    const raw = await apiFetch<Record<string, unknown>>("/company");
    const name = String(raw.name ?? "").trim();
    if (!name) return null;
    return {
      name,
      address: (raw.address as string) ?? null,
      city: (raw.city as string) ?? null,
      tel: (raw.tel as string) ?? null,
      email: (raw.email as string) ?? null,
      vatNo: (raw.vatNo as string) ?? null,
      regNo: (raw.regNo as string) ?? null,
      website: (raw.website as string) ?? null,
    };
  } catch {
    return null;
  }
}
