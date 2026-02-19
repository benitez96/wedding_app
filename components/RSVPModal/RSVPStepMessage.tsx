"use client";

import { Textarea } from "@heroui/input";

interface RSVPStepMessageProps {
  question: string;
  value: string;
  onValueChange: (value: string) => void;
}

// Step 5: Message for the couple — free textarea, only when attending
export function RSVPStepMessage({
  question,
  value,
  onValueChange,
}: RSVPStepMessageProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-center">{question}</h4>
      {/* TODO: i18n */}
      <Textarea
        placeholder="Escribí tu mensaje acá..."
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        variant="bordered"
        minRows={3}
        maxRows={6}
        maxLength={1000}
        description={`${value.length}/1000`}
      />
    </div>
  );
}
