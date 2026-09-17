"use client";

/**
 * Dynamic SVG QR renderer with circular countdown timer.
 *
 * Displays a QR code that auto-refreshes every 30 seconds
 * with a new short-lived JWT token.
 */

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";

interface QRDisplayProps {
  refreshInterval?: number; // seconds (default 30)
}

export default function QRDisplay({ refreshInterval = 30 }: QRDisplayProps) {
  const [qrToken, setQrToken] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(refreshInterval);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/attendance/qr-token");
      setQrToken(res.data.qr_token);
      setCountdown(refreshInterval);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate QR pass");
    } finally {
      setLoading(false);
    }
  }, [refreshInterval]);

  // Fetch on mount and set up auto-refresh
  useEffect(() => {
    fetchToken();
    const interval = setInterval(fetchToken, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchToken, refreshInterval]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : refreshInterval));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  // SVG circular progress
  const radius = 115;
  const circumference = 2 * Math.PI * radius;
  const progress = (countdown / refreshInterval) * circumference;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrToken);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="text-red-400 text-center">{error}</div>
        <button
          onClick={fetchToken}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR Code with fixed-size countdown ring */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Fixed 260px SVG countdown ring */}
        <svg
          className="absolute w-[260px] h-[260px] pointer-events-none"
          viewBox="0 0 260 260"
        >
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke={countdown <= 5 ? "#ef4444" : "#22c55e"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform="rotate(-90 130 130)"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* QR Code Card */}
        <div className="bg-white p-3.5 rounded-2xl shadow-2xl relative z-10">
          {loading ? (
            <div className="w-40 h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : (
            <QRCodeSVG
              value={qrToken}
              size={160}
              level="M"
              includeMargin={false}
            />
          )}
        </div>
      </div>

      {/* Countdown text */}
      <div className="text-center mt-2">
        <p className="text-3xl font-bold text-white tabular-nums">
          {countdown}s
        </p>
        <p className="text-sm text-dark-400 mt-1">until next refresh</p>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        disabled={!qrToken}
        className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-200 rounded-lg hover:bg-dark-600 transition-colors text-sm disabled:opacity-50"
      >
        📋 Copy Token
      </button>
    </div>
  );
}
