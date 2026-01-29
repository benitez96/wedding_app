"use client";

import { Chip } from "@heroui/chip";
import type { SubscriptionTier } from "@/types/subscription";

const TIER_STYLES = {
  FREE: "default",
  BASIC: "primary",
  COMPANY: "secondary",
} as const;

const TIER_LABELS = {
  FREE: "Gratis",
  BASIC: "Basic",
  COMPANY: "Company",
} as const;

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: "sm" | "md" | "lg";
}

export default function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  return (
    <Chip
      size={size}
      color={TIER_STYLES[tier]}
      variant="flat"
    >
      {TIER_LABELS[tier]}
    </Chip>
  );
}
