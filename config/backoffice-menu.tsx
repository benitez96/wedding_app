import {
  LayoutDashboard,
  Users,
  Layout,
  Settings,
  Palette,
  UserPlus,
  QrCode,
  ClipboardList,
} from "lucide-react";
import type { MenuItem } from "@/components/backoffice/AppSidebar/types";

/**
 * Single source of truth para el menú del backoffice.
 * Usado por NavigationSidebar (desktop) y MobileMenu (mobile).
 */
export const BACKOFFICE_MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/backoffice/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Invitaciones",
    href: "/backoffice/invitations",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Scanner QR",
    href: "/backoffice/scanner",
    icon: <QrCode className="w-5 h-5" />,
  },
  {
    label: "Check-ins",
    href: "/backoffice/check-ins",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: "Estructura",
    href: "/backoffice/structure",
    icon: <Layout className="w-5 h-5" />,
  },
  {
    label: "Theming",
    href: "/backoffice/theming",
    icon: <Palette className="w-5 h-5" />,
  },
  {
    label: "Configuraciones",
    href: "/backoffice/settings",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    label: "Miembros",
    href: "/backoffice/collaborators",
    icon: <UserPlus className="w-5 h-5" />,
    tierRequired: "COMPANY",
  },
];
