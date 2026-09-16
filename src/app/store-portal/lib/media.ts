const DEFAULT_API_ORIGIN = "http://103.55.104.142:5022";
const API_ORIGIN = String(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN).replace(
  /\/$/,
  ""
);

const BACKEND_HOSTS = new Set(
  [API_ORIGIN, DEFAULT_API_ORIGIN]
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).host;
      } catch {
        return "";
      }
    })
    .filter(Boolean)
);

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

function isBackendMediaPath(pathname: string): boolean {
  return (
    pathname.startsWith("/media/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/api/")
  );
}

/** Same-origin URL that Vite (/api proxy) and Vercel (/api rewrite) can both serve. */
function toProxiedPath(pathname: string, search = ""): string {
  if (pathname.startsWith("/api/")) return `${pathname}${search}`;
  return `/api${pathname}${search}`;
}

/**
 * Make product image paths load in the browser.
 * Local: Vite proxies /api → backend.
 * Production: vercel.json rewrites /api → backend (HTTPS page cannot load raw http:// backend files).
 */
export function resolveMediaUrl(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const raw = pickUrl(candidate);
    if (!raw) continue;
    if (/^(data:|blob:)/i.test(raw)) return raw;

    if (raw.startsWith("//")) {
      const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
      return resolveMediaUrl(`${protocol}${raw}`);
    }

    if (/^https?:/i.test(raw)) {
      try {
        const url = new URL(raw);
        if (BACKEND_HOSTS.has(url.host) || isBackendMediaPath(url.pathname)) {
          return toProxiedPath(url.pathname, url.search);
        }
        return raw;
      } catch {
        continue;
      }
    }

    const path = raw.startsWith("/") ? raw : `/${raw}`;
    if (isBackendMediaPath(path)) return toProxiedPath(path);
    if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path)) {
      const filename = path.split("/").pop() ?? path.slice(1);
      return toProxiedPath(`/media/products/${filename}`);
    }
    return toProxiedPath(path);
  }
  return null;
}
