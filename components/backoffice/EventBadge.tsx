import { Chip } from "@heroui/react";

interface EventBadgeProps {
  isOwner: boolean;
  variant?: "default" | "minimal";
}

export default function EventBadge({
  isOwner,
  variant = "default",
}: EventBadgeProps) {
  // TODO i18n: "Owner" / "Colaborador"
  const label = isOwner ? "Owner" : "Colaborador";

  if (variant === "minimal") {
    return <span className="text-xs text-default-500">{label}</span>;
  }

  return (
    <Chip
      size="sm"
      variant="flat"
      color={isOwner ? "primary" : "default"}
      className="h-5"
    >
      {label}
    </Chip>
  );
}
