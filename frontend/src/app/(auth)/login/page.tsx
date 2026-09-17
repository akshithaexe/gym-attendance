"use client";

/**
 * Login page with 1-click Demo Accounts (Admin / Trainer / Customer).
 *
 * Features:
 * - Standard email + password login form
 * - Demo account quick-login buttons for interviewer convenience
 * - Glassmorphism card design
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import toast from "react-hot-toast";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@gym.demo", password: "admin123", color: "from-purple-500 to-purple-700" },
  { label: "Trainer", email: "trainer@gym.demo", password: "trainer123", color: "from-blue-500 to-blue-700" },
  { label: "Customer", email: "member@gym.demo", password: "member123", color: "from-brand-500 to-brand-700" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      toast.success(`Welcome back, ${user.full_name}!`);

      // Redirect based on role
      switch (user.role) {
        case "ADMIN":
          router.push("/dashboard/admin");
          break;
        case "TRAINER":
          router.push("/dashboard/trainer");
          break;
        case "CUSTOMER":
          router.push("/customer/pass");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-500/25">
            <span className="text-2xl font-bold text-white">G</span>
          </div>
          <h1 className="text-3xl font-bold text-white">GymTrack</h1>
          <p className="text-dark-400 mt-2">Sign in to your account</p>
        </div>

        {/* Login card */}
        <div className="glass-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-dark-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                placeholder="you@gym.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-dark-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-xs text-dark-400 uppercase tracking-wider">
              Demo Accounts
            </span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          {/* Demo account buttons */}
          <div className="grid grid-cols-3 gap-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                onClick={() => doLogin(account.email, account.password)}
                disabled={loading}
                className={`py-2.5 px-3 bg-gradient-to-r ${account.color} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-dark-500 mt-6">
          QR-based attendance system with replay-attack prevention
        </p>
      </div>
    </div>
  );
}
