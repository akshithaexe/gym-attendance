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
  const radius = 54;
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
      {/* QR Code with countdown ring */}
      <div className="relative">
        {/* Circular countdown */}
        <svg
          className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)]"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={countdown <= 5 ? "#ef4444" : "#22c55e"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform="rotate(-90 60 60)"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl shadow-2xl">
          {loading ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : (
            <QRCodeSVG
              value={qrToken}
              size={192}
              level="M"
              includeMargin={false}
            />
          )}
        </div>
      </div>

      {/* Countdown text */}
      <div className="text-center">
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
