import { QRSectionSettings } from "./QRSection.metadata";
import { getCurrentUser } from "@/app/actions/invitations/";
import InvitationQRCode from "@/components/invitation/InvitationQRCode";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

interface QRSectionProps {
  settings?: QRSectionSettings;
}

/**
 * Sección de QR para check-in en el evento
 *
 * Muestra el código QR único de la invitación que se escaneará
 * en la entrada del evento para registrar el ingreso.
 */
export default async function QRSection({ settings }: QRSectionProps) {
  const userResult = await getCurrentUser();

  if (!userResult.success || !userResult.user || !userResult.user.tokenId) {
    return null;
  }

  const tokenId = userResult.user.tokenId as string;
  const guestName = userResult.user.guestName;

  const title = settings?.title || "CÓDIGO DE ACCESO";
  const subtitle =
    settings?.subtitle || "Presenta este código QR al ingresar al evento";
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Section icon (optional)
  const sectionIcon = (settings?.icon || "qrcode") as SectionIconType;

  // Decoraciones (opcionales)
  const decorationSvg = ((settings as any)?.decorationSvg ||
    "none") as DecorationSvg;
  const decorationPattern = ((settings as any)?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = (settings as any)?.decorationOpacity ?? 10;
  const decorationSize = (settings as any)?.decorationSize ?? 60;

  return (
    <AnimatedSectionCSS delay={0.6}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Icon>
            <SectionIcon icon={sectionIcon} size={100} alt="QR Code" />
          </Section.Icon>
          <Section.Title>{title}</Section.Title>
          <Section.Description>{subtitle}</Section.Description>

          {/* QR Code */}
          <div className="my-8">
            <InvitationQRCode tokenId={tokenId} guestName={guestName} />
          </div>

          <Section.Description className="text-sm opacity-70">
            💡 Tip: Guardá esta página en favoritos o hacé captura de pantalla
          </Section.Description>
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
