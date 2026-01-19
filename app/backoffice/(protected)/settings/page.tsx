import { Card, CardBody, CardHeader } from "@heroui/card";
import SettingsForm from "./SettingsForm";
import { getConfigurations } from "@/app/actions/settings";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Cargar configuraciones en el servidor
  const configurations = await getConfigurations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuraciones</h1>
        <p className="text-gray-600 mt-2">Configurar variables del sitio web</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Variables de Configuración</h3>
        </CardHeader>
        <CardBody>
          <SettingsForm initialConfigurations={configurations} />
        </CardBody>
      </Card>
    </div>
  );
}
