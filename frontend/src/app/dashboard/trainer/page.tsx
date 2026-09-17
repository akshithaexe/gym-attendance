"use client";

/**
 * Trainer Dashboard.
 *
 * Features:
 * - List of assigned trainees
 * - Manual mark present/absent for each trainee
 * - Attendance history for assigned trainees
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import Navbar from "@/components/navbar";
import AttendanceTable from "@/components/attendance-table";
import toast from "react-hot-toast";
import type { AttendanceRecord, User } from "@/types";

export default function TrainerDashboardPage() {
  const router = useRouter();
  const [trainees, setTrainees] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<number | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "TRAINER") {
      router.replace("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [traineesRes, logsRes] = await Promise.all([
        api.get("/users/trainers/trainees"),
        api.get("/attendance/logs?limit=100"),
      ]);
      setTrainees(traineesRes.data.users);
      setRecords(logsRes.data.records);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (userId: number, status: string) => {
    setMarking(userId);
    try {
      await api.post("/attendance/manual-mark", {
        user_id: userId,
        status,
      });
      toast.success(
        `Marked ${status === "present" ? "✅ present" : "❌ absent"}`
      );
      fetchData(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to mark attendance");
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Trainer Dashboard</h1>
            <p className="text-dark-400 text-sm mt-1">
              Manage your assigned trainees
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-dark-700 text-dark-200 rounded-lg hover:bg-dark-600 transition-colors text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Trainees list */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            👥 My Trainees ({trainees.length})
          </h2>

          {trainees.length === 0 ? (
            <div className="glass-card p-8 text-center text-dark-400">
              <p>No trainees assigned yet.</p>
              <p className="text-sm mt-1">Ask an admin to assign members to you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainees.map((trainee) => (
                <div key={trainee.id} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">{trainee.full_name}</p>
                      <p className="text-sm text-dark-400">{trainee.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        trainee.is_active
                          ? "text-brand-400"
                          : "text-red-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          trainee.is_active ? "bg-brand-400" : "bg-red-400"
                        }`}
                      />
                      {trainee.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(trainee.id, "present")}
                      disabled={marking === trainee.id}
                      className="flex-1 py-2 bg-brand-600/20 text-brand-400 text-sm font-medium rounded-lg hover:bg-brand-600/30 transition-colors disabled:opacity-50"
                    >
                      ✅ Present
                    </button>
                    <button
                      onClick={() => markAttendance(trainee.id, "absent")}
                      disabled={marking === trainee.id}
                      className="flex-1 py-2 bg-red-600/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                    >
                      ❌ Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance history */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            📋 Attendance History
          </h2>
          <AttendanceTable records={records} loading={loading} />
        </div>
      </main>
    </div>
  );
}
