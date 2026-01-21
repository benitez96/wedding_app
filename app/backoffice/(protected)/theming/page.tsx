import { Card, CardBody, CardHeader } from "@heroui/card";
import ThemingForm from "./ThemingForm";
import { getActiveTheme } from "@/app/actions/theme";

// Forzar renderizado dinámico
export const dynamic = "force-dynamic";

export default async function ThemingPage() {
  // Obtener theme activo desde el servidor
  const result = await getActiveTheme();
  const activeThemeId = result.data || "classic";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Theming</h1>
        <p className="text-gray-600 mt-2">
          Selecciona el tema visual de la aplicación
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Temas Disponibles</h3>
        </CardHeader>
        <CardBody>
          <ThemingForm initialThemeId={activeThemeId} />
        </CardBody>
      </Card>
    </div>
  );
}
