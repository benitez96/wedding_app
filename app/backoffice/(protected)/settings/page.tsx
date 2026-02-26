import SettingsForm from "./SettingsForm";
import { getEventSettings } from "@/app/actions/settings";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Cargar configuraciones del evento en el servidor
  const { event, configurations } = await getEventSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuraciones</h1>
        <p className="text-foreground/60 mt-2">
          Configuración general de tu evento
        </p>
      </div>

      <SettingsForm event={event} initialConfigurations={configurations} />
    </div>
  );
}
