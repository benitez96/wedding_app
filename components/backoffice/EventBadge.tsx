import { Chip } from "@heroui/react";

interface EventBadgeProps {
  isOwner: boolean;
  variant?: "default" | "minimal";
}

export default function EventBadge({ isOwner, variant = "default" }: EventBadgeProps) {
  if (variant === "minimal") {
    return (
      <span className="text-xs text-default-500">
        {isOwner ? "Owner" : "Colaborador"}
      </span>
    );
  }

  return (
    <Chip
      size="sm"
      variant="flat"
      color={isOwner ? "primary" : "default"}
      className="h-5"
    >
      {isOwner ? "Owner" : "Colaborador"}
    </Chip>
  );
}
