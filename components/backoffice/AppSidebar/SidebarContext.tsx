"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { SidebarContextValue, EventOption } from "./types";
import type { SubscriptionTier } from "@/types/subscription";
import type { ThemeId } from "@/types/theme";

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "backoffice-sidebar-expanded";

interface SidebarProviderProps {
  children: ReactNode;
  events: EventOption[];
  activeEventId: string | null;
  tier: SubscriptionTier;
  themeId: ThemeId;
}

export function SidebarProvider({
  children,
  events,
  activeEventId,
  tier,
  themeId,
}: SidebarProviderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Leer localStorage en mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsExpanded(stored === "true");
    }
    setIsHydrated(true);
  }, []);

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, String(isExpanded));
    }
  }, [isExpanded, isHydrated]);

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  const value: SidebarContextValue = {
    isExpanded,
    toggleSidebar,
    events,
    activeEventId,
    tier,
    themeId,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
