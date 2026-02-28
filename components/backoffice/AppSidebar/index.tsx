"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import EventSwitcher from "./EventSwitcher";
import NavigationSidebar from "./NavigationSidebar";
import MobileMenu from "./MobileMenu";
import type { EventOption, SidebarThemeData } from "./types";
import type { SubscriptionTier } from "@/types/subscription";

interface AppSidebarProps {
  children: ReactNode;
  events: EventOption[];
  activeEventId: string | null;
  tier: SubscriptionTier;
  themeData: SidebarThemeData;
}

function AppSidebarContent({ children }: { children: ReactNode }) {
  const { isExpanded, themeData } = useSidebar();

  return (
    <div className={clsx(themeData.themeId, "bg-background text-foreground")}>
      {/* Mobile Menu - solo visible en mobile/tablet */}
      <MobileMenu />

      {/* Desktop Layout */}
      <div className="min-h-screen flex">
        {/* Event Switcher - solo visible en desktop */}
        <div className="hidden lg:block">
          <EventSwitcher />
        </div>

        {/* Navigation Sidebar - solo visible en desktop */}
        <div className="hidden lg:block">
          <NavigationSidebar />
        </div>

        {/* Main Content - se ajusta al sidebar */}
        <main
          className={clsx(
            "flex-1 min-w-0 transition-all duration-300 ease-in-out",
            "pt-16 lg:pt-0", // Padding top para mobile header
            isExpanded ? "lg:ml-[336px]" : "lg:ml-[72px]", // 72px EventSwitcher + 264px NavigationSidebar
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppSidebar({
  children,
  events,
  activeEventId,
  tier,
  themeData,
}: AppSidebarProps) {
  return (
    <SidebarProvider
      events={events}
      activeEventId={activeEventId}
      tier={tier}
      themeData={themeData}
    >
      <AppSidebarContent>{children}</AppSidebarContent>
    </SidebarProvider>
  );
}
