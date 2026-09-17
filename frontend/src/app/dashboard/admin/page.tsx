"use client";

/**
 * Admin Dashboard.
 *
 * Features:
 * - Full gym attendance roster
 * - User management (list, role badges, active status)
 * - Export logs (CSV download)
 * - Assign trainers to customers
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import Navbar from "@/components/navbar";
import AttendanceTable from "@/components/attendance-table";
import toast from "react-hot-toast";
import type { AttendanceRecord, User, UserListResponse } from "@/types";
import { roleLabel } from "@/lib/utils";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"attendance" | "users">("attendance");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "ADMIN") {
      router.replace("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, usersRes] = await Promise.all([
        api.get("/attendance/logs?limit=100"),
        api.get("/users/?limit=100"),
      ]);
      setRecords(attendanceRes.data.records);
      setUsers(usersRes.data.users);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "User", "Email", "Check In", "Check Out", "Method"];
    const rows = records.map((r) => [
      r.id,
      r.user_name || "",
      r.user_email || "",
      r.check_in,
      r.check_out || "",
      r.marked_by,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const tabs = [
    { key: "attendance" as const, label: "📊 Attendance Logs" },
    { key: "users" as const, label: "👥 User Management" },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-dark-400 text-sm mt-1">
              Manage gym operations, attendance, and members
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-dark-700 text-dark-200 rounded-lg hover:bg-dark-600 transition-colors text-sm"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5">
            <p className="text-sm text-dark-400">Total Members</p>
            <p className="text-2xl font-bold text-white mt-1">
              {users.filter((u) => u.role === "CUSTOMER").length}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-dark-400">Today&apos;s Check-ins</p>
            <p className="text-2xl font-bold text-brand-400 mt-1">
              {records.filter((r) => {
                const today = new Date().toDateString();
                return new Date(r.check_in).toDateString() === today;
              }).length}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-dark-400">Active Trainers</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {users.filter((u) => u.role === "TRAINER" && u.is_active).length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 rounded-lg p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-dark-600 text-white"
                  : "text-dark-400 hover:text-dark-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "attendance" ? (
          <AttendanceTable records={records} loading={loading} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-dark-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-800 text-dark-300 text-left">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Trainer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-dark-400">#{user.id}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {user.full_name}
                    </td>
                    <td className="px-4 py-3 text-dark-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-400"
                            : user.role === "TRAINER"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-brand-500/10 text-brand-400"
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${
                          user.is_active
                            ? "text-brand-400"
                            : "text-red-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.is_active ? "bg-brand-400" : "bg-red-400"
                          }`}
                        />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400">
                      {user.trainer_id ? `#${user.trainer_id}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
