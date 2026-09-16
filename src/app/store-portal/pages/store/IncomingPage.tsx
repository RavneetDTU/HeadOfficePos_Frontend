import { useEffect, useState } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import {
  fetchIncomingForStore,
  isIncomingStatus,
  updateTransferStatus,
} from "@/app/store-portal/api/transfers";
import { useAuth } from "@/app/context/AuthContext";
import type { Transfer } from "@/app/store-portal/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtDate } from "@/app/store-portal/lib/utils";

export function IncomingPage() {
  const { user } = useAuth();
  const storeId = user?.storeId ?? null;
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiving, setReceiving] = useState<number | null>(null);

  const load = async () => {
    if (!storeId) {
      setError("Your account is not linked to a store");
      setTransfers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await fetchIncomingForStore(storeId);
      setTransfers(rows.filter((t) => isIncomingStatus(t.status)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load incoming transfers");
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const receive = async (id: number) => {
    setReceiving(id);
    try {
      await updateTransferStatus(id, "Delivered", "Received at store");
      toast.success("Transfer marked as received");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Receive failed");
    } finally {
      setReceiving(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Incoming" subtitle="Shipments heading to your store" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Incoming" subtitle="Shipments heading to your store" />
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Card className="overflow-hidden">
          {transfers.length === 0 ? (
            <EmptyState
              title="Nothing incoming"
              description="No open transfers are heading to your store."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{t.transferNumber}</p>
                      <Badge tone="info">{t.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      From {t.warehouseName ?? "Head Office"} · {fmtDate(t.createdAt)}
                    </p>
                    <ul className="mt-2 text-sm text-slate-600 space-y-0.5">
                      {(t.items ?? []).slice(0, 5).map((item) => (
                        <li key={`${item.productSku}-${item.productName}`}>
                          {item.productSku} — {item.productName} × {item.quantity}
                        </li>
                      ))}
                      {(t.items?.length ?? 0) > 5 && (
                        <li className="text-slate-400">+{(t.items?.length ?? 0) - 5} more</li>
                      )}
                    </ul>
                  </div>
                  <Button
                    onClick={() => void receive(t.id)}
                    disabled={receiving === t.id}
                  >
                    {receiving === t.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <PackageCheck size={16} />
                    )}
                    Receive
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
