import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserEventContext } from "@/lib/event-context";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import QRScanner from "./components/QRScanner";
import OfflineIndicator from "./components/OfflineIndicator";
import PermissionRequired from "@/components/backoffice/PermissionRequired";
import { QrCode } from "lucide-react";

export const metadata = {
  title: "Scanner QR - Check-in",
  description: "Escanear códigos QR para registrar ingreso al evento",
};

export default async function ScannerPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/backoffice/login");
  }

  const eventContext = await getUserEventContext(session.user.id);

  if (!eventContext?.eventId) {
    redirect("/backoffice/dashboard");
  }

  // Verificar permisos (owner tiene acceso automático)
  const event = await prisma.event.findUnique({
    where: { id: eventContext.eventId },
    select: { ownerId: true },
  });

  const isOwner = event?.ownerId === session.user.id;

  if (!isOwner) {
    const member = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId: eventContext.eventId,
          userId: session.user.id,
        },
      },
    });

    if (
      !member ||
      !hasPermission(member.permissions, PERMISSIONS.CHECKIN_SCAN)
    ) {
      return (
        <PermissionRequired
          permission="CHECKIN_SCAN"
          message="Necesitas permisos de escaneo QR para acceder a esta sección. Contacta al administrador del evento."
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="text-primary" size={32} />
          <h1 className="text-3xl font-bold">Scanner QR</h1>
        </div>
        <p className="text-default-600">
          Escanea los códigos QR de las invitaciones para registrar el ingreso
          al evento
        </p>
      </div>

      {/* Indicador de estado offline */}
      <OfflineIndicator />

      {/* Scanner */}
      <QRScanner eventId={eventContext.eventId} />

      {/* Instrucciones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">¿Cómo funciona?</h2>
        <ol className="space-y-3 text-sm text-default-600">
          <li className="flex gap-3">
            <span className="font-bold text-primary">1.</span>
            <span>
              Activa el scanner presionando el botón "Activar Scanner"
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">2.</span>
            <span>
              Apunta la cámara al código QR de la invitación del invitado
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">3.</span>
            <span>
              Verifica los datos y confirma cuántos invitados ingresan
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">4.</span>
            <span>El sistema registra el check-in automáticamente</span>
          </li>
        </ol>

        <div className="mt-6 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
          <p className="text-info-800 dark:text-info-200 text-sm">
            <strong>💡 Modo offline:</strong> Si no hay conexión a internet, los
            check-ins se guardan localmente y se sincronizarán automáticamente
            cuando vuelva la conexión.
          </p>
        </div>
      </div>
    </div>
  );
}
