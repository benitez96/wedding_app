"use client";

import { useEffect } from "react";
import { Button } from "@heroui/button";
import { logError } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging (client-side only)
    // In production, this could be sent to an error reporting service like Sentry
    logError("App Error", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4">
      <h2 className="text-xl font-semibold text-foreground">Algo salió mal</h2>
      <p className="text-default-500 text-center max-w-md">
        Ocurrió un error inesperado. Por favor, intenta nuevamente.
      </p>
      <Button color="primary" onPress={reset}>
        Intentar de nuevo
      </Button>
    </div>
  );
}
