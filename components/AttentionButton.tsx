"use client";

import type { ReactNode, Ref } from "react";
import { Button } from "@heroui/button";
import type { ButtonProps } from "@heroui/button";

export interface AttentionButtonProps extends ButtonProps {
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export default function AttentionButton({
  children,
  className = "",
  ref,
  ...props
}: AttentionButtonProps) {
  return (
    <div className="relative inline-block">
      <Button
        ref={ref}
        className={[
          "attention-button",
          "relative",
          "z-10",
          "font-semibold",
          "text-white",
          "border-0",
          "shadow-lg",
          "transform",
          "transition-transform",
          "duration-300",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        color="primary"
        {...props}
      >
        {children}
      </Button>
    </div>
  );
}
