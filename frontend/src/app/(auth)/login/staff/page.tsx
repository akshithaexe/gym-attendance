"use client";

/**
 * Staff Auth Page — Sign In for Admin & Personal Trainers.
 *
 * Provides:
 * - Dedicated portal for Admin and Trainer role access
 * - Quick Demo login buttons for staff accounts
 * - Security notice & link back to Customer Portal (/login)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import toast from "react-hot-toast";

const STAFF_DEMO_ACCOUNTS = [
  { label: "Admin Demo", email: "admin@gmail.com", password: "admin123", color: "from-purple-600 to-purple-800" },
  { label: "Trainer Demo", email: "trainer@gmail.com", password: "trainer123", color: "from-blue-600 to-blue-800" },
];

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    await doLogin(email, password);
  };

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await login(loginEmail, loginPassword);
      toast.success(`Welcome back, ${user.full_name}! (${user.role})`);

      if (user.role === "ADMIN") {
        window.location.href = "/dashboard/admin";
      } else if (user.role === "TRAINER") {
        window.location.href = "/dashboard/trainer";
      } else {
        window.location.href = "/customer/pass";
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Incorrect email or password. Please check your staff credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-3 shadow-lg shadow-purple-500/25">
            <span className="text-2xl font-bold text-white">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Staff Management Portal</h1>
          <p className="text-dark-400 text-sm mt-1">Authorized access for Administrators & Trainers</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8 border-purple-500/20">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="staff-email" className="block text-sm font-medium text-dark-300 mb-1">
                Staff Email
              </label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="admin@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="staff-password" className="block text-sm font-medium text-dark-300 mb-1">
                Password
              </label>
              <input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25 mt-2"
            >
              {loading ? "Authenticating Staff..." : "Sign In to Staff Portal"}
            </button>
          </form>

        </div>

        {/* Switch back to Customer Portal */}
        <div className="mt-6 p-4 rounded-xl bg-dark-900/90 border border-dark-700/80 text-center">
          <p className="text-xs text-dark-300">
            Looking for Member Pass & Check-In?
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors mt-1"
          >
            👤 Go to Customer Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
