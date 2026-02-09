import { useState, useRef, useEffect } from "react";

interface UseClipboardOptions {
  /**
   * Duration in milliseconds to show "copied" state
   * @default 2000
   */
  timeout?: number;
  /**
   * Callback when copy succeeds
   */
  onSuccess?: (text: string) => void;
  /**
   * Callback when copy fails
   */
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  /**
   * Currently copied text (null if nothing copied or timeout elapsed)
   */
  copiedText: string | null;
  /**
   * Copy text to clipboard
   */
  copy: (text: string) => Promise<void>;
  /**
   * Check if text is currently copied
   */
  isCopied: (text: string) => boolean;
}

/**
 * Hook for copying text to clipboard with temporary "copied" feedback
 *
 * @example
 * ```tsx
 * function CopyButton({ text }: { text: string }) {
 *   const { copy, isCopied } = useClipboard();
 *
 *   return (
 *     <button onClick={() => copy(text)}>
 *       {isCopied(text) ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useClipboard(
  options: UseClipboardOptions = {},
): UseClipboardReturn {
  const { timeout = 2000, onSuccess, onError } = options;

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);

      // Set copied state
      setCopiedText(text);
      onSuccess?.(text);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset after timeout
      timeoutRef.current = setTimeout(() => {
        setCopiedText(null);
        timeoutRef.current = null;
      }, timeout);
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error("Failed to copy to clipboard");
      onError?.(err);
      throw err;
    }
  };

  const isCopied = (text: string) => copiedText === text;

  return {
    copiedText,
    copy,
    isCopied,
  };
}
