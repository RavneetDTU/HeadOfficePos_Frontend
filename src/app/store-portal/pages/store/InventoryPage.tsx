import { useEffect, useMemo, useState } from "react";
import { fetchProductAvailability } from "@/app/store-portal/api/inventory";
import type { StockLine } from "@/app/store-portal/types";
import {
  BackendBanner,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StockBadge,
} from "@/app/store-portal/components/ui/primitives";

/** Branch view: Available to order from Head Office (not store shelf). */
export function InventoryPage() {
  const [lines, setLines] = useState<StockLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allocationLive, setAllocationLive] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetchProductAvailability()
      .then((r) => {
        setLines(r.lines);
        setAllocationLive(r.allocationLive);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((l) => `${l.name} ${l.sku}`.toLowerCase().includes(q));
  }, [lines, search]);

  return (
    <div>
      <PageHeader
        title="Stock Availability"
        subtitle="What you can order from Head Office right now"
      />

      {!allocationLive && !loading && lines.length > 0 && (
        <BackendBanner>
          Available should equal Physical − Allocated from open branch orders. Until allocation APIs
          exist, values come from <code className="text-xs">GET /sales/stock</code>.
        </BackendBanner>
      )}

      <input
        className="mb-4 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Search SKU or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No stock rows" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Available to order</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((line) => (
                  <tr key={line.sku}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(line.thumbnailUrl || line.imageUrl) ? (
                          <img
                            src={line.thumbnailUrl || line.imageUrl || ""}
                            alt=""
                            className="h-10 w-10 rounded-md border border-slate-100 bg-white object-contain"
                          />
                        ) : null}
                        <span className="font-medium">{line.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{line.sku}</td>
                    <td className="px-4 py-3 text-right font-semibold">{line.availableQty}</td>
                    <td className="px-4 py-3">
                      <StockBadge available={line.availableQty} alertQty={line.alertQty} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
