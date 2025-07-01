import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseIdleTimerProps {
  timeout: number; // in milliseconds
  onIdle: () => void;
  enabled?: boolean;
}

export function useIdleTimer({ timeout, onIdle, enabled = true }: UseIdleTimerProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        onIdle();
      }, timeout);
    }
  };

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    // Start the timer
    resetTimer();

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        resetTimer();
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        clearTimer();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Add event listeners for user activity (web only)
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        resetTimer();
      };

      events.forEach(event => {
        window.addEventListener(event, handleActivity, true);
      });

      return () => {
        clearTimer();
        subscription?.remove();
        events.forEach(event => {
          window.removeEventListener(event, handleActivity, true);
        });
      };
    }

    return () => {
      clearTimer();
      subscription?.remove();
    };
  }, [timeout, onIdle, enabled]);

  return { resetTimer, clearTimer };
}