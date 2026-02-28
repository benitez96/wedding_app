import clsx from "clsx";
import { DividerSectionSettings } from "./DividerSection.metadata";
import AnimatedDividerCSS from "@/components/AnimatedDividerCSS";
import { getAlternateBgClasses } from "@/lib/section-styles";

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
