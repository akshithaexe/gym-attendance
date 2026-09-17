"use client";

/**
 * Reusable attendance history table.
 *
 * Supports sorting by check-in time and displays user info,
 * check-in method (QR vs manual), and timestamps.
 */

import { AttendanceRecord } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showUserInfo?: boolean;
  loading?: boolean;
}

export default function AttendanceTable({
  records,
  showUserInfo = true,
  loading = false,
}: AttendanceTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-dark-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-dark-400">
        <p className="text-lg">No attendance records found</p>
        <p className="text-sm mt-1">Records will appear here once check-ins are logged.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-dark-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-dark-800 text-dark-300 text-left">
            <th className="px-4 py-3 font-medium">#</th>
            {showUserInfo && (
              <>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </>
            )}
            <th className="px-4 py-3 font-medium">Check In</th>
            <th className="px-4 py-3 font-medium">Check Out</th>
            <th className="px-4 py-3 font-medium">Method</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700">
          {records.map((record, index) => (
            <tr
              key={record.id}
              className="hover:bg-dark-800/50 transition-colors"
            >
              <td className="px-4 py-3 text-dark-400">{index + 1}</td>
              {showUserInfo && (
                <>
                  <td className="px-4 py-3 text-white font-medium">
                    {record.user_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-dark-300">
                    {record.user_email || "—"}
                  </td>
                </>
              )}
              <td className="px-4 py-3 text-dark-200">
                {formatDateTime(record.check_in)}
              </td>
              <td className="px-4 py-3 text-dark-300">
                {record.check_out
                  ? formatDateTime(record.check_out)
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.marked_by === "qr_scan"
                      ? "bg-brand-500/10 text-brand-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {record.marked_by === "qr_scan" ? "📱 QR Scan" : "✍️ Manual"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
