"use client";

import type { ReactNode } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import clsx from "clsx";

export const MessageTypes = {
  SUCCESS: "success",
  ERROR: "error",
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

export interface FeedbackMessageProps {
  type: MessageType;
  message: string;
  icon?: ReactNode;
  className?: string;
}

export default function FeedbackMessage({
  type,
  message,
  icon,
  className,
}: FeedbackMessageProps) {
  const isSuccess = type === MessageTypes.SUCCESS;
  const isError = type === MessageTypes.ERROR;

  const defaultIcon = isSuccess ? (
    <CheckCircle className="w-4 h-4 flex-shrink-0" />
  ) : (
    <AlertCircle className="w-4 h-4 flex-shrink-0" />
  );

  return (
    <div
      className={clsx(
        "p-3 rounded-lg text-sm flex items-start gap-2",
        {
          "bg-success-50 border border-success-200 text-success-700": isSuccess,
          "bg-danger-50 border border-danger-200 text-danger-700": isError,
        },
        className,
      )}
    >
      {icon ?? defaultIcon}
      <span className="flex-1">{message}</span>
    </div>
  );
}
