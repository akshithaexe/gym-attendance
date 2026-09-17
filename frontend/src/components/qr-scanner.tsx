"use client";

/**
 * HTML5 webcam QR code scanner component.
 *
 * Uses the html5-qrcode library to access the camera and decode QR codes.
 * Calls onScan callback with the decoded text on successful scan.
 */

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
}

export default function QRScanner({
  onScan,
  onError,
  width = 400,
  height = 400,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const containerId = "qr-reader";

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            // Scan errors are frequent (no QR in frame), ignore silently
          }
        );
        setIsScanning(true);
        setCameraError(null);
      } catch (err: any) {
        const msg =
          err?.message || "Camera access denied or not available";
        setCameraError(msg);
        onError?.(msg);
      }
    };

    startScanner();

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={containerId}
        style={{ width, height }}
        className="rounded-2xl overflow-hidden border-2 border-dark-600"
      />

      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm text-center max-w-md">
          <p className="font-semibold mb-1">Camera Error</p>
          <p>{cameraError}</p>
        </div>
      )}

      {isScanning && (
        <div className="flex items-center gap-2 text-brand-400 text-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
          </span>
          Scanning for QR codes...
        </div>
      )}
    </div>
  );
}
