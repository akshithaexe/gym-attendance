"use client";

/**
 * Navigation bar with user role badge and logout button.
 */

import { useRouter } from "next/navigation";
import { logout, getStoredUser } from "@/lib/api";
import { roleLabel } from "@/lib/utils";
import { User } from "@/types";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    logout();
  };

  const roleBadgeColor: Record<string, string> = {
    ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    TRAINER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    CUSTOMER: "bg-brand-500/20 text-brand-300 border-brand-500/30",
  };

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">
              GymTrack
            </span>
          </div>

          {/* User info + logout */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white font-medium">
                  {user.full_name}
                </p>
                <p className="text-xs text-dark-400">{user.email}</p>
              </div>

              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                  roleBadgeColor[user.role] || ""
                }`}
              >
                {roleLabel(user.role)}
              </span>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
