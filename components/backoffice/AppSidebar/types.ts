import type { ReactNode } from "react";
import type { SubscriptionTier } from "@/types/subscription";
import type { ThemeId, CustomThemeColors } from "@/types/theme";

export interface EventOption {
  id: string;
  name: string;
  isOwner: boolean;
}

export interface MenuItem {
  label: string;
  href: string;
  icon: ReactNode;
  tierRequired?: SubscriptionTier;
}

export interface SidebarThemeData {
  themeId: ThemeId;
  customColors: CustomThemeColors | null;
}

export interface SidebarContextValue {
  isExpanded: boolean;
  toggleSidebar: () => void;
  events: EventOption[];
  activeEventId: string | null;
  tier: SubscriptionTier;
  themeData: SidebarThemeData;
}
