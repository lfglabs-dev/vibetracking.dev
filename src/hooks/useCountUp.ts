"use client";

import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  enabled?: boolean;
  formatter?: (value: number) => string;
}

// Easing function: easeOutExpo
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp({
  start = 0,
  end,
  duration = 800,
  delay = 0,
  enabled = true,
  formatter,
}: UseCountUpOptions): string {
  const [currentValue, setCurrentValue] = useState(start);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCurrentValue(start);
      return;
    }

    const startAnimation = () => {
      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        const newValue = start + (end - start) * easedProgress;

        setCurrentValue(newValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [start, end, duration, delay, enabled]);

  // Format the value
  if (formatter) {
    return formatter(currentValue);
  }

  // Default formatting based on magnitude
  if (end >= 1_000_000_000) {
    return (currentValue / 1_000_000_000).toFixed(1) + "B";
  }
  if (end >= 1_000_000) {
    return (currentValue / 1_000_000).toFixed(1) + "M";
  }
  if (end >= 1_000) {
    return (currentValue / 1_000).toFixed(1) + "K";
  }
  return Math.round(currentValue).toString();
}

// Utility hook for counting up with a trigger (resets on key change)
export function useCountUpWithKey(
  key: string | number,
  options: Omit<UseCountUpOptions, "enabled">
): string {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [key]);

  return useCountUp({ ...options, enabled: animationKey > 0 });
}
