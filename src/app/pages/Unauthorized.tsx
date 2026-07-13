import { ShieldOff, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export function Unauthorized() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="text-red-500 w-10 h-10" />
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          HeadOffice POS is reserved for Head Office administrators only.
        </p>
        {user && (
          <p className="text-gray-400 text-xs mb-8">
            Logged in as <span className="font-semibold text-gray-600">{user.username}</span>
            {" "}({user.role})
          </p>
        )}

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Authorized personnel only
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut size={16} />
            Sign out and use a different account
          </button>
          <p className="text-xs text-gray-400">
            Contact your system administrator to request admin access.
          </p>
        </div>
      </div>
    </div>
  );
}
