import DateSectionClient from "./DateSectionClient";
import { DateSectionSettings } from "./DateSection.metadata";
import { DecorationSVGs, DecorationPatterns } from "@/types/decoration";

interface DateSectionProps {
  settings?: DateSectionSettings;
}

export default function DateSection({ settings }: DateSectionProps) {
  // Usar fecha de settings, o fallback a env variable
  const targetDate = settings?.weddingDateTime
    ? new Date(settings.weddingDateTime)
    : new Date(
        parseInt(
          process.env.NEXT_PUBLIC_WEDDING_DATE?.substring(0, 4) || "2026",
        ),
        parseInt(process.env.NEXT_PUBLIC_WEDDING_DATE?.substring(4, 6) || "2") -
          1,
        parseInt(process.env.NEXT_PUBLIC_WEDDING_DATE?.substring(6, 8) || "14"),
        19,
        0,
        0,
      );

  const showCountdown = settings?.showCountdown ?? true;
  const titleText = settings?.titleText || "Te esperamos el día";

  // Extraer componentes de la fecha (server-side)
  const dayOfWeek = targetDate
    .toLocaleDateString("es-ES", { weekday: "long" })
    .toUpperCase();
  const dayNumber = targetDate.getDate().toString();
  const monthName = targetDate
    .toLocaleDateString("es-ES", { month: "long" })
    .toUpperCase();
  const yearNumber = targetDate.getFullYear().toString();

  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Decoraciones
  const decorationSvg = settings?.decorationSvg ?? DecorationSVGs.NONE;
  const decorationPattern =
    settings?.decorationPattern ?? DecorationPatterns.CORNERS;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  // Pasar datos pre-procesados al client component
  return (
    <DateSectionClient
      titleText={titleText}
      dayOfWeek={dayOfWeek}
      dayNumber={dayNumber}
      monthName={monthName}
      yearNumber={yearNumber}
      showCountdown={showCountdown}
      targetTimestamp={targetDate.getTime()}
      hasAlternateBg={hasAlternateBg}
      decorationSvg={decorationSvg}
      decorationPattern={decorationPattern}
      decorationOpacity={decorationOpacity}
      decorationSize={decorationSize}
    />
  );
}
