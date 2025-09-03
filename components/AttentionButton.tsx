'use client';

import { forwardRef } from "react";
import { Button } from "@heroui/button";
import type { ButtonProps } from "@heroui/button";

export interface AttentionButtonProps extends ButtonProps {}

const AttentionButton = forwardRef<HTMLButtonElement, AttentionButtonProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div className="relative inline-block">
        {/* Botón principal */}
        <Button
          ref={ref}
          className={`
            attention-button
            relative
            z-10
            font-semibold
            text-white
            border-0
            shadow-lg
            transform
            transition-transform
            duration-300
            ${className}
          `}
          color="primary"
          {...props}
        >
          {children}
        </Button>
      </div>
    );
  }
);

AttentionButton.displayName = "AttentionButton";

export default AttentionButton;
