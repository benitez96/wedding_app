import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Image from "next/image";
import { DressCodeSectionSettings } from "./DressCodeSection.metadata";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";

interface DressCodeSectionProps {
  settings?: DressCodeSectionSettings;
}

export default function DressCodeSection({ settings }: DressCodeSectionProps) {
  const dressCode = settings?.dressCode || "Formal";
  const subtitle = settings?.subtitle || "(No blanco)";
  const showColorSuggestions = settings?.showColorSuggestions ?? true;
  const iconUrl = settings?.iconUrl || "/icons/dress-code.gif";
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  return (
    <AnimatedSectionCSS delay={0.6}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Icon>
            <Image src={iconUrl} alt="Dress Code" width={100} height={100} />
          </Section.Icon>
          <Section.Title>DRESS CODE</Section.Title>
          <Section.Description isDecorative className="text-4xl font-semibold">
            {dressCode}
          </Section.Description>
          <Section.Description className="text-sm text-foreground/70">
            {subtitle}
          </Section.Description>
          {showColorSuggestions && (
            <>
              <Section.Description>Sugerencia de colores</Section.Description>
              <div className="flex flex-row gap-4 mt-4">
                <span
                  className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-800 inline-block"
                  title="Marrón"
                ></span>
                <span
                  className="w-8 h-8 rounded-full bg-violet-800 border-2 border-violet-900 inline-block"
                  title="Negro"
                ></span>
                <span
                  className="w-8 h-8 rounded-full bg-sky-900 border-2 border-sky-950 inline-block"
                  title="Azul marino"
                ></span>
                <span
                  className="w-8 h-8 rounded-full bg-pink-700 border-2 border-pink-800 inline-block"
                  title="Beige"
                ></span>
                <span
                  className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-emerald-800 inline-block"
                  title="Gris"
                ></span>
              </div>
            </>
          )}
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
