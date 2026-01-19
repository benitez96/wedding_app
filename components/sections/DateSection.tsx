import Countdown from "@/components/Countdown";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import { getWeddingDate } from "@/lib/get-configurations";

export default async function DateSection() {
  const targetDate = await getWeddingDate();

  // Extraer componentes de la fecha para el nuevo diseño
  const dayOfWeek = targetDate
    .toLocaleDateString("es-ES", { weekday: "long" })
    .toUpperCase();
  const dayNumber = targetDate.getDate().toString();
  const monthName = targetDate
    .toLocaleDateString("es-ES", { month: "long" })
    .toUpperCase();
  const yearNumber = targetDate.getFullYear().toString();

  return (
    <AnimatedSection delay={0.3}>
      <Section.Container>
        <Section.Title isDecorative className="text-3xl">
          Te esperamos el día
        </Section.Title>

        {/* Nuevo diseño de fecha */}
        <div className="text-xl text-center">
          <div className="mb-2">
            <h2 className="text-4xl md:text-6xl tracking-wider">{dayOfWeek}</h2>
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

        <div className="mt-2">
          <Countdown targetTimestamp={targetDate.getTime()} />
        </div>
      </Section.Container>
    </AnimatedSection>
  );
}
