"use client";

/**
 * Native HTML5 Video QR Code Scanner component with live webcam feed.
 *
 * Uses navigator.mediaDevices.getUserMedia directly with HTML5 <video> player
 * and jsQR canvas frame scanning for 100% browser compatibility and instant feedback.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
}

export default function QRScanner({
  onScan,
  onError,
  width = 480,
  height = 360,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const lastScannedTokenRef = useRef<{ token: string; time: number } | null>(null);

  const stopWebcam = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsConnected(false);
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      const now = Date.now();
      // Debounce duplicate scans within 2.5 seconds
      if (
        !lastScannedTokenRef.current ||
        lastScannedTokenRef.current.token !== code.data ||
        now - lastScannedTokenRef.current.time > 2500
      ) {
        lastScannedTokenRef.current = { token: code.data, time: now };
        onScan(code.data);
      }
    }
  }, [onScan]);

  const initWebcam = useCallback(async () => {
    try {
      setCameraError(null);
      stopWebcam();

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });
      } catch (err) {
        console.warn("Retrying getUserMedia with basic video: true constraints...");
        // Basic fallback without strict constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = mediaStream;
      setIsConnected(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream; // Binds stream to video player
        await videoRef.current.play().catch(() => {});
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(processFrame, 200);
    } catch (error: any) {
      const msg = error?.message || error?.toString() || "Error accessing webcam";
      console.error("Error accessing webcam:", error);
      setIsConnected(false);
      setCameraError(
        "Chrome requires a page reload after changing camera permissions. Click the blue 'Reload' button at the top of your browser bar, or close apps like Zoom/FaceTime."
      );
      onError?.(msg);
    }
  }, [stopWebcam, processFrame, onError]);

  useEffect(() => {
    initWebcam();
    return () => {
      stopWebcam();
    };
  }, [initWebcam, stopWebcam]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Video Container */}
      <div
        style={{ width: "100%", maxWidth: width, height }}
        className="rounded-2xl overflow-hidden border-2 border-dark-600 bg-dark-900 flex items-center justify-center relative shadow-xl"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
        />

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Overlay Target Box */}
        {isConnected && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-56 h-56 border-2 border-brand-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse flex items-center justify-center">
              <div className="w-48 h-48 border border-dashed border-brand-300/40 rounded-xl" />
            </div>
            <p className="text-xs text-brand-300 bg-dark-900/80 px-3 py-1 rounded-full mt-3 font-medium backdrop-blur-sm border border-brand-500/30">
              Align QR Code inside target box
            </p>
          </div>
        )}
      </div>

      {/* Controls & Mirror Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMirrored((prev) => !prev)}
          className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-xs text-dark-200 border border-dark-600 rounded-lg transition-colors flex items-center gap-1.5"
        >
          🪞 {isMirrored ? "Unmirror View" : "Mirror View"}
        </button>
        <button
          type="button"
          onClick={initWebcam}
          className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-xs text-dark-200 border border-dark-600 rounded-lg transition-colors flex items-center gap-1.5"
        >
          🔄 Restart Camera
        </button>
      </div>

      {/* Camera Error Alert */}
      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm text-center max-w-md w-full">
          <p className="font-semibold mb-1">📷 Camera Status Notice</p>
          <p className="text-xs text-red-300 mb-3">{cameraError}</p>
          <button
            type="button"
            onClick={initWebcam}
            className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-lg text-xs font-medium transition-colors"
          >
            🔄 Re-initialize Camera Stream
          </button>
        </div>
      )}

      {/* Active Indicator */}
      {isConnected && (
        <div className="flex items-center gap-2 text-brand-400 text-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
          </span>
          Webcam Active & Scanning
        </div>
      )}
    </div>
  );
}
