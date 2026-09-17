"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import Navbar from "@/components/navbar";
import QRDisplay from "@/components/qr-display";
import type { User, AttendanceRecord } from "@/types";
import toast from "react-hot-toast";
import AttendanceTable from "@/components/attendance-table";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localUser = getStoredUser();
    if (!localUser) {
      router.replace("/login");
      return;
    } else if (localUser.role !== "CUSTOMER") {
      router.replace("/dashboard");
      return;
    }
    fetchData(localUser.id);
  }, [router]);

  const fetchData = async (userId: number) => {
    setLoading(true);
    try {
      const [userRes, logsRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get("/attendance/my-logs?limit=50"),
      ]);
      setUser(userRes.data);
      setRecords(logsRes.data.records);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (!user && loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasMembership = user?.membership_expires_at && new Date(user.membership_expires_at) > new Date();

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome, {user?.full_name}!</h1>
          <p className="text-dark-400 mt-1">Manage your membership and check in.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Membership Card */}
          <div className="glass-card p-6 border-t-4 border-brand-500 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">
                Membership Status
              </h2>
              {hasMembership ? (
                <>
                  <div className="text-4xl font-bold text-brand-400 mb-2">
                    {user.membership_type || "Standard"}
                  </div>
                  <p className="text-white">Active Plan</p>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-red-400 mb-2">Inactive</div>
                  <p className="text-white">No active plan.</p>
                </>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-dark-700">
              <p className="text-sm text-dark-400">
                {hasMembership
                  ? `Valid until ${new Date(user.membership_expires_at!).toLocaleDateString()}`
                  : "Please see the front desk to renew your membership."}
              </p>
            </div>
          </div>

          {/* QR Pass */}
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 absolute top-6 left-6">
              Gym Access Pass
            </h2>
            
            {hasMembership ? (
              <div className="mt-8">
                <QRDisplay refreshInterval={30} />
                <p className="text-xs text-dark-400 mt-4 max-w-xs mx-auto">
                  Show this QR code at the front desk. Code refreshes every 30s.
                </p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Access Locked</h3>
                <p className="text-sm text-dark-400">
                  You need an active membership to generate a QR check-in pass.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Check-in History */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            📋 My Attendance History
          </h2>
          <div className="glass-card overflow-hidden">
             <AttendanceTable records={records} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
