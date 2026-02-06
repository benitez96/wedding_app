"use client";

import { RadioGroup, Radio, useRadio } from "@heroui/radio";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { Heart, HeartOff } from "lucide-react";

interface CustomRadioGroupProps {
  value: "attending" | "declining" | null;
  onValueChange: (value: "attending" | "declining") => void;
}

// Componente personalizado para el radio con ícono de corazón
function HeartRadio(props: Parameters<typeof useRadio>[0]) {
  const { getInputProps, isSelected } = useRadio(props);

  return (
    <label className="flex flex-col items-center gap-3 cursor-pointer">
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <Heart
        className={`w-12 h-12 transition-all duration-200 ${
          isSelected ? "fill-current text-success-600" : "text-default-400"
        }`}
      />
      <div className="text-center">
        <div className="font-semibold text-lg">¡Sí, acepto!</div>
        <div className="text-sm opacity-80">Voy a estar ahí</div>
      </div>
    </label>
  );
}

// Componente personalizado para el radio con ícono de corazón roto
function BrokenHeartRadio(props: Parameters<typeof useRadio>[0]) {
  const { getInputProps, isSelected } = useRadio(props);

  return (
    <label className="flex flex-col items-center gap-3 cursor-pointer">
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <HeartOff
        className={`w-12 h-12 transition-all duration-200 ${
          isSelected ? "fill-current text-danger-600" : "text-default-400"
        }`}
      />
      <div className="text-center">
        <div className="font-semibold text-lg">No puedo ir :(</div>
        <div className="text-sm opacity-80">Lo siento mucho</div>
      </div>
    </label>
  );
}

export default function CustomRadioGroup({
  value,
  onValueChange,
}: CustomRadioGroupProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue === "attending" || newValue === "declining") {
      onValueChange(newValue as "attending" | "declining");
    }
  };

  return (
    <RadioGroup
      value={value || ""}
      onValueChange={handleValueChange}
      orientation="horizontal"
      classNames={{
        wrapper: "flex gap-12 justify-center",
      }}
    >
      <Radio
        value="attending"
        classNames={{
          base: "flex flex-col items-center gap-3",
          wrapper: "hidden",
          label: "text-center",
          control: "hidden",
        }}
      >
        <HeartRadio value="attending" />
      </Radio>

      <Radio
        value="declining"
        classNames={{
          base: "flex flex-col items-center gap-3",
          wrapper: "hidden",
          label: "text-center",
          control: "hidden",
        }}
      >
        <BrokenHeartRadio value="declining" />
      </Radio>
    </RadioGroup>
  );
}
