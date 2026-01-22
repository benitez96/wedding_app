"use client";

import { RadioGroup, useRadio, VisuallyHidden, cn } from "@heroui/react";
import Image from "next/image";
import { Ban } from "lucide-react";
import { DecorationSvg } from "@/types/decoration";

interface DecorationSvgOption {
  value: DecorationSvg;
  label: string;
  svgPath?: string; // undefined para "none"
  children?: React.ReactNode;
}

interface DecorationSvgSelectorProps {
  value: DecorationSvg;
  onChange: (value: DecorationSvg) => void;
}

// Opciones disponibles
const SVG_OPTIONS: DecorationSvgOption[] = [
  {
    value: "none",
    label: "Sin decoración",
  },
  {
    value: "flower",
    label: "Flor",
    svgPath: "/tramas/svgs/flower.svg",
  },
  {
    value: "leaf",
    label: "Hoja",
    svgPath: "/tramas/svgs/leaf.svg",
  },
  {
    value: "heart",
    label: "Corazón",
    svgPath: "/tramas/svgs/heart.svg",
  },
  {
    value: "branch",
    label: "Rama",
    svgPath: "/tramas/svgs/branch.svg",
  },
  {
    value: "branch-2",
    label: "Rama 2",
    svgPath: "/tramas/svgs/branch-2.svg",
  },
];

// Custom Radio Card
function SvgRadioCard(props: DecorationSvgOption) {
  // Extraer props custom que no deben ir al DOM
  const { svgPath, label, ...radioProps } = props;
  const { Component, children, getBaseProps, getInputProps, getWrapperProps } =
    useRadio(radioProps);

  return (
    <Component
      {...getBaseProps()}
      className={cn(
        "group inline-flex items-center justify-center flex-col",
        "tap-highlight-transparent cursor-pointer border-2 border-default-200",
        "rounded-lg p-3 hover:bg-content2 transition-colors",
        "data-[selected=true]:border-primary data-[selected=true]:bg-primary-50",
        "w-24 h-24 flex-shrink-0",
      )}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <span {...getWrapperProps()} className="flex flex-col items-center gap-1">
        {/* Icono/SVG */}
        <div className="w-9 h-9 flex items-center justify-center">
          {svgPath ? (
            <Image
              src={svgPath}
              alt={label}
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          ) : (
            <Ban className="w-6 h-6 text-gray-400" />
          )}
        </div>
        {/* Label */}
        <span className="text-[10px] text-center font-medium leading-tight">
          {children}
        </span>
      </span>
    </Component>
  );
}

export function DecorationSvgSelector({
  value,
  onChange,
}: DecorationSvgSelectorProps) {
  const handleChange = (val: string) => {
    onChange(val as DecorationSvg);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Elemento Decorativo</label>
      <div className="overflow-x-auto pb-2">
        <RadioGroup
          value={value}
          onValueChange={handleChange}
          orientation="horizontal"
          classNames={{
            wrapper: "gap-2 flex-nowrap",
          }}
        >
          {SVG_OPTIONS.map((option) => (
            <SvgRadioCard
              key={option.value}
              value={option.value}
              label={option.label}
              svgPath={option.svgPath}
            >
              {option.label}
            </SvgRadioCard>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
