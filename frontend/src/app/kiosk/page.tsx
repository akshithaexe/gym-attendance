"use client";

/**
 * Kiosk page — Front-desk webcam scanner + manual paste input.
 *
 * Used by gym staff to scan customer QR codes for check-in.
 * Also provides a text input for manual token pasting (fallback).
 */

import { useState, useCallback } from "react";
import QRScanner from "@/components/qr-scanner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { VerifyResponse } from "@/types";

export default function KioskPage() {
  const [lastCheckin, setLastCheckin] = useState<VerifyResponse | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [processing, setProcessing] = useState(false);

  const verifyToken = useCallback(async (token: string) => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await api.post("/attendance/verify", { token });
      const data: VerifyResponse = res.data;
      setLastCheckin(data);
      toast.success(`✅ ${data.full_name} - ${data.message}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Verification failed";
      toast.error(detail);
      setLastCheckin(null);
    } finally {
      setProcessing(false);
      setManualToken("");
    }
  }, [processing]);

  const handleScan = useCallback(
    (decodedText: string) => {
      verifyToken(decodedText);
    },
    [verifyToken]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      verifyToken(manualToken.trim());
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full bg-dark-900 border-b border-dark-700 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <div>
              <h1 className="text-white font-semibold">GymTrack Kiosk</h1>
              <p className="text-xs text-dark-400">Front Desk Scanner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
            </span>
            <span className="text-sm text-brand-400">Active</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex flex-col items-center gap-8">
        {/* Scanner */}
        <div className="glass-card p-6 w-full flex flex-col items-center">
          <h2 className="text-lg font-semibold text-white mb-4">
            📷 Scan QR Code
          </h2>
          <QRScanner onScan={handleScan} />
        </div>

        {/* Manual input fallback */}
        <div className="glass-card p-6 w-full">
          <h2 className="text-lg font-semibold text-white mb-4">
            ⌨️ Manual Token Entry
          </h2>
          <form
            onSubmit={handleManualSubmit}
            className="flex gap-3"
          >
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste QR token here..."
              className="flex-1 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder:text-dark-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            <button
              type="submit"
              disabled={processing || !manualToken.trim()}
              className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {processing ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>

        {/* Last check-in result */}
        {lastCheckin && (
          <div className="glass-card p-6 w-full border-brand-500/30 bg-brand-500/5">
            <h2 className="text-lg font-semibold text-brand-400 mb-3">
              ✅ Last Check-In
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-400">Name</p>
                <p className="text-white font-medium">{lastCheckin.full_name}</p>
              </div>
              <div>
                <p className="text-dark-400">Email</p>
                <p className="text-white font-medium">{lastCheckin.email}</p>
              </div>
              <div>
                <p className="text-dark-400">User ID</p>
                <p className="text-white font-medium">#{lastCheckin.user_id}</p>
              </div>
              <div>
                <p className="text-dark-400">Status</p>
                <p className="text-brand-400 font-medium">{lastCheckin.message}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
