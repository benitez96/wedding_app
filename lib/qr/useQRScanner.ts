"use client";

import { useEffect, useRef, useState } from "react";

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

  // Refs para callbacks → evita recrear el scanner cuando cambian
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UN SOLO effect. Se ejecuta cuando cambia `enabled`. Nada más.
  useEffect(() => {
    if (!enabled) return;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const start = async () => {
      try {
        setError(null);

        // iOS/Safari: inline y sin audio
        video.setAttribute("playsinline", "true");
        video.muted = true;

        const mod = await import(
          /* webpackIgnore: true */ "/vendor/qr-scanner/qr-scanner.min.js"
        );

        // Si el effect se limpió mientras cargaba el módulo, no seguir
        if (cancelled) return;

        const QrScanner = (mod as any).default as QrScannerCtor;

        const scanner = new QrScanner(
          video,
          (result: any) => {
            const data =
              typeof result === "string"
                ? result
                : String(result?.data ?? result?.rawValue ?? "");

            if (data) {
              onScanRef.current(data);
            }
          },
          {
            preferredCamera: "environment",
            maxScansPerSecond: 10,
            onDecodeError: () => {},
          },
        );

        if (cancelled) {
          scanner.destroy();
          return;
        }

        scannerRef.current = scanner;
        await scanner.start();

        if (cancelled) {
          scanner.stop();
          scanner.destroy();
          scannerRef.current = null;
          return;
        }

        setHasPermission(true);
        setIsScanning(true);
      } catch (err: unknown) {
        if (cancelled) return;

        const e = toError(err);

        if ((e as any).name === "AbortError") {
          console.warn("[QR] AbortError (start interrumpido).");
          return;
        }

        console.error("[QR] startScanning error:", err);
        setError(e.message);
        setHasPermission(false);
        setIsScanning(false);
        onErrorRef.current?.(e);
      }
    };

    start();

    // Cleanup: destruir scanner y liberar cámara
    return () => {
      cancelled = true;

      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      if (video) {
        const stream = video.srcObject as MediaStream | null;
        if (stream) stream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }

      setIsScanning(false);
    };
  }, [enabled]);

  return { videoRef, isScanning, hasPermission, error };
}
