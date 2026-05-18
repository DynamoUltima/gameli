import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to trigger a callback after a specified idle timeout.
 * 
 * @param timeout The timeout in milliseconds after which the user is considered idle.
 * @param onIdle The callback to trigger when the user becomes idle.
 * @param enabled Whether the idle timer is enabled.
 */
export const useIdleTimer = (timeout: number, onIdle: () => void, enabled: boolean = true) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onIdle();
    }, timeout);
  }, [onIdle, timeout, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleEvent = () => {
      resetTimer();
    };

    // Add event listeners to detect activity
    events.forEach((event) => window.addEventListener(event, handleEvent));

    // Initialize timer
    resetTimer();

    // Cleanup event listeners and timer on unmount
    return () => {
      events.forEach((event) => window.removeEventListener(event, handleEvent));
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer, enabled]);

  return { resetTimer };
};

