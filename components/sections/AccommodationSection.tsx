"use client"

import { Bed, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedDivider from "@/components/AnimatedDivider";
import Image from "next/image";
import { useState } from "react";

// Datos mock de alojamientos
const accommodations = [
  {
    name: "Hotel Santa Ines",
    phone: "+54 9 3777 20-0505",
    description: "Ubicado en el centro de la ciudad",
    distance: "3 min del salón a pie"
  },
  {
    name: "Hotel La Casona",
    phone: "+54 9 3777 45-2357", 
    description: "Ubicado en el centro de la ciudad",
    distance: "3 min del salón a pie"
  },
  {
    name: "Hotel Victoria",
    phone: "+54 9 3777 45-2348",
    description: "Ubicado en el centro de la ciudad",
    distance: "11 min del salón a pie"
  },
  {
    name: "Hotel Rio Arriba",
    phone: "+54 9 3777 45-0376",
    description: "Ubicado sobre la costanera de la ciudad",
    distance: "12 min del salón a pie"
  },
  {
    name: "Cabañas Bella Vista",
    phone: "+54 9 3777 45-1555",
    description: "Ubicado sobre la costanera de la ciudad",
    distance: "13 min del salón a pie"
  },  
];

export default function AccommodationSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <AnimatedSection delay={0.6}>
      <Section.Container>
        <Section.Icon>
          <Image 
            src="/icons/accommodation.gif" 
            alt="Alojamiento" 
            width={100} 
            height={100}
            className="filter-[contrast(0.8)_brightness(1.1)]"
          />
        </Section.Icon>
        <Section.Title>ALOJAMIENTOS</Section.Title>
        <Section.Description isDecorative>
          Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos
        </Section.Description>
        
        <Button
          color="primary"
          //variant="ghost"
          startContent={<Bed className="w-4 h-4" />}
          endContent={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          onPress={() => setIsExpanded(!isExpanded)}
          className="mt-2"
        >
          {isExpanded ? "Ocultar alojamientos" : "Ver alojamientos"}
        </Button>
        
        {isExpanded && (
          <div className="w-full max-w-md space-y-1 mt-4">
            {accommodations.map((accommodation, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Bed className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">{accommodation.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">{accommodation.description}</p>
                <p className="text-xs text-gray-500 mb-3">📍 {accommodation.distance}</p>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<Phone className="w-4 h-4" />}
                  onPress={() => handleCall(accommodation.phone)}
                >
                  {accommodation.phone}
                </Button>
                
                {index < accommodations.length - 1 && (
                  <AnimatedDivider variant="simple" delay={0.1} className="mt-2" />
                )}
              </div>
            ))}
            
            <Section.Description className="text-sm text-gray-500 mt-4">
              ¡Reserva con anticipación para asegurar tu lugar!
            </Section.Description>
          </div>
        )}
      </Section.Container>
    </AnimatedSection>
  );
}
