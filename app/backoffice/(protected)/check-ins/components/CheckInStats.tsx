"use client";

import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { TrendingUp, Clock } from "lucide-react";

interface CheckInStatsProps {
  totalInvitations: number;
  invitationsWithCheckIns: number;
  totalGuests: number;
  maxCapacity: number;
  avgGuestsPerInvitation: number;
  checkInsLast24h: number;
}

/**
 * Estadísticas avanzadas de check-ins
 *
 * Muestra métricas adicionales como:
 * - Tasa de llegada
 * - Promedio de invitados por invitación
 * - Check-ins recientes
 */
export default function CheckInStats({
  totalInvitations,
  invitationsWithCheckIns,
  totalGuests,
  maxCapacity,
  avgGuestsPerInvitation,
  checkInsLast24h,
}: CheckInStatsProps) {
  const arrivalRate =
    totalInvitations > 0
      ? (invitationsWithCheckIns / totalInvitations) * 100
      : 0;

  const occupancyRate = maxCapacity > 0 ? (totalGuests / maxCapacity) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tasa de llegada */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-default-500">Tasa de Llegada</p>
              <p className="text-2xl font-bold">{arrivalRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="text-success" size={32} />
          </div>

          <div className="space-y-2">
            <Progress
              value={arrivalRate}
              color={
                arrivalRate > 75
                  ? "success"
                  : arrivalRate > 50
                    ? "warning"
                    : "default"
              }
              className="max-w-full"
            />
            <p className="text-xs text-default-400">
              {invitationsWithCheckIns} de {totalInvitations} invitaciones han
              llegado
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Ocupación */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-default-500">Ocupación del Evento</p>
              <p className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</p>
            </div>
            <div className="text-3xl">{occupancyRate > 90 ? "🔥" : "👥"}</div>
          </div>

          <div className="space-y-2">
            <Progress
              value={occupancyRate}
              color={
                occupancyRate > 90
                  ? "danger"
                  : occupancyRate > 70
                    ? "warning"
                    : "success"
              }
              className="max-w-full"
            />
            <p className="text-xs text-default-400">
              {totalGuests} de {maxCapacity} personas máximo
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Promedio de invitados */}
      <Card>
        <CardBody>
          <p className="text-sm text-default-500 mb-2">
            Promedio de Invitados por Grupo
          </p>
          <p className="text-3xl font-bold">
            {avgGuestsPerInvitation.toFixed(1)}
          </p>
          <p className="text-xs text-default-400 mt-2">
            {avgGuestsPerInvitation > 1
              ? "La mayoría llega en grupo"
              : "La mayoría llega solo"}
          </p>
        </CardBody>
      </Card>

      {/* Últimas 24 horas */}
      <Card>
        <CardBody className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="text-info" size={20} />
            <p className="text-sm text-default-500">Últimas 24 horas</p>
          </div>
          <p className="text-3xl font-bold">{checkInsLast24h}</p>
          <p className="text-xs text-default-400">
            {checkInsLast24h === 0
              ? "Sin check-ins recientes"
              : `${checkInsLast24h} ${checkInsLast24h === 1 ? "check-in" : "check-ins"}`}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
