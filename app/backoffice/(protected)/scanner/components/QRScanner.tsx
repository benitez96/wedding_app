"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Camera, CameraOff, AlertCircle, Download } from "lucide-react";
import { useQRScanner } from "@/lib/qr/useQRScanner";
import { scanQR } from "@/app/actions/check-in/scanQR";
import { getInvitationsForCache } from "@/app/actions/check-in/getInvitationsForCache";
import { cacheInvitations } from "@/lib/offline/indexedDB";
import CheckInModal from "./CheckInModal";

interface QRScannerProps {
  eventId: string;
}

/**
 * Componente principal del scanner QR
 *
 * Usa BarcodeDetector API nativa para escanear códigos QR.
 * Cuando detecta un QR:
 * 1. Valida el token vía Server Action
 * 2. Muestra modal de confirmación con datos de la invitación
 * 3. Permite registrar el check-in
 */
export default function QRScanner({ eventId }: QRScannerProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [scannedInvitation, setScannedInvitation] = useState<{
    id: string;
    tokenId: string;
    guestName: string;
    guestNickname: string | null;
    maxGuests: number;
    checkInCount: number;
    remaining: number;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<{
    cached: number;
    total: number;
  } | null>(null);

  // Detectar modo offline
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  // Cargar invitaciones en cache al montar el componente
  useEffect(() => {
    const loadCache = async () => {
      setIsCaching(true);
      try {
        const result = await getInvitationsForCache({ eventId });

        if (result.success && result.invitations) {
          await cacheInvitations(result.invitations);
          setCacheStatus({
            cached: result.invitations.length,
            total: result.total || 0,
          });
        }
      } catch (error) {
        console.error("[Scanner] Error caching invitations:", error);
      } finally {
        setIsCaching(false);
      }
    };

    loadCache();
  }, [eventId]);

  // Hook del scanner
  const { videoRef, isScanning, hasPermission, error } = useQRScanner({
    enabled: isEnabled,
    onScan: async (tokenId) => {
      setIsValidating(true);
      setScanError(null);

      try {
        const result = await scanQR({ tokenId, eventId });

        if (result.success && result.invitation) {
          setScannedInvitation(result.invitation);
        } else {
          setScanError(result.error || "Error al validar el código QR");
          setIsEnabled(false);
        }
      } catch (err) {
        setScanError("Error al conectar con el servidor");
        setIsEnabled(false);
      } finally {
        setIsValidating(false);
      }
    },
    onError: (err) => {
      console.error("[Scanner] Error:", err);
      setScanError(err.message);
      setIsEnabled(false);
    },
  });

  const handleStartScanning = () => {
    setScanError(null);
    setIsEnabled(true);
  };

  const handleStopScanning = () => {
    setIsEnabled(false);
  };

  const handleCloseModal = () => {
    setScannedInvitation(null);
    // Reiniciar scanner después de cerrar modal
    setIsEnabled(true);
  };

  return (
    <>
      <Card>
        <CardBody className="p-0">
          {/* Video feed del scanner */}
          <div className="relative bg-black aspect-video overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
            />

            {/* Overlay cuando no está escaneando */}
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

            {/* Indicador de validación */}
            {isValidating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="bg-content1 rounded-lg p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Validando código...</p>
                </div>
              </div>
            )}

            {/* Marco de escaneo */}
            {isScanning && !isValidating && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-success rounded-2xl shadow-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-success rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-success rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-success rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-success rounded-br-2xl" />
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="p-4 space-y-4">
            {/* Estado del cache */}
            {isCaching && (
              <div className="bg-info-50 border border-info-200 rounded-lg p-3 flex items-center gap-2">
                <Download className="text-info-600 animate-pulse" size={20} />
                <p className="text-info-800 text-sm">
                  Cargando invitaciones para modo offline...
                </p>
              </div>
            )}

            {cacheStatus && !isCaching && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-center">
                <p className="text-success-800 text-sm">
                  ✓ {cacheStatus.cached} invitaciones listas para escaneo
                  offline
                </p>
              </div>
            )}

            {/* Error del scanner */}
            {(error || scanError) && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="text-danger-600" size={20} />
                <p className="text-danger-600 text-sm flex-1">
                  {error || scanError}
                </p>
              </div>
            )}

            {/* Indicador offline */}
            {isOffline && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-center">
                <p className="text-warning-800 text-sm font-medium">
                  ⚠️ Sin conexión - Los check-ins se sincronizarán cuando vuelva
                  internet
                </p>
              </div>
            )}

            {/* Botones de control */}
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

            {/* Instrucciones */}
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

      {/* Modal de check-in */}
      {scannedInvitation && (
        <CheckInModal
          isOpen={!!scannedInvitation}
          onClose={handleCloseModal}
          invitation={scannedInvitation}
          isOffline={isOffline}
        />
      )}
    </>
  );
}
