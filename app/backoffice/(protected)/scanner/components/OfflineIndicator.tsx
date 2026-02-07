"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@heroui/button";
import { hasPendingCheckIns, forceSyncCheckIns } from "@/lib/offline/syncQueue";

/**
 * Indicador de estado de conexión y sincronización
 *
 * Muestra:
 * - Estado de conexión (online/offline)
 * - Cantidad de check-ins pendientes de sincronización
 * - Botón manual para forzar sincronización
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasPending, setHasPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitorear estado de conexión
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Verificar check-ins pendientes
  useEffect(() => {
    const checkPending = async () => {
      const pending = await hasPendingCheckIns();
      setHasPending(pending);
    };

    checkPending();

    // Verificar cada 5 segundos
    const interval = setInterval(checkPending, 5000);

    return () => clearInterval(interval);
  }, []);

  // Sincronizar manualmente
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await forceSyncCheckIns();
      setHasPending(false);
    } catch (error) {
      console.error("[Offline] Error al sincronizar:", error);
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
