"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@heroui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { hasPendingCheckIns, forceSyncCheckIns } from "@/lib/offline/syncQueue";
import { logError } from "@/lib/logger";

/**
 * Indicador de estado de conexión y sincronización
 *
 * Muestra:
 * - Estado de conexión (online/offline)
 * - Cantidad de check-ins pendientes de sincronización
 * - Botón manual para forzar sincronización
 */
export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [hasPending, setHasPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Verificar check-ins pendientes
  useEffect(() => {
    const checkPending = async () => {
      const pending = await hasPendingCheckIns();
      setHasPending(pending);
    };

    checkPending();

    const interval = setInterval(checkPending, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fallback: sincronizar automáticamente cuando vuelve la conexión.
  // Background Sync API no está disponible en todos los browsers
  // (Firefox, Safari), así que este effect garantiza la sincronización.
  useEffect(() => {
    if (!isOnline || isSyncing) return;

    let cancelled = false;

    const autoSync = async () => {
      const pending = await hasPendingCheckIns();
      if (!pending || cancelled) return;

      setIsSyncing(true);
      try {
        await forceSyncCheckIns();
        if (!cancelled) setHasPending(false);
      } catch (error) {
        logError("Offline auto-sync failed", error);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    autoSync();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  // Sincronizar manualmente
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await forceSyncCheckIns();
      setHasPending(false);
    } catch (error) {
      logError("Error al sincronizar check-ins", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // No mostrar nada si está online y no hay pendientes
  if (isOnline && !hasPending) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="text-success" size={24} />
            ) : (
              <WifiOff className="text-warning" size={24} />
            )}

            <div>
              <p className="font-medium">
                {isOnline ? "Conectado" : "Sin conexión"}
              </p>
              {hasPending && (
                <p className="text-sm text-default-500">
                  Hay check-ins pendientes de sincronización
                </p>
              )}
            </div>
          </div>

          {hasPending && isOnline && (
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={handleSync}
              isLoading={isSyncing}
              startContent={!isSyncing ? <RefreshCw size={16} /> : null}
            >
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
