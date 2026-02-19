import { Card, CardBody, CardHeader } from "@heroui/card";
import ThemingForm from "./ThemingForm";
import { getActiveTheme, getCustomThemeColors } from "@/app/actions/theme";
import { DEFAULT_CUSTOM_THEME_COLORS, THEME_IDS } from "@/types/theme";
import type { ThemeId } from "@/types/theme";

// Force dynamic rendering — reads session and event data per request
export const dynamic = "force-dynamic";

export default async function ThemingPage() {
  // Parallel fetch — active theme + custom colors
  const [activeThemeResult, customColorsResult] = await Promise.all([
    getActiveTheme(),
    getCustomThemeColors(),
  ]);

  const activeThemeId: ThemeId = activeThemeResult.data ?? THEME_IDS.CLASSIC;
  const customColors = customColorsResult.data ?? DEFAULT_CUSTOM_THEME_COLORS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Theming</h1>
        <p className="text-foreground/60 mt-2">
          Selecciona el tema visual de la aplicación
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Temas Disponibles</h3>
        </CardHeader>
        <CardBody>
          <ThemingForm
            initialThemeId={activeThemeId}
            initialCustomColors={customColors}
          />
        </CardBody>
      </Card>
    </div>
  );
}
