import {
  HeroSection,
  QuoteSection,
  DateSection,
  CeremonySection,
  CelebrationSection,
  DressCodeSection,
  GiftSection,
  InstagramSection,
  RSVPSection,
  PhotoUploadSection,
  AccommodationSection
} from "@/components/sections";
import AnimatedDivider from "@/components/AnimatedDivider";
import AuthGuard from "@/components/AuthGuard";
import HeroMusicButton from "@/components/HeroMusicButton";
import { ScrollShadow } from "@heroui/react";

export default function Home() {
  return (
    <AuthGuard>
      <ScrollShadow 
        hideScrollBar={false} 
        size={40} 
        offset={0} 
        orientation="vertical"
        className="w-full h-screen"
      >
        <div className="min-h-screen">
          <HeroMusicButton />
          <HeroSection />
          <QuoteSection />
          <DateSection />
          <AnimatedDivider variant="heart" delay={0.2} />
          <CeremonySection />
          <CelebrationSection />
          <AnimatedDivider variant="elegant" delay={0.1} />
          <DressCodeSection />
          <AnimatedDivider variant="simple" delay={0.3} />
          <GiftSection />
          <AnimatedDivider variant="heart" delay={0.4} />
          <InstagramSection />
          <AnimatedDivider variant="simple" delay={0.1} />
          <RSVPSection />
          <AnimatedDivider variant="elegant" delay={0.5} />
          <PhotoUploadSection />
          <AccommodationSection />
          <AnimatedDivider variant="simple" delay={0.2} />
        </div>
      </ScrollShadow>
    </AuthGuard>
  );
}
