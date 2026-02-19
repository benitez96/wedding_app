"use client";

import { Users } from "lucide-react";
import GuestCountSelector from "@/components/GuestCountSelector";

interface RSVPStepGuestCountProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

// Step 2: How many guests? — only when attending and maxGuests > 1
export function RSVPStepGuestCount({
  value,
  max,
  onChange,
}: RSVPStepGuestCountProps) {
  return (
    <div className="space-y-3">
      {/* TODO: i18n */}
      <div className="flex items-center justify-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="font-medium">¿Cuántas personas van a asistir?</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <GuestCountSelector
          value={value}
          onChange={onChange}
          min={1}
          max={max}
        />
        {/* TODO: i18n */}
        <span className="text-sm text-default-500">de {max} máximo</span>
      </div>
    </div>
  );
}
