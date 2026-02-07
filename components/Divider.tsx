import { Heart, Sparkles } from "lucide-react";
import clsx from "clsx";

interface DividerProps {
  variant?: "simple" | "heart" | "ornate" | "elegant";
  className?: string;
  hasAlternateBg?: boolean;
}

export default function Divider({
  variant = "heart",
  className = "",
  hasAlternateBg = false,
}: DividerProps) {
  // Colores adaptativos según el background
  const iconColor = hasAlternateBg ? "text-primary-foreground" : "text-primary";
  const accentColor = hasAlternateBg
    ? "text-primary-foreground"
    : "text-accent";
  const lineOpacity = hasAlternateBg ? "30" : "25";
  const dotColor = hasAlternateBg ? "bg-primary-foreground" : "bg-primary";

  if (variant === "simple") {
    return (
      <div className={clsx("w-full flex justify-center py-2", className)}>
        <div
          className={clsx(
            "w-32 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/30" : "via-foreground/30",
          )}
        />
      </div>
    );
  }

  if (variant === "heart") {
    return (
      <div
        className={clsx(
          "w-full flex justify-center items-center py-2",
          className,
        )}
      >
        <div
          className={clsx(
            "w-16 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg
              ? `via-primary-foreground/${lineOpacity}`
              : `via-foreground/${lineOpacity}`,
          )}
        />
        <Heart
          className={clsx("w-5 h-5 mx-4", iconColor)}
          fill="currentColor"
        />
        <div
          className={clsx(
            "w-16 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg
              ? `via-primary-foreground/${lineOpacity}`
              : `via-foreground/${lineOpacity}`,
          )}
        />
      </div>
    );
  }

  if (variant === "ornate") {
    return (
      <div
        className={clsx(
          "w-full flex justify-center items-center py-2",
          className,
        )}
      >
        <div
          className={clsx(
            "w-12 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/40" : "via-foreground/40",
          )}
        />
        <div className={clsx("w-1.5 h-1.5 rounded-full mx-2", dotColor)} />
        <div
          className={clsx(
            "w-6 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/40" : "via-foreground/40",
          )}
        />
        <Heart
          className={clsx("w-4 h-4 mx-3", iconColor)}
          fill="currentColor"
        />
        <div
          className={clsx(
            "w-6 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/40" : "via-foreground/40",
          )}
        />
        <div className={clsx("w-1.5 h-1.5 rounded-full mx-2", dotColor)} />
        <div
          className={clsx(
            "w-12 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/40" : "via-foreground/40",
          )}
        />
      </div>
    );
  }

  if (variant === "elegant") {
    return (
      <div
        className={clsx(
          "w-full flex justify-center items-center py-2",
          className,
        )}
      >
        <div
          className={clsx(
            "w-8 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/20" : "via-foreground/20",
          )}
        />
        <Sparkles className={clsx("w-4 h-4 mx-2", accentColor)} />
        <div
          className={clsx(
            "w-4 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/20" : "via-foreground/20",
          )}
        />
        <Heart
          className={clsx("w-3 h-3 mx-1", iconColor)}
          fill="currentColor"
        />
        <div
          className={clsx(
            "w-4 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/20" : "via-foreground/20",
          )}
        />
        <Sparkles className={clsx("w-4 h-4 mx-2", accentColor)} />
        <div
          className={clsx(
            "w-8 h-px bg-gradient-to-r from-transparent to-transparent",
            hasAlternateBg ? "via-primary-foreground/20" : "via-foreground/20",
          )}
        />
      </div>
    );
  }

  return null;
}
