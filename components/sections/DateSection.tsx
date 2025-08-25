import Countdown from "@/components/Countdown";
import { formatWeddingDate, getWeddingDate } from "@/utils/date";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";

export default function DateSection() {
  const weddingDate = process.env.NEXT_PUBLIC_WEDDING_DATE || '20260214';
  const formattedDate = formatWeddingDate(weddingDate);
  const targetDate = getWeddingDate();

  // Extraer componentes de la fecha para el nuevo diseño
  const year = parseInt(weddingDate.substring(0, 4));
  const month = parseInt(weddingDate.substring(4, 6));
  const day = parseInt(weddingDate.substring(6, 8));
  
  const date = new Date(year, month - 1, day);
  
  const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
  const dayNumber = day.toString();
  const monthName = date.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
  const yearNumber = year.toString();

  return (
    <AnimatedSection delay={0.3}>
      <Section.Container>
        <Section.Title isDecorative className="text-3xl">Te esperamos el día</Section.Title>
        
        {/* Nuevo diseño de fecha */}
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

        <div className="mt-2">
          <Countdown targetDate={targetDate} />
        </div>
      </Section.Container>
    </AnimatedSection>
  );
}
