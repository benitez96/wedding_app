import AnimatedDividerCSS from "@/components/AnimatedDividerCSS";
import { DividerSectionSettings } from "./DividerSection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import clsx from "clsx";

interface DividerSectionProps {
  settings?: DividerSectionSettings;
}

export default function DividerSection({ settings }: DividerSectionProps) {
  const variant = settings?.variant || "heart";
  const delay = settings?.delay ?? 0.2;
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  const styles = getAlternateBgClasses(hasAlternateBg);

  return (
    <div className={clsx("relative", hasAlternateBg && styles.container)}>
      <AnimatedDividerCSS
        variant={variant}
        delay={delay}
        hasAlternateBg={hasAlternateBg}
      />
    </div>
  );
}
