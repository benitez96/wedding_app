import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserEventContext } from "@/lib/event-context-prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import PermissionRequired from "@/components/backoffice/PermissionRequired";
import { ClipboardList, AlertTriangle, Users, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Check-ins - Backoffice",
  description: "Lista de check-ins registrados",
};

export default async function CheckInsPage() {
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
      !hasPermission(member.permissions, PERMISSIONS.CHECKIN_VIEW)
    ) {
      return (
        <PermissionRequired
          permission="CHECKIN_VIEW"
          message="Necesitas permisos para ver check-ins. Contacta al administrador del evento."
        />
      );
    }
  }

  // Obtener datos
  const [totalInvitations, checkIns, stats] = await Promise.all([
    prisma.invitation.count({
      where: { eventId: eventContext.eventId },
    }),

    prisma.checkIn.findMany({
      where: {
        invitation: {
          eventId: eventContext.eventId,
        },
        deletedAt: null,
      },
      include: {
        invitation: {
          select: {
            guestName: true,
            guestNickname: true,
            maxGuests: true,
          },
        },
        checkedByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),

    prisma.checkIn.aggregate({
      where: {
        invitation: {
          eventId: eventContext.eventId,
        },
        deletedAt: null,
      },
      _sum: {
        guestsCount: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const totalCheckIns = stats._count.id;
  const totalGuests = stats._sum.guestsCount || 0;
  const conflictsCount = checkIns.filter((c) => c.exceededCapacity).length;

  const totalCapacity = await prisma.invitation.aggregate({
    where: { eventId: eventContext.eventId },
    _sum: {
      maxGuests: true,
    },
  });

  const maxCapacity = totalCapacity._sum.maxGuests || 0;
  const percentageOccupied =
    maxCapacity > 0 ? (totalGuests / maxCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="text-primary" size={32} />
          <h1 className="text-3xl font-bold">Check-ins</h1>
        </div>
        <p className="text-default-600">Registro de ingresos al evento</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <Users className="mx-auto mb-2 text-primary" size={32} />
            <p className="text-3xl font-bold">{totalGuests}</p>
            <p className="text-sm text-default-500">Invitados ingresados</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <CheckCircle className="mx-auto mb-2 text-success" size={32} />
            <p className="text-3xl font-bold">{totalCheckIns}</p>
            <p className="text-sm text-default-500">Check-ins realizados</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="mx-auto mb-2 text-info-600 text-2xl font-bold">
              {percentageOccupied.toFixed(0)}%
            </div>
            <p className="text-sm text-default-500">
              Ocupación ({totalGuests}/{maxCapacity})
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <AlertTriangle
              className={`mx-auto mb-2 ${conflictsCount > 0 ? "text-warning" : "text-default-300"}`}
              size={32}
            />
            <p className="text-3xl font-bold">{conflictsCount}</p>
            <p className="text-sm text-default-500">Excesos de capacidad</p>
          </CardBody>
        </Card>
      </div>

      {/* Lista de check-ins */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Últimos Check-ins</h2>
        </CardHeader>
        <CardBody>
          {checkIns.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList
                className="mx-auto text-default-300 mb-4"
                size={48}
              />
              <p className="text-default-500">
                Aún no hay check-ins registrados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {checkIns.map((checkIn) => {
                const displayName =
                  checkIn.invitation.guestNickname ||
                  checkIn.invitation.guestName;

                return (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-4 bg-content2 rounded-lg hover:bg-content3 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{displayName}</p>
                      <p className="text-sm text-default-500">
                        {checkIn.guestsCount}{" "}
                        {checkIn.guestsCount === 1 ? "invitado" : "invitados"} •
                        Registrado por {checkIn.checkedByUser.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {checkIn.exceededCapacity && (
                        <Chip color="warning" size="sm" variant="flat">
                          <div className="flex items-center gap-1">
                            <AlertTriangle size={14} />
                            Excedió capacidad
                          </div>
                        </Chip>
                      )}

                      {!checkIn.syncedAt && (
                        <Chip color="default" size="sm" variant="flat">
                          Pendiente sync
                        </Chip>
                      )}

                      <p className="text-sm text-default-400 tabular-nums">
                        {new Date(checkIn.createdAt).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
