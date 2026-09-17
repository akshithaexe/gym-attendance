"use client";

/**
 * Admin Dashboard.
 *
 * Features:
 * - Full gym attendance roster
 * - User management (list, role badges, active status)
 * - Export logs (CSV download)
 * - Assign trainers to customers
 * - Provision staff & trainer accounts securely
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import Navbar from "@/components/navbar";
import AttendanceTable from "@/components/attendance-table";
import toast from "react-hot-toast";
import type { AttendanceRecord, User } from "@/types";
import { roleLabel } from "@/lib/utils";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"attendance" | "users">("attendance");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for Provisioning Staff / Trainers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"TRAINER" | "ADMIN" | "CUSTOMER">("TRAINER");
  const [submitting, setSubmitting] = useState(false);

  // Modal state for Membership update
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipModalUser, setMembershipModalUser] = useState<User | null>(null);
  const [membershipMonths, setMembershipMonths] = useState(1);
  const [membershipType, setMembershipType] = useState("Standard");
  const [updatingMembership, setUpdatingMembership] = useState(false);

  const handleUpdateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membershipModalUser) return;
    
    setUpdatingMembership(true);
    try {
      await api.put(`/users/${membershipModalUser.id}/membership`, {
        months_to_add: membershipMonths,
        membership_type: membershipType
      });
      toast.success(`✅ Membership updated for ${membershipModalUser.full_name}`);
      setShowMembershipModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update membership");
    } finally {
      setUpdatingMembership(false);
    }
  };

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

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/register", {
        email: newEmail,
        full_name: newName,
        password: newPassword,
        role: newRole,
      });
      toast.success(`✅ Successfully created ${newRole} account for ${newName}!`);
      setShowAddModal(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create staff account");
    } finally {
      setSubmitting(false);
    }
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
              Manage gym operations, staff provisioning, and attendance
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/kiosk")}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-1.5 shadow-lg shadow-brand-600/20"
            >
              📷 Open Kiosk Scanner
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              ➕ Provision Staff Account
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-dark-700 text-dark-200 rounded-lg hover:bg-dark-600 transition-colors text-sm"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-dark-700 text-dark-200 rounded-lg hover:bg-dark-600 transition-colors text-sm"
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
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Membership</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {users.map((user) => {
                  const hasMembership = user.membership_expires_at && new Date(user.membership_expires_at) > new Date();
                  return (
                  <tr
                    key={user.id}
                    className="hover:bg-dark-800/50 transition-colors"
                  >
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
                      {user.role === "CUSTOMER" ? (
                        <div>
                          {hasMembership ? (
                            <span className="text-brand-400 text-xs flex flex-col">
                              <span>Active ({user.membership_type || "Standard"})</span>
                              <span className="text-dark-400">Exp: {new Date(user.membership_expires_at!).toLocaleDateString()}</span>
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs">Inactive</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-dark-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark-400">
                      {user.role === "CUSTOMER" && (
                        <button 
                          onClick={() => {
                            setMembershipModalUser(user);
                            setShowMembershipModal(true);
                          }}
                          className="px-3 py-1 bg-dark-700 hover:bg-brand-600 hover:text-white transition-colors rounded text-xs"
                        >
                          Update Plan
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {/* Provision Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-card p-6 w-full max-w-md border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🛡️ Provision Staff Account
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-dark-400 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="Coach Sarah"
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="sarah@gmail.com"
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Assigned Staff Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-purple-500 transition-colors"
                  >
                    <option value="TRAINER">Personal Trainer (TRAINER)</option>
                    <option value="ADMIN">Gym Administrator (ADMIN)</option>
                    <option value="CUSTOMER">Gym Member (CUSTOMER)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-dark-700 text-dark-300 font-medium rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Update Membership Modal */}
        {showMembershipModal && membershipModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-card p-6 w-full max-w-md border-brand-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🎟️ Update Membership
                </h2>
                <button
                  onClick={() => setShowMembershipModal(false)}
                  className="text-dark-400 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-3 bg-dark-800 rounded-lg">
                <p className="text-sm text-dark-300">Member</p>
                <p className="text-white font-medium">{membershipModalUser.full_name}</p>
                <p className="text-xs text-dark-400 mt-1">
                  Current Expiry: {membershipModalUser.membership_expires_at 
                    ? new Date(membershipModalUser.membership_expires_at).toLocaleDateString()
                    : "None (Inactive)"}
                </p>
              </div>

              <form onSubmit={handleUpdateMembership} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Membership Plan
                  </label>
                  <select
                    value={membershipType}
                    onChange={(e) => setMembershipType(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-brand-500 transition-colors"
                  >
                    <option value="Standard">Standard Pass</option>
                    <option value="Premium">Premium Access</option>
                    <option value="VIP">VIP All-Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Extend By (Months)
                  </label>
                  <div className="flex gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMembershipMonths(m)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors border ${
                          membershipMonths === m
                            ? "bg-brand-600 border-brand-500 text-white"
                            : "bg-dark-800 border-dark-600 text-dark-300 hover:bg-dark-700"
                        }`}
                      >
                        +{m} Mo
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMembershipModal(false)}
                    className="flex-1 py-2 bg-dark-700 text-dark-300 font-medium rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingMembership}
                    className="flex-1 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {updatingMembership ? "Updating..." : "Update Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
