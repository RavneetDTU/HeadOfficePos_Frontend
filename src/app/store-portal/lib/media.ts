const API_ORIGIN = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function pickUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t || t === "null" || t === "undefined") return null;
    if (t.startsWith("local:")) return null;
    return t;
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return pickUrl(o.url ?? o.src ?? o.path ?? o.imageUrl ?? o.image_url ?? o.thumbnailUrl);
  }
  return null;
}

/** Make product image paths load in the browser (absolute, /api proxy, or backend origin). */
export function resolveMediaUrl(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const raw = pickUrl(candidate);
    if (!raw) continue;
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("//")) {
      const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
      return `${protocol}${raw}`;
    }
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    if (path.startsWith("/api/") || path.startsWith("/media/") || path.startsWith("/uploads/") || path.startsWith("/static/")) {
      return path;
    }
    if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path)) {
      const filename = path.split("/").pop() ?? path.slice(1);
      return `/media/products/${filename}`;
    }
    if (API_ORIGIN) return `${API_ORIGIN}${path}`;
    return `/api${path}`;
  }
  return null;
}
