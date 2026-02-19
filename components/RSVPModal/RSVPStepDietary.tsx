"use client";

import { useState } from "react";
import { RadioGroup, Radio } from "@heroui/radio";
import { Textarea } from "@heroui/input";

interface RSVPStepDietaryProps {
  question: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
}

// Step 4: Dietary restrictions — yes/no radio, yes reveals free text.
// Only shown when attending.
//
// Contract with parent (RSVPModal):
//   null  = unanswered (step is NOT valid yet)
//   ""    = explicitly "no restrictions" (valid)
//   "..." = has restrictions text (valid)
export function RSVPStepDietary({
  question,
  value,
  onValueChange,
}: RSVPStepDietaryProps) {
  // Local radio selection decoupled from the parent value.
  // This avoids the conflict where "yes" would set parent to null (unanswered).
  const [radioSelection, setRadioSelection] = useState<"yes" | "no" | null>(
    () => {
      if (value === null) return null;
      if (value === "") return "no";
      return "yes";
    },
  );

  function handleRadioChange(selected: string) {
    if (selected === "no") {
      setRadioSelection("no");
      onValueChange(""); // empty string = explicitly "no restrictions"
    } else {
      setRadioSelection("yes");
      // Keep whatever text the user typed, or empty string so the textarea shows
      // Don't set null — null means unanswered which blocks the Next button
      onValueChange(value && value !== "" ? value : "");
    }
  }

  function handleTextChange(text: string) {
    onValueChange(text); // always a string, even if empty
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-center">{question}</h4>
      <RadioGroup
        value={radioSelection ?? ""}
        onValueChange={handleRadioChange}
        orientation="horizontal"
        classNames={{ wrapper: "justify-center gap-8" }}
      >
        {/* TODO: i18n */}
        <Radio value="yes">Sí</Radio>
        <Radio value="no">No</Radio>
      </RadioGroup>

      {radioSelection === "yes" && (
        // TODO: i18n
        <Textarea
          placeholder="Contanos cuál es tu restricción o alergia..."
          value={value ?? ""}
          onChange={(e) => handleTextChange(e.target.value)}
          variant="bordered"
          minRows={2}
          maxRows={4}
        />
      )}
    </div>
  );
}
