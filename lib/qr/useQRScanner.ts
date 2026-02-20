"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseQRScannerOptions {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseQRScannerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  hasPermission: boolean | null;
  error: string | null;
  startScanning: () => void;
  stopScanning: () => void;
}

// Tipado mínimo del constructor (no dependemos del paquete npm)
type QrScannerCtor = new (
  video: HTMLVideoElement,
  onDecode: (result: any) => void,
  options?: {
    onDecodeError?: (error: any) => void;
    preferredCamera?: "environment" | "user" | string;
    maxScansPerSecond?: number;
    returnDetailedScanResult?: boolean;
  },
) => {
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
};

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  if (err && typeof err === "object" && "message" in err) {
    return new Error(String((err as any).message));
  }
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error("Error desconocido");
  }
}

export function useQRScanner({
  onScan,
  onError,
  enabled = true,
}: UseQRScannerOptions): UseQRScannerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);

  const scannerRef = useRef<InstanceType<QrScannerCtor> | null>(null);

  // Locks/flags (evita start/stop simultáneo y AbortError)
  const startingRef = useRef(false);
  const scanningRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    // Cortar cualquier “start” en curso
    startingRef.current = false;
    scanningRef.current = false;

    try {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      const video = videoRef.current;
      if (video) {
        const stream = video.srcObject as MediaStream | null;
        if (stream) stream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const startScanning = useCallback(async () => {
    // Evitar starts concurrentes (StrictMode / fast refresh)
    if (startingRef.current || scanningRef.current) return;

    const video = videoRef.current;
    if (!video) {
      const e = new Error("No se encontró el elemento <video>.");
      setError(e.message);
      onError?.(e);
      return;
    }

    startingRef.current = true;

    try {
      setError(null);

      // Si hay un scanner activo previo, limpiá antes (pero no siempre)
      if (scannerRef.current) stopScanning();

      // iOS/Safari: inline y sin audio
      video.setAttribute("playsinline", "true");
      video.muted = true;

      // Cargar el módulo ES desde /public SIN bundle (webpackIgnore)
      const mod = await import(
        /* webpackIgnore: true */ "/vendor/qr-scanner/qr-scanner.min.js"
      );

      const QrScanner = (mod as any).default as QrScannerCtor;

      const scanner = new QrScanner(
        video,
        (result: any) => {
          const data =
            typeof result === "string"
              ? result
              : String(result?.data ?? result?.rawValue ?? "");

          if (data) {
            onScan(data);
            stopScanning(); // mismo comportamiento: parar al primer scan
          }
        },
        {
          preferredCamera: "environment",
          maxScansPerSecond: 10,
          onDecodeError: () => {
            // opcional: no spamear consola
          },
        },
      );

      scannerRef.current = scanner;

      // Arranca cámara + decode loop
      await scanner.start();

      scanningRef.current = true;
      setHasPermission(true);
      setIsScanning(true);
    } catch (err: unknown) {
      const e = toError(err);

      // AbortError = típico cuando un play/start se interrumpe por stop/remount
      // En dev es común. No lo trates como fallo “real”.
      if ((e as any).name === "AbortError") {
        console.warn("[QR] AbortError (start interrumpido por un reload/stop).");
        return;
      }

      console.error("[QR] startScanning error:", err);

      setError(e.message);
      setHasPermission(false);
      setIsScanning(false);
      onError?.(e);

      stopScanning();
    } finally {
      startingRef.current = false;
    }
  }, [onScan, onError, stopScanning]);

  useEffect(() => {
    if (enabled) startScanning();
    else stopScanning();

    return () => stopScanning();
  }, [enabled, startScanning, stopScanning]);

  return {
    videoRef,
    isScanning,
    hasPermission,
    error,
    startScanning,
    stopScanning,
  };
}
