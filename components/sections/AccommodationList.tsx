"use client";

import { useState } from "react";
import { Bed, Phone, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@heroui/button";
import AnimatedDividerCSS from "@/components/AnimatedDividerCSS";

interface Accommodation {
  name: string;
  contactType: "phone" | "link";
  contactValue: string;
  hasDescription: boolean;
  description: string;
  hasDistance: boolean;
  distance: string;
}

interface AccommodationListProps {
  accommodations: Accommodation[];
}

export default function AccommodationList({
  accommodations,
}: AccommodationListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleContact = (type: "phone" | "link", value: string) => {
    if (type === "phone") {
      window.open(`tel:${value}`, "_self");
    } else {
      window.open(value, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
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
        <div className="w-full max-w-md space-y-1 mt-4 max-h-[500px] overflow-y-auto px-2">
          {accommodations.map((accommodation, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Bed className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">{accommodation.name}</h3>
              </div>

              {accommodation.hasDescription && accommodation.description && (
                <p className="text-sm text-gray-600 mb-1">
                  {accommodation.description}
                </p>
              )}

              {accommodation.hasDistance && accommodation.distance && (
                <p className="text-xs text-gray-500 mb-2">
                  📍 {accommodation.distance}
                </p>
              )}

              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={
                  accommodation.contactType === "phone" ? (
                    <Phone className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )
                }
                onPress={() =>
                  handleContact(
                    accommodation.contactType,
                    accommodation.contactValue,
                  )
                }
                className={
                  !(accommodation.hasDescription || accommodation.hasDistance)
                    ? "mt-2"
                    : ""
                }
              >
                {accommodation.contactType === "phone"
                  ? accommodation.contactValue
                  : "Ver ubicación"}
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
          <p className="text-sm text-gray-500 mt-4 flex w-full justify-center">
            ¡Reserva con anticipación para asegurar tu lugar!
          </p>
        </div>
      )}
    </div>
  );
}
