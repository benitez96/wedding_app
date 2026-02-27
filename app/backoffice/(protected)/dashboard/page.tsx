import { Card, CardBody, CardHeader } from "@heroui/card";
import { Users, Mail, XCircle, UserCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ExportConfirmedGuestsButton from "@/components/ExportConfirmedGuestsButton";
import { verifyUserAuth } from "@/lib/server-auth";
import { getUserEventContext } from "@/lib/event-context-prisma";
import { logError } from "@/lib/logger";

// Forzar renderizado dinámico
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDashboardStats(eventId: string) {
  try {
    const eventFilter = { eventId };

    const [
      totalInvitations,
      respondedInvitations,
      attendingInvitations,
      notAttendingInvitations,
      totalMaxGuests,
      totalConfirmedGuests,
    ] = await Promise.all([
      prisma.invitation.count({ where: eventFilter }),
      prisma.invitation.count({
        where: { ...eventFilter, hasResponded: true },
      }),
      prisma.invitation.count({ where: { ...eventFilter, isAttending: true } }),
      prisma.invitation.count({
        where: { ...eventFilter, isAttending: false },
      }),
      prisma.invitation.aggregate({
        where: eventFilter,
        _sum: { maxGuests: true },
      }),
      prisma.invitation.aggregate({
        where: { ...eventFilter, isAttending: true },
        _sum: { guestCount: true },
      }),
    ]);

    return {
      totalInvitations,
      respondedInvitations,
      attendingInvitations,
      notAttendingInvitations,
      totalMaxGuests: totalMaxGuests._sum.maxGuests || 0,
      totalConfirmedGuests: totalConfirmedGuests._sum.guestCount || 0,
      responseRate:
        totalInvitations > 0
          ? Math.round((respondedInvitations / totalInvitations) * 100)
          : 0,
    };
  } catch (error) {
    logError("getDashboardStats", error);
    // Return default values if database is not available
    return {
      totalInvitations: 0,
      respondedInvitations: 0,
      attendingInvitations: 0,
      notAttendingInvitations: 0,
      totalMaxGuests: 0,
      totalConfirmedGuests: 0,
      responseRate: 0,
    };
  }
}

export default async function Backoffice() {
  // Verificar autenticación
  const authResult = await verifyUserAuth();
  if (!authResult.success || !authResult.user) {
    redirect("/login");
  }

  // Obtener contexto de evento
  const eventContext = await getUserEventContext(authResult.user.id);
  if (!eventContext) {
    redirect("/backoffice/events/new");
  }

  const stats = await getDashboardStats(eventContext.eventId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground/60 mt-2">
          Resumen de invitaciones y respuestas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Invitaciones */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  Total Invitaciones
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalInvitations}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Invitaciones Respondidas */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  Han Respondido
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.respondedInvitations}
                </p>
                <p className="text-sm text-foreground/50">
                  {stats.responseRate}% de respuesta
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total de Invitados */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  Total Invitados
                </p>
                <p className="text-2xl font-bold text-success">
                  {stats.totalConfirmedGuests}
                </p>
                <p className="text-sm text-foreground/50">
                  de {stats.totalMaxGuests} máx.
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* No Asistirán */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  No Asistirán
                </p>
                <p className="text-2xl font-bold text-danger">
                  {stats.notAttendingInvitations}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/backoffice/invitations"
              className="p-4 border border-divider rounded-lg hover:bg-content2 transition-colors"
            >
              <h4 className="font-medium text-foreground">
                Gestionar Invitaciones
              </h4>
              <p className="text-sm text-foreground/60 mt-1">
                Ver y editar todas las invitaciones
              </p>
            </Link>

            <div className="p-4 border border-divider rounded-lg">
              <h4 className="font-medium text-foreground mb-2">
                Exportar Confirmados
              </h4>
              <p className="text-sm text-foreground/60 mb-3">
                Descargar Excel con invitados confirmados
              </p>
              <ExportConfirmedGuestsButton />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
