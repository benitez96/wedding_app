import { Card, CardBody } from "@heroui/card";
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
          Elegí el tema visual de tu invitación
        </p>
      </div>

      <Card>
        <CardBody className="p-4 sm:p-6">
          <ThemingForm
            initialThemeId={activeThemeId}
            initialCustomColors={customColors}
          />
        </CardBody>
      </Card>
    </div>
  );
}
