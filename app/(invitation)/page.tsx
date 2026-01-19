import AnimatedDividerCSS from "@/components/AnimatedDividerCSS";
import AuthGuard from "@/components/AuthGuard";
import AccommodationSection from "@/components/sections/AccommodationSection";
import CelebrationSection from "@/components/sections/CelebrationSection";
import CeremonySection from "@/components/sections/CeremonySection";
import DateSection from "@/components/sections/DateSection";
import DressCodeSection from "@/components/sections/DressCodeSection";
import GiftSection from "@/components/sections/GiftSection";
import HeroSection from "@/components/sections/HeroSection";
import InstagramSection from "@/components/sections/InstagramSection";
import PhotoUploadSection from "@/components/sections/PhotoUploadSection";
import QuoteSection from "@/components/sections/QuoteSection";
import RSVPSection from "@/components/sections/RSVPSection";
import InvitationClientWidgets from "@/app/(invitation)/InvitationClientWidgets";
import { getWeddingDate, getRemindRestingDays } from "@/lib/get-configurations";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

export default async function Home() {
  const weddingDate = await getWeddingDate();
  const remindRestingDays = await getRemindRestingDays();

  return (
    <AuthGuard>
      <InvitationClientWidgets
        weddingTimestamp={weddingDate.getTime()}
        remindRestingDays={remindRestingDays}
      />
      <HeroSection />
      <QuoteSection />
      <DateSection />
      <AnimatedDividerCSS variant="heart" delay={0.2} />
      <CeremonySection />
      <CelebrationSection />
      <AnimatedDividerCSS variant="elegant" delay={0.1} />
      <DressCodeSection />
      <AnimatedDividerCSS variant="simple" delay={0.3} />
      <GiftSection />
      <AnimatedDividerCSS variant="heart" delay={0.4} />
      <InstagramSection />
      <AnimatedDividerCSS variant="simple" delay={0.1} />
      <RSVPSection />
      <AnimatedDividerCSS variant="elegant" delay={0.5} />
      <PhotoUploadSection />
      <AnimatedDividerCSS variant="simple" delay={0.5} />
      <AccommodationSection />
      <AnimatedDividerCSS variant="simple" delay={0.2} />
    </AuthGuard>
  );
}
