"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Camera,
  CameraOff,
  AlertCircle,
  Download,
  WifiOff,
  Activity,
} from "lucide-react";
import CheckInModal from "./CheckInModal";
import { useQRScanner } from "@/lib/qr/useQRScanner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSSEStream } from "@/hooks/useSSEStream";
import { useCheckInStrategy } from "@/hooks/useCheckInStrategy";
import { getInvitationsForCache } from "@/app/actions/check-in/getInvitationsForCache";
import {
  cacheInvitations,
  updateInvitationCache,
} from "@/lib/offline/indexedDB";
import { syncPendingCheckIns } from "@/lib/offline/syncQueue";
import type { CheckInStrategyConfig } from "@/types/check-in-strategy";
import { logError } from "@/lib/logger";

interface QRScannerProps {
  eventId: string;
  config: CheckInStrategyConfig;
}

interface ScannedInvitation {
  id: string;
  tokenId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  checkInCount: number;
  remaining: number;
}

/**
 * QR Scanner component with offline-first check-in
 *
 * Flow:
 * 1. User activates scanner (enabled = true)
 * 2. Camera starts and keeps running
 * 3. When QR is detected:
 *    - Online: validates via Server Action → shows modal
 *    - Offline: searches IndexedDB cache → shows modal
 * 4. While modal is open, ignores new detections (busyRef)
 * 5. On modal close → accepts new detections (camera keeps running)
 *
 * Sync strategy:
 * - Initial load: Full cache download from server
 * - Real-time sync: SSE events trigger delta fetch (cursor-based)
 * - Fallback: Polling if SSE unavailable
 * - Outbound: Background sync of pending check-ins
 */
export default function QRScanner({ eventId, config }: QRScannerProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [scannedInvitation, setScannedInvitation] =
    useState<ScannedInvitation | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<{
    cached: number;
    total: number;
  } | null>(null);

  // Ref to block scans while processing (NOT state, NO re-renders)
  const busyRef = useRef(false);

  // Cursor for delta sync (last updatedAt timestamp)
  const deltaCursorRef = useRef<string>(new Date(0).toISOString());

  // Online status
  const isOnline = useOnlineStatus();

  // Check-in strategy (loaded from DB + env vars)
  const {
    validateQR: validateQRWithStrategy,
    networkMetrics,
    strategyName,
  } = useCheckInStrategy(config);

  // Fetch delta updates from server (triggered by SSE or polling)
  const fetchDelta = async () => {
    if (!isOnline) return;

    try {
      const response = await fetch(
        `/api/events/${eventId}/invitations/delta?cursor=${encodeURIComponent(deltaCursorRef.current)}`,
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success && data.invitations?.length > 0) {
        // Update local cache with delta
        for (const inv of data.invitations) {
          await updateInvitationCache({
            id: inv.id,
            tokenId: inv.tokenId,
            guestName: inv.guestName,
            guestNickname: inv.guestNickname,
            maxGuests: inv.maxGuests,
            checkInCount: inv.checkInCount,
            lastSyncedAt: Date.now(),
          });
        }

        // Update cursor for next delta fetch
        deltaCursorRef.current = data.cursor;
      } else {
      }
    } catch {
      // Silent error - delta sync is best effort
    }
  };

  // Track when we last made a check-in (to avoid syncing our own changes)
  const lastCheckInTimestampRef = useRef<number>(0);

  // SSE stream for real-time sync
  const { status: sseStatus } = useSSEStream({
    eventId,
    onCheckInEvent: () => {
      const now = Date.now();
      const timeSinceOurCheckIn = now - lastCheckInTimestampRef.current;

      // If we just did a check-in in the last 5 seconds, ignore SSE
      // (this is OUR check-in, IDB is already updated optimistically)
      if (timeSinceOurCheckIn < 5000) {
        return;
      }

      // This is from ANOTHER device → fetch delta
      fetchDelta();
    },
    pollingIntervalMs: 15000, // 15s fallback polling
  });

  // Initial cache load + periodic outbound sync
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const initialLoad = async () => {
      setIsCaching(true);

      try {
        // Download full cache from server
        const result = await getInvitationsForCache({ eventId });

        if (result.success && result.invitations) {
          await cacheInvitations(result.invitations);
          setCacheStatus({
            cached: result.invitations.length,
            total: result.total || 0,
          });

          // Initialize delta cursor to now (future deltas only)
          deltaCursorRef.current = new Date().toISOString();
        }
      } catch {
        // Silent error - cache load is best effort
      } finally {
        setIsCaching(false);
      }
    };

    initialLoad();

    // Periodic outbound sync (upload pending check-ins)
    if (isOnline) {
      intervalId = setInterval(() => {
        syncPendingCheckIns().catch(() => {
          // Silent error - will retry on next interval
        });
      }, 30000); // 30s interval for outbound sync

      // Run initial sync after 2s (give time for cache to load, avoid race with interval)
      setTimeout(() => {
        syncPendingCheckIns().catch(() => {
          // Silent error - will retry on next interval
        });
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [eventId, isOnline]);

  // QR scanner hook — enabled is the ONLY thing that turns it on/off
  const { videoRef, isScanning, hasPermission, error } = useQRScanner({
    enabled: isEnabled,
    onScan: async (tokenId) => {
      // If already processing a QR, ignore
      if (busyRef.current) return;
      busyRef.current = true;

      setIsValidating(true);
      setScanError(null);

      try {
        // Use strategy to validate QR (IDB_FIRST, SERVER_FIRST, or HYBRID_SMART)
        const result = await validateQRWithStrategy(tokenId, eventId);

        if (result.success && result.invitation) {
          const inv = result.invitation;
          const remaining = inv.maxGuests - inv.checkInCount;

          setScannedInvitation({
            id: inv.id,
            tokenId: inv.tokenId,
            guestName: inv.guestName,
            guestNickname: inv.guestNickname,
            maxGuests: inv.maxGuests,
            checkInCount: inv.checkInCount,
            remaining,
          });
        } else {
          // TODO: i18n
          setScanError(result.error || "Error al validar el código QR");
          busyRef.current = false;
        }
      } catch {
        // TODO: i18n
        setScanError("Error inesperado al validar el código QR");
        busyRef.current = false;
      } finally {
        setIsValidating(false);
      }
    },
    onError: (err) => {
      logError("Scanner error", err);
      setScanError(err.message);
    },
  });

  const handleStartScanning = () => {
    setScanError(null);
    busyRef.current = false;
    setIsEnabled(true);
  };

  const handleStopScanning = () => {
    setIsEnabled(false);
  };

  const handleCloseModal = (checkInWasMade?: boolean) => {
    // If a check-in was made, track timestamp to avoid syncing our own event
    if (checkInWasMade) {
      lastCheckInTimestampRef.current = Date.now();
    }

    setScannedInvitation(null);
    // Release the lock → scanner keeps running, accepts new detections
    busyRef.current = false;
  };

  return (
    <>
      <Card>
        <CardBody className="p-0">
          {/* Scanner video feed */}
          <div className="relative bg-black aspect-video overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
            />

            {/* Overlay when not scanning */}
            {/* TODO: i18n */}
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center space-y-4">
                  <CameraOff className="mx-auto text-default-400" size={48} />
                  <p className="text-default-300">
                    {hasPermission === false
                      ? "Permiso de cámara denegado"
                      : "Presiona el botón para activar el scanner"}
                  </p>
                </div>
              </div>
            )}

            {/* Validation indicator */}
            {/* TODO: i18n */}
            {isValidating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="bg-content1 rounded-lg p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Validando código...</p>
                </div>
              </div>
            )}

            {/* Overlay + Scan frame */}
            {isScanning && !isValidating && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Dark overlay with central cutout via clip-path */}
                <div
                  className="absolute inset-0 bg-black/50"
                  style={{
                    clipPath:
                      "polygon(0% 0%, 0% 100%, calc(50% - 128px) 100%, calc(50% - 128px) calc(50% - 128px), calc(50% + 128px) calc(50% - 128px), calc(50% + 128px) calc(50% + 128px), calc(50% - 128px) calc(50% + 128px), calc(50% - 128px) 100%, 100% 100%, 100% 0%)",
                  }}
                />
                {/* White corners */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4">
            {/* Cache status */}
            {/* TODO: i18n */}
            {isCaching && (
              <div className="bg-info-50 border border-info-200 rounded-lg p-3 flex items-center gap-2">
                <Download className="text-info-600 animate-pulse" size={20} />
                <p className="text-info-800 text-sm">
                  Cargando invitaciones para modo offline...
                </p>
              </div>
            )}

            {/* TODO: i18n */}
            {cacheStatus && !isCaching && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-center">
                <p className="text-success-800 text-sm">
                  {cacheStatus.cached} invitaciones listas para escaneo offline
                </p>
              </div>
            )}

            {/* Scanner error */}
            {(error || scanError) && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="text-danger-600" size={20} />
                <p className="text-danger-600 text-sm flex-1">
                  {error || scanError}
                </p>
              </div>
            )}

            {/* Offline indicator */}
            {/* TODO: i18n */}
            {!isOnline && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center gap-2">
                <WifiOff className="text-warning-600" size={18} />
                <p className="text-warning-800 text-sm font-medium">
                  Sin conexión — Los check-ins se sincronizarán cuando vuelva
                  internet
                </p>
              </div>
            )}

            {/* SSE sync status (when online) */}
            {/* TODO: i18n */}
            {isOnline && sseStatus === "connected" && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-3 flex items-center gap-2">
                <Activity className="text-success-600" size={18} />
                <div className="flex-1">
                  <p className="text-success-800 text-sm font-medium">
                    Sincronización en tiempo real activa
                  </p>
                  <p className="text-success-700 text-xs">
                    Estrategia: {strategyName} • Latencia:{" "}
                    {networkMetrics.latencyMs}ms
                  </p>
                </div>
              </div>
            )}

            {/* TODO: i18n */}
            {isOnline && sseStatus === "polling" && (
              <div className="bg-info-50 border border-info-200 rounded-lg p-3 flex items-center gap-2">
                <Activity className="text-info-600" size={18} />
                <div className="flex-1">
                  <p className="text-info-800 text-sm font-medium">
                    Modo polling activo (SSE no disponible)
                  </p>
                  <p className="text-info-700 text-xs">
                    Estrategia: {strategyName} • Latencia:{" "}
                    {networkMetrics.latencyMs}ms
                  </p>
                </div>
              </div>
            )}

            {/* Control buttons */}
            {/* TODO: i18n */}
            <div className="flex gap-2">
              {!isScanning ? (
                <Button
                  color="primary"
                  className="flex-1"
                  startContent={<Camera size={20} />}
                  onPress={handleStartScanning}
                  size="lg"
                >
                  Activar Scanner
                </Button>
              ) : (
                <Button
                  color="danger"
                  variant="flat"
                  className="flex-1"
                  startContent={<CameraOff size={20} />}
                  onPress={handleStopScanning}
                  size="lg"
                >
                  Detener Scanner
                </Button>
              )}
            </div>

            {/* Instructions */}
            {/* TODO: i18n */}
            {isScanning && (
              <div className="text-center">
                <p className="text-sm text-default-500">
                  Apunta la cámara al código QR de la invitación
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Check-in modal */}
      {scannedInvitation && (
        <CheckInModal
          isOpen={!!scannedInvitation}
          onClose={handleCloseModal}
          invitation={scannedInvitation}
          isOnline={isOnline}
        />
      )}
    </>
  );
}
