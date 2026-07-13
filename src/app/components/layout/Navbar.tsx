import { useState, useRef, useEffect } from "react";
import {
  FileText,
  BarChart3,
  ShoppingCart,
  Calculator,
  Cloud,
  Network,
  MessageCircle,
  Bell,
  Calendar,
  CreditCard,
  Flag,
  LogOut,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-[#11131c] border-b border-white/5 flex items-center justify-between px-4 gap-4">
      {/* Left side: Quick Shortcut Toolbar */}
      <div className="flex items-center gap-1">
        <button title="Documents" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <FileText size={18} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        <button title="Analytics" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <BarChart3 size={18} />
        </button>
        <button title="Cloud Sync" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Cloud size={18} />
        </button>
        <button title="Network Status" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Network size={18} />
        </button>
        <button title="Messages" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <MessageCircle size={18} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        <button title="Notifications" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all relative">
          <Bell size={18} />

        </button>
        <button title="Calculator" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Calculator size={18} />
        </button>
        <button title="Calendar" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Calendar size={18} />
        </button>
        <button title="Payments" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <CreditCard size={18} />
        </button>
        <button title="Flags" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Flag size={18} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* Quick Action Status / Alerts */}
        <div className="flex items-center gap-1.5">
          <button title="System Warnings" className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all">
            <AlertTriangle size={18} />
          </button>
          <button title="POS / Register" className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
            <ShoppingCart size={18} />
          </button>
          <button title="Settings" className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Right side: User Profile & Dropdown */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-slate-200 font-semibold leading-tight">{user?.name ?? "—"}</div>
          <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{user?.warehouse ?? ""}</div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((v) => !v)}
            title="Account menu"
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md hover:ring-2 hover:ring-indigo-500/50 transition-all"
          >
            {user?.initials ?? "?"}
          </button>

          {/* User Dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-56 bg-[#161925]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in duration-200">
              <div className="px-4 py-3.5 border-b border-white/5 bg-white/5">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded text-[9px] font-semibold tracking-wide uppercase">
                  {user?.warehouse || "No Warehouse"}
                </span>
              </div>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-medium"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

