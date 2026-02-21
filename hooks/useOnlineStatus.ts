"use client";

import { useState, useEffect } from "react";

/**
 * Reactive online/offline status hook.
 *
 * Returns `true` when the browser has connectivity, `false` otherwise.
 * Subscribes to the `online` / `offline` window events so every consumer
 * re-renders automatically when the status changes.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
