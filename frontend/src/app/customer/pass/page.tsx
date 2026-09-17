"use client";

/**
 * Customer QR Pass page.
 *
 * Displays a 30-second rotating QR code pass that the customer
 * shows at the front-desk kiosk for check-in.
 * Includes a countdown timer and a button to copy the raw token.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";
import Navbar from "@/components/navbar";
import QRDisplay from "@/components/qr-display";

export default function CustomerPassPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "CUSTOMER") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Your Gym Pass</h1>
          <p className="text-dark-400 mt-2">
            Show this QR code at the front desk to check in
          </p>
        </div>

        {/* QR Pass Card */}
        <div className="glass-card p-8 flex flex-col items-center">
          <QRDisplay refreshInterval={30} />
        </div>

        {/* Instructions */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
            How it works
          </h3>
          <ul className="space-y-2 text-sm text-dark-400">
            <li className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">●</span>
              A new QR code is generated every 30 seconds
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">●</span>
              Each code can only be used once (replay-attack prevention)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">●</span>
              The front desk scanner will verify your identity automatically
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
