"use client";

import { RadioGroup, Radio } from "@heroui/radio";

interface RSVPStepMenuProps {
  question: string;
  options: string[];
  value: string | null;
  onValueChange: (value: string) => void;
}

// Step 3: Menu preference — radio with configurable options, only when attending
export function RSVPStepMenu({
  question,
  options,
  value,
  onValueChange,
}: RSVPStepMenuProps) {
  return (
    <div className="flex justify-center">
      <div className="space-y-4">
        <h4 className="font-semibold text-center">{question}</h4>
        <RadioGroup
          value={value ?? ""}
          onValueChange={onValueChange}
          classNames={{ wrapper: "gap-2" }}
        >
          {options.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
