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
  startScanning: () => void;
  stopScanning: () => void;
}

/**
 * Hook para escanear QR usando BarcodeDetector API nativa
 *
 * Requisitos:
 * - Chrome/Edge en Android (nativo)
 * - Para iOS: necesitaría polyfill (no implementado)
 *
 * @example
 * ```tsx
 * const { videoRef, isScanning, startScanning } = useQRScanner({
 *   onScan: (tokenId) => {
 *     console.log('QR escaneado:', tokenId);
 *   }
 * });
 *
 * return <video ref={videoRef} />;
 * ```
 */
export function useQRScanner({
  onScan,
  onError,
  enabled = true,
}: UseQRScannerOptions): UseQRScannerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Referencias para cleanup
  const streamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  /**
   * Detener escaneo y liberar recursos
   * React Compiler optimiza esto automáticamente
   */
  const stopScanning = () => {
    // Cancelar animation frame
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Detener stream de video
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Limpiar video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  /**
   * Iniciar escaneo
   * React Compiler optimiza esto automáticamente
   */
  const startScanning = async () => {
    try {
      setError(null);

      // 1. Verificar soporte de BarcodeDetector
      if (!("BarcodeDetector" in window)) {
        throw new Error(
          "BarcodeDetector no soportado. Usa Chrome/Edge en Android.",
        );
      }

      // 2. Solicitar permiso de cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      // 3. Conectar stream al video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 4. Crear detector de QR
      const detector = new BarcodeDetector({
        formats: ["qr_code"],
      });
      detectorRef.current = detector;

      setIsScanning(true);

      // 5. Loop de detección
      const detect = async () => {
        if (
          !videoRef.current ||
          videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA
        ) {
          animationIdRef.current = requestAnimationFrame(detect);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);

          if (barcodes.length > 0) {
            const qrData = barcodes[0].rawValue;

            // Escaneo exitoso
            onScan(qrData);

            // Detener automáticamente después de escanear
            stopScanning();
            return;
          }
        } catch (err) {
          console.error("[Scanner] Error detectando código:", err);
        }

        animationIdRef.current = requestAnimationFrame(detect);
      };

      detect();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      setError(errorMessage);
      setHasPermission(false);
      setIsScanning(false);

      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  };

  /**
   * Efecto principal: iniciar/detener según enabled
   */
  useEffect(() => {
    if (enabled) {
      startScanning();
    } else {
      stopScanning();
    }

    // Cleanup al desmontar
    return () => {
      stopScanning();
    };
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
