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

export default function Home() {
  return (
    <AuthGuard>
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
      <AnimatedDivider variant="simple" delay={0.5} />
      <AccommodationSection />
      <AnimatedDivider variant="simple" delay={0.2} />
    </AuthGuard>
  );
}
