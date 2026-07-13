import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Building2,
  Loader2,
  User,
  Lock,
  ShieldCheck,
} from "lucide-react";

// ─── Component ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    setIsLoading(true);
    const result = await login(loginUsername.trim(), loginPassword);
    setIsLoading(false);

    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] flex items-center justify-center p-6 relative overflow-hidden font-sans">

      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">

        {/* Top Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
            <Building2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Hearing Aid Labs</h1>
          <p className="text-sm text-indigo-400 font-semibold tracking-wider uppercase mt-1">
            HeadOffice POS — Head Office
          </p>
        </div>

        {/* Login Glassmorphic Card */}
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8 transition-all hover:border-white/15">

          <div className="mb-6">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Admin Access Only</span>
            </div>
            <h2 className="text-xl font-bold text-center text-white">Welcome Back</h2>
            <p className="text-sm text-gray-400 mt-1 text-center">Sign in to manage your head office.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl mb-5">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </span>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="login-password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  id="login-password"
                  type={showLoginPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPwd(!showLoginPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  Authenticating…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In to HeadOffice POS
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <span className="text-xs text-gray-500">
              Security Notice: Authorized admin access only.
            </span>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-8">
          © 2026 Hearing Aid Lab (PTY) LTD · HeadOffice POS · All rights reserved
        </p>
      </div>
    </div>
  );
}
