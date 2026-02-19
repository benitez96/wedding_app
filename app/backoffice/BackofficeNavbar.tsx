import { Navbar, NavbarBrand, NavbarContent } from "@heroui/navbar";
import { Heart } from "lucide-react";
import Link from "next/link";
import BackofficeMenu from "./BackofficeMenu";
import type { SubscriptionTier } from "@/types/subscription";

interface EventOption {
  id: string;
  name: string;
  isOwner: boolean;
}

interface BackofficeNavbarProps {
  showMenu?: boolean;
  tier?: SubscriptionTier;
  events?: EventOption[];
  activeEventId?: string;
}

export default function BackofficeNavbar({
  showMenu = false,
  tier,
  events,
  activeEventId,
}: BackofficeNavbarProps) {
  return (
    <Navbar
      className="bg-content1 shadow-sm border-b border-divider"
      maxWidth="2xl"
    >
      <NavbarBrand>
        <Link href="/backoffice/dashboard" className="flex items-center gap-2">
          <Heart className="text-red-500 md:text-2xl text-xl" size={24} />
          <span className="font-bold md:text-xl text-lg">Wedding App</span>
        </Link>
      </NavbarBrand>
      <NavbarContent justify="end">
        {showMenu ? (
          <BackofficeMenu
            tier={tier}
            events={events}
            activeEventId={activeEventId}
          />
        ) : null}
      </NavbarContent>
    </Navbar>
  );
}
