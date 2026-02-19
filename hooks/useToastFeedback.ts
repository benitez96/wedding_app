"use client";

import { addToast } from "@heroui/toast";

export function useToastFeedback() {
  const toastSuccess = (message: string) => {
    addToast({
      title: message,
      color: "success",
      variant: "flat",
      timeout: 4000,
    });
  };

  const toastError = (message: string) => {
    addToast({
      title: message,
      color: "danger",
      variant: "flat",
      timeout: 5000,
    });
  };

  return { toastSuccess, toastError };
}
