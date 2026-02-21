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
import { useQRScanner } from "@/lib/qr/useQRScanner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSSEStream } from "@/hooks/useSSEStream";
import { useCheckInStrategy } from "@/hooks/useCheckInStrategy";
import { scanQR } from "@/app/actions/check-in/scanQR";
import { getInvitationsForCache } from "@/app/actions/check-in/getInvitationsForCache";
import {
  cacheInvitations,
  getInvitationByToken,
  updateInvitationCache,
} from "@/lib/offline/indexedDB";
import { syncPendingCheckIns } from "@/lib/offline/syncQueue";
import CheckInModal from "./CheckInModal";
import type { CheckInStrategyConfig } from "@/types/check-in-strategy";

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

    // TODO: delete test comment
    console.log(
      `[🔄 Delta Sync] Fetching updates since cursor: ${deltaCursorRef.current}`,
    );

    try {
      const response = await fetch(
        `/api/events/${eventId}/invitations/delta?cursor=${encodeURIComponent(deltaCursorRef.current)}`,
      );

      if (!response.ok) {
        // TODO: delete test comment
        console.warn(
          `[⚠️ Delta Sync] Server responded with ${response.status}`,
        );
        return;
      }

      const data = await response.json();

      if (data.success && data.invitations?.length > 0) {
        // TODO: delete test comment
        console.log(
          `[📦 Delta Sync] Received ${data.invitations.length} updated invitations:`,
          data.invitations.map((inv: any) => ({
            id: inv.id,
            name: inv.guestName,
            checkInCount: inv.checkInCount,
          })),
        );

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
        const oldCursor = deltaCursorRef.current;
        deltaCursorRef.current = data.cursor;

        // TODO: delete test comment
        console.log(
          `[✅ Delta Sync] IDB cache updated. Cursor: ${oldCursor} → ${data.cursor}`,
        );
      } else {
        // TODO: delete test comment
        console.log(`[✓ Delta Sync] No new updates (cache is up-to-date)`);
      }
    } catch (error) {
      // TODO: delete test comment
      console.error("[❌ Delta Sync] Fetch error:", error);
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
        // TODO: delete test comment
        console.log(
          `[⏭️ SSE] Ignoring check-in event (our own check-in ${timeSinceOurCheckIn}ms ago)`,
        );
        return;
      }

      // This is from ANOTHER device → fetch delta
      // TODO: delete test comment
      console.log(
        "[⚡ SSE] Check-in event from another device → Triggering delta sync",
      );
      fetchDelta();
    },
    pollingIntervalMs: 15000, // 15s fallback polling
  });

  // Initial cache load + periodic outbound sync
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const initialLoad = async () => {
      setIsCaching(true);

      // TODO: delete test comment
      console.log(
        `[📥 Initial Cache] Loading invitations for event ${eventId}...`,
      );

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
          const cursorTime = new Date().toISOString();
          deltaCursorRef.current = cursorTime;

          // TODO: delete test comment
          console.log(
            `[✅ Initial Cache] Loaded ${result.invitations.length} invitations to IDB. Delta cursor initialized: ${cursorTime}`,
          );
        }
      } catch (error) {
        // TODO: delete test comment
        console.error("[❌ Initial Cache] Load error:", error);
      } finally {
        setIsCaching(false);
      }
    };

    initialLoad();

    // Periodic outbound sync (upload pending check-ins)
    if (isOnline) {
      // TODO: delete test comment
      console.log(
        `[⏰ Outbound Sync] Starting periodic sync every 30s (online mode)`,
      );

      intervalId = setInterval(() => {
        // TODO: delete test comment
        console.log(`[📤 Outbound Sync] Running periodic check-in upload...`);
        syncPendingCheckIns()
          .then(() => {
            // TODO: delete test comment
            console.log(`[✅ Outbound Sync] Completed successfully`);
          })
          .catch((err) => {
            // TODO: delete test comment
            console.error("[❌ Outbound Sync] Error:", err);
          });
      }, 30000); // 30s interval for outbound sync

      // Run initial sync after 2s (give time for cache to load, avoid race with interval)
      setTimeout(() => {
        // TODO: delete test comment
        console.log(
          `[📤 Outbound Sync] Running initial sync (2s after mount)...`,
        );
        syncPendingCheckIns()
          .then(() => {
            // TODO: delete test comment
            console.log(`[✅ Outbound Sync] Initial sync completed`);
          })
          .catch((err) => {
            // TODO: delete test comment
            console.error("[❌ Outbound Sync] Initial sync error:", err);
          });
      }, 2000);
    } else {
      // TODO: delete test comment
      console.log(`[⚠️ Outbound Sync] Offline mode - periodic sync disabled`);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        // TODO: delete test comment
        console.log(`[🛑 Outbound Sync] Stopped periodic sync`);
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
        // TODO: delete test comment
        console.log(
          `[🔍 QR Scan] Token detected: ${tokenId.substring(0, 8)}... | Strategy: ${strategyName}`,
        );

        // Use strategy to validate QR (IDB_FIRST, SERVER_FIRST, or HYBRID_SMART)
        const result = await validateQRWithStrategy(tokenId, eventId);

        if (result.success && result.invitation) {
          const inv = result.invitation;
          const remaining = inv.maxGuests - inv.checkInCount;

          // TODO: delete test comment
          console.log(
            `[✅ QR Scan] Validated via ${result.source} (${strategyName}) | Guest: ${inv.guestName} | Remaining: ${remaining}/${inv.maxGuests}`,
          );

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
          // TODO: delete test comment
          console.warn(
            `[❌ QR Scan] Validation failed via ${result.source}: ${result.error}`,
          );
          // TODO: i18n
          setScanError(result.error || "Error al validar el código QR");
          busyRef.current = false;
        }
      } catch (error) {
        // TODO: delete test comment
        console.error("[❌ QR Scan] Unexpected error:", error);
        // TODO: i18n
        setScanError("Error inesperado al validar el código QR");
        busyRef.current = false;
      } finally {
        setIsValidating(false);
      }
    },
    onError: (err) => {
      console.error("[Scanner] Error:", err);
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
      // TODO: delete test comment
      console.log(
        `[📝 Check-In] Tracked our check-in timestamp to avoid self-sync`,
      );
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
