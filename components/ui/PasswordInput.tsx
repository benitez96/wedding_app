"use client";

import { useState } from "react";
import { Input, type InputProps } from "@heroui/input";
import { Eye, EyeOff, Lock } from "lucide-react";

export interface PasswordInputProps
  extends Omit<InputProps, "type" | "endContent" | "startContent"> {
  name?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  autoComplete?: string;
}

export default function PasswordInput({
  name = "password",
  label = "Contraseña", // TODO i18n: Default label needs translation support
  placeholder = "••••••••",
  description,
  isRequired = false,
  isDisabled = false,
  autoComplete = "current-password",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      type={showPassword ? "text" : "password"}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      startContent={<Lock className="w-4 h-4" />}
      endContent={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          className="focus:outline-none"
          aria-label={
            // TODO i18n: Aria labels need translation support
            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
          }
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-gray-400" />
          ) : (
            <Eye className="w-4 h-4 text-gray-400" />
          )}
        </button>
      }
      isRequired={isRequired}
      isDisabled={isDisabled}
      autoComplete={autoComplete}
      fullWidth
      {...props}
    />
  );
}
