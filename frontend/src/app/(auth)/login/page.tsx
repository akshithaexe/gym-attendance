"use client";

/**
 * Customer Auth Page — Sign In & Sign Up for Gym Members.
 *
 * Provides:
 * - Tabbed interface for Sign In and Sign Up (Register new customer)
 * - Auto-login upon successful registration
 * - Link to Staff Portal (/login/staff) for Admin / Trainer login
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, register } from "@/lib/api";
import toast from "react-hot-toast";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    await doLogin(loginEmail, loginPassword);
  };

  const doLogin = async (emailStr: string, passwordStr: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await login(emailStr, passwordStr);
      toast.success(`Welcome back, ${user.full_name}!`);

      if (user.role === "CUSTOMER") {
        router.replace("/dashboard/customer");
      } else if (user.role === "ADMIN") {
        window.location.href = "/dashboard/admin";
      } else if (user.role === "TRAINER") {
        window.location.href = "/dashboard/trainer";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Incorrect email or password. Please check your credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      // Register new user as CUSTOMER
      await register(regEmail, regFullName, regPassword, "CUSTOMER");
      toast.success("Account created successfully! Signing in...");

      // Automatically log in after registration
      await doLogin(regEmail, regPassword);
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Registration failed. Email may already be registered."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl mb-3 shadow-lg shadow-brand-500/25">
            <span className="text-2xl font-bold text-white">G</span>
          </div>
          <h1 className="text-3xl font-bold text-white">GymTrack Member Portal</h1>
          <p className="text-dark-400 text-sm mt-1">Access your QR check-in pass & membership</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8">
          {/* Tab Switcher: Sign In vs Sign Up */}
          <div className="flex border-b border-dark-700 mb-6">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "signin"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-dark-400 hover:text-dark-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "signup"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-dark-400 hover:text-dark-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-dark-300 mb-1">
                  Member Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="member@gmail.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-dark-300 mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
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
                className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/25 mt-2"
              >
                {loading ? "Signing in..." : "Sign In to Member Portal"}
              </button>

            </form>
          )}

          {/* Sign Up / Create Account Form */}
          {activeTab === "signup" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-dark-300 mb-1">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-dark-300 mb-1">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-dark-300 mb-1">
                  Create Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-dark-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/25 mt-2"
              >
                {loading ? "Creating Account..." : "Create Member Account"}
              </button>
            </form>
          )}
        </div>

        {/* Portal Switcher Banner */}
        <div className="mt-6 p-4 rounded-xl bg-dark-900/90 border border-dark-700/80 text-center">
          <p className="text-xs text-dark-300">
            Gym Staff Member (Admin / Trainer)?
          </p>
          <Link
            href="/login/staff"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors mt-1"
          >
            🛡️ Go to Staff Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
