import { Link } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { Badge, Button, Card, PageHeader } from "@/app/store-portal/components/ui/primitives";

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <PageHeader title="Profile" subtitle="Not signed in" />;
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your store manager account" />
      <Card className="p-6 max-w-lg">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Name</dt>
            <dd className="font-medium text-slate-900 mt-1">{user.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Username</dt>
            <dd className="font-medium text-slate-900 mt-1">{user.username}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Email</dt>
            <dd className="font-medium text-slate-900 mt-1">{user.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Role</dt>
            <dd className="mt-1"><Badge tone="info">{user.role}</Badge></dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Store</dt>
            <dd className="font-medium text-slate-900 mt-1">
              {user.storeName ?? (user.storeId != null ? `Store #${user.storeId}` : "—")}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex gap-3">
          <Link to="/store">
            <Button variant="secondary">Dashboard</Button>
          </Link>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
