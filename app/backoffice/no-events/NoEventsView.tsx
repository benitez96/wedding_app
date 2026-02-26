"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { CalendarPlus, Sparkles } from "lucide-react";

export default function NoEventsView() {
  const router = useRouter();

  const handleCreateEvent = () => {
    // TODO: Implementar la creación de eventos cuando exista la funcionalidad
    // Por ahora, simplemente redirigir al backoffice
    router.push("/backoffice");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardBody className="text-center space-y-6 py-12 px-6">
          {/* Icono decorativo */}
          <div className="flex justify-center">
            <div className="relative">
              <CalendarPlus className="w-24 h-24 text-primary/20" />
              <Sparkles className="w-8 h-8 text-primary absolute -top-2 -right-2" />
            </div>
          </div>

          {/* Título y descripción */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              ¡Ups! Parece que no tienes ningún evento creado
            </h1>
            <p className="text-foreground/60 text-lg">
              Empieza creando tu primer evento para gestionar invitaciones,
              secciones y mucho más
            </p>
          </div>

          {/* Características rápidas */}
          <div className="grid gap-3 text-sm text-foreground/70 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Gestiona invitaciones y grupos de invitados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Configura secciones personalizadas para tu evento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Comparte links únicos con tus invitados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Escanea QR codes para check-in en tiempo real</span>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button
              color="primary"
              size="lg"
              startContent={<CalendarPlus className="w-5 h-5" />}
              onPress={handleCreateEvent}
            >
              Crear Mi Primer Evento
            </Button>
          </div>

          {/* Nota adicional */}
          <p className="text-xs text-foreground/50 max-w-md mx-auto">
            Si eliminaste tu evento por error, no te preocupes. Puedes crear uno
            nuevo en cualquier momento.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
