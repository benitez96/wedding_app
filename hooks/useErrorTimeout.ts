import { useState, useRef, useEffect } from "react";

interface UseErrorTimeoutOptions {
  /**
   * Duration in milliseconds before clearing error
   * @default 5000
   */
  timeout?: number;
}

interface UseErrorTimeoutReturn {
  /**
   * Current error message (null if no error or timeout elapsed)
   */
  error: string | null;
  /**
   * Set error message (will auto-clear after timeout)
   */
  setError: (message: string) => void;
  /**
   * Clear error immediately
   */
  clearError: () => void;
}

/**
 * Hook for managing temporary error messages that auto-clear after a timeout
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { error, setError, clearError } = useErrorTimeout();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await submitForm();
 *     } catch {
 *       setError('Failed to submit form'); // Auto-clears after 5s
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {error && <div className="error">{error}</div>}
 *       <button onClick={handleSubmit}>Submit</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useErrorTimeout(
  options: UseErrorTimeoutOptions = {},
): UseErrorTimeoutReturn {
  const { timeout = 5000 } = options;

  const [error, setErrorState] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setError = (message: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set error
    setErrorState(message);

    // Auto-clear after timeout
    timeoutRef.current = setTimeout(() => {
      setErrorState(null);
      timeoutRef.current = null;
    }, timeout);
  };

  const clearError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setErrorState(null);
  };

  return {
    error,
    setError,
    clearError,
  };
}
