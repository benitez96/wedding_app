import { Navbar, NavbarBrand, NavbarContent } from "@heroui/navbar";
import Link from "next/link";
import BackofficeMenu from "./BackofficeMenu";
import type { SubscriptionTier } from "@/types/subscription";
import { Logo } from "@/components/Logo";

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
          <div className="bg-black rounded-lg p-1.5">
            <Logo className="size-5 md:size-6 text-white" />
          </div>
          <span className="font-bold md:text-xl text-lg text-white">
            Invify
          </span>
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
