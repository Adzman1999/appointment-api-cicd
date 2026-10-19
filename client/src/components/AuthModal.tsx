import React, { useState } from "react";
import { login, register, User } from "../api";
import { LogIn, UserPlus, X, Lock, Mail } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register(email, password);
        onSuccess(res.data.user, res.data.accessToken);
      } else {
        const res = await login(email, password);
        onSuccess(res.data.user, res.data.accessToken);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              {isRegister ? "Create CareSync Account" : "Welcome Back to CareSync"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRegister ? "Register for enterprise clinical scheduling" : "Sign in to manage your appointments and active holds"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 characters"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            {isRegister && (
              <p className="text-[11px] text-slate-400 mt-1">
                Password must be at least 12 characters long.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>

          {/* Quick 1-Click Demo Guest Logins */}
          <div className="pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Demo Guest Access
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  const demoPatient: User = { id: 101, email: "patient.guest@caresync.com", role: "patient" };
                  onSuccess(demoPatient, "demo-guest-token");
                  onClose();
                }}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center flex flex-col items-center justify-center"
              >
                <span>👤 Guest Patient</span>
                <span className="text-[10px] font-normal text-slate-400">1-Click Test</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const demoAdmin: User = { id: 1, email: "admin.director@caresync.com", role: "admin" };
                  onSuccess(demoAdmin, "demo-admin-token");
                  onClose();
                }}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center flex flex-col items-center justify-center"
              >
                <span>⚡ Guest Admin</span>
                <span className="text-[10px] font-normal text-slate-400">1-Click Test</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isRegister ? "Sign in instead" : "Sign up for free"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
