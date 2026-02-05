"use client";

import { useState } from "react";
import { Bed, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@heroui/button";
import AnimatedDividerCSS from "@/components/AnimatedDividerCSS";

interface Accommodation {
  name: string;
  phone: string;
  description: string;
  distance: string;
}

interface AccommodationListProps {
  accommodations: Accommodation[];
}

export default function AccommodationList({
  accommodations,
}: AccommodationListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  return (
    <div>
      <Button
        color="primary"
        startContent={<Bed className="w-4 h-4" />}
        endContent={
          isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        }
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
              <p className="text-sm text-gray-600 mb-1">
                {accommodation.description}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                📍 {accommodation.distance}
              </p>
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
                <AnimatedDividerCSS
                  variant="simple"
                  delay={0.1}
                  className="mt-2"
                />
              )}
            </div>
          ))}
          <p className="text-sm text-gray-500 mt-4">
            ¡Reserva con anticipación para asegurar tu lugar!
          </p>
        </div>
      )}
    </div>
  );
}
