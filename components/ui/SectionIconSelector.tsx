"use client";

import { RadioGroup, useRadio, VisuallyHidden, cn } from "@heroui/react";
import Image from "next/image";
import { Ban, Image as ImageIcon } from "lucide-react";
import {
  SectionIcon,
  SECTION_ICON_CATALOG,
  SectionIconConfig,
} from "@/types/section-icon";

interface SectionIconSelectorProps {
  value: SectionIcon;
  onChange: (value: SectionIcon) => void;
  label?: string;
}

// Custom Radio Card
function IconRadioCard(
  props: SectionIconConfig & { children?: React.ReactNode },
) {
  const { path, label, type, animationClass, ...radioProps } = props;
  const { Component, children, getBaseProps, getInputProps, getWrapperProps } =
    useRadio(radioProps);

  const isGif = type === "gif";
  const hasImage = path && path !== "";

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
        {/* Ícono/Imagen */}
        <div className="w-12 h-12 flex items-center justify-center relative">
          {hasImage ? (
            <div className="relative w-full h-full">
              <Image
                src={path}
                alt={label}
                width={48}
                height={48}
                className={cn(
                  "w-full h-full object-contain",
                  animationClass && animationClass,
                )}
                unoptimized={isGif} // No optimizar GIFs para mantener animación
              />
              {/* Badge para indicar tipo */}
              {isGif && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] px-1 rounded-sm font-bold">
                  GIF
                </div>
              )}
            </div>
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

export function SectionIconSelector({
  value,
  onChange,
  label = "Ícono de Sección",
}: SectionIconSelectorProps) {
  const handleChange = (val: string) => {
    onChange(val as SectionIcon);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-gray-500" />
        <label className="text-sm font-medium">{label}</label>
      </div>
      <div className="overflow-x-auto pb-2">
        <RadioGroup
          value={value}
          onValueChange={handleChange}
          orientation="horizontal"
          classNames={{
            wrapper: "gap-2 flex-nowrap",
          }}
        >
          {SECTION_ICON_CATALOG.map((iconConfig) => (
            <IconRadioCard
              key={iconConfig.value}
              value={iconConfig.value}
              label={iconConfig.label}
              type={iconConfig.type}
              path={iconConfig.path}
              animationClass={iconConfig.animationClass}
            >
              {iconConfig.label}
            </IconRadioCard>
          ))}
        </RadioGroup>
      </div>
      {/* Info sobre el tipo seleccionado */}
      {value !== "none" && (
        <p className="text-xs text-gray-500">
          Tipo:{" "}
          {SECTION_ICON_CATALOG.find(
            (c) => c.value === value,
          )?.type.toUpperCase()}
        </p>
      )}
    </div>
  );
}
