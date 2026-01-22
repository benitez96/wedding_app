"use client";

import Countdown from "@/components/Countdown";
import { Section } from "@/components/section";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";

interface DateSectionClientProps {
  titleText: string;
  dayOfWeek: string;
  dayNumber: string;
  monthName: string;
  yearNumber: string;
  showCountdown: boolean;
  targetTimestamp: number;
  hasAlternateBg?: boolean;
  decorationSvg: DecorationSvg;
  decorationPattern: DecorationPattern;
  decorationOpacity: number;
  decorationSize: number;
}

export default function DateSectionClient({
  titleText,
  dayOfWeek,
  dayNumber,
  monthName,
  yearNumber,
  showCountdown,
  targetTimestamp,
  hasAlternateBg = false,
  decorationSvg,
  decorationPattern,
  decorationOpacity,
  decorationSize,
}: DateSectionClientProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Title isDecorative className="text-3xl">
            {titleText}
          </Section.Title>

          {/* Diseño de fecha */}
          <div className="text-xl text-center">
            <div className="mb-2">
              <h2 className="text-4xl md:text-6xl tracking-wider">
                {dayOfWeek}
              </h2>
            </div>

            <div className="mb-2">
              <h3 className="text-6xl md:text-8xl font-bold text-gray-800 tracking-tight">
                {dayNumber}
              </h3>
            </div>

            <div>
              <h4 className="text-2xl md:text-3xl font-semibold text-gray-600 tracking-wide">
                {monthName} {yearNumber}
              </h4>
            </div>
          </div>

          {showCountdown && (
            <div className="mt-2">
              <Countdown targetTimestamp={targetTimestamp} />
            </div>
          )}
        </Section.Container>
      </DecorationLayer>
    </div>
  );
}
