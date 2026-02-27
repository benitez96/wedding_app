"use client";

import { RadioGroup, Radio } from "@heroui/radio";
import { Heart, HeartOff } from "lucide-react";
import type { AttendanceValue } from "@/lib/rsvp-modal-utils";

interface RadioOptionText {
  label: string;
  subtitle: string;
}

interface CustomRadioGroupProps {
  value: AttendanceValue | null;
  onValueChange: (value: AttendanceValue) => void;
  acceptText?: RadioOptionText;
  declineText?: RadioOptionText;
}

// Defaults match the original hardcoded text — keeps backwards compat
const DEFAULT_ACCEPT: RadioOptionText = {
  label: "¡Sí, acepto!", // TODO: i18n
  subtitle: "Voy a estar ahí", // TODO: i18n
};

const DEFAULT_DECLINE: RadioOptionText = {
  label: "No puedo ir :(", // TODO: i18n
  subtitle: "Lo siento mucho", // TODO: i18n
};

// Hoist static classNames outside component to prevent object recreation on re-renders
const RADIO_CLASS_NAMES = {
  base: "flex flex-col items-center gap-3",
  wrapper: "hidden",
  label: "text-center",
  control: "hidden",
} as const;

interface HeartOptionProps {
  text: RadioOptionText;
  isSelected: boolean;
}

function HeartOption({ text, isSelected }: HeartOptionProps) {
  return (
    <div className="flex flex-col items-center gap-3 cursor-pointer">
      <Heart
        className={`w-12 h-12 transition-all duration-200 ${
          isSelected ? "fill-current text-success-600" : "text-default-400"
        }`}
      />
      <div className="text-center">
        <div className="font-semibold text-lg">{text.label}</div>
        <div className="text-sm opacity-80">{text.subtitle}</div>
      </div>
    </div>
  );
}

function BrokenHeartOption({ text, isSelected }: HeartOptionProps) {
  return (
    <div className="flex flex-col items-center gap-3 cursor-pointer">
      <HeartOff
        className={`w-12 h-12 transition-all duration-200 ${
          isSelected ? "fill-current text-danger-600" : "text-default-400"
        }`}
      />
      <div className="text-center">
        <div className="font-semibold text-lg">{text.label}</div>
        <div className="text-sm opacity-80">{text.subtitle}</div>
      </div>
    </div>
  );
}

export default function CustomRadioGroup({
  value,
  onValueChange,
  acceptText = DEFAULT_ACCEPT,
  declineText = DEFAULT_DECLINE,
}: CustomRadioGroupProps) {
  function handleValueChange(newValue: string) {
    if (newValue === "attending" || newValue === "declining") {
      onValueChange(newValue);
    }
  }

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={handleValueChange}
      orientation="horizontal"
      classNames={{ wrapper: "flex gap-12 justify-center" }}
    >
      <Radio value="attending" classNames={RADIO_CLASS_NAMES}>
        <HeartOption text={acceptText} isSelected={value === "attending"} />
      </Radio>

      <Radio value="declining" classNames={RADIO_CLASS_NAMES}>
        <BrokenHeartOption
          text={declineText}
          isSelected={value === "declining"}
        />
      </Radio>
    </RadioGroup>
  );
}
