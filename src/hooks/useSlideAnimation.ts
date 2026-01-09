"use client";

import { useState, useEffect, useCallback } from "react";

interface UseSlideAnimationOptions {
  slideIndex: number;
  totalDelayMs?: number; // Total time for all animations to complete
}

interface AnimationState {
  isAnimating: boolean;
  animationKey: number;
}

/**
 * Hook to trigger staggered animations when slide changes
 * Returns an animation key that changes with each slide transition
 */
export function useSlideAnimation({
  slideIndex,
  totalDelayMs = 800,
}: UseSlideAnimationOptions): AnimationState {
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Increment key to trigger re-animation
    setAnimationKey((prev) => prev + 1);
    setIsAnimating(true);

    // Mark animation as complete after total delay
    const timeout = setTimeout(() => {
      setIsAnimating(false);
    }, totalDelayMs);

    return () => clearTimeout(timeout);
  }, [slideIndex, totalDelayMs]);

  return { isAnimating, animationKey };
}

/**
 * Helper to generate className for animated elements
 * Use this to apply staggered animations based on element order
 */
export function getAnimatedClassName(
  animationKey: number,
  baseAnimation: string,
  delayMs: number
): string {
  return `animate-initial ${baseAnimation} animate-delay-${delayMs}`;
}

/**
 * Predefined animation delay presets for common slide elements
 */
export const SLIDE_ANIMATION_DELAYS = {
  header: 0,
  playerStrip: 100,
  title: 200,
  subtitle: 300,
  content: 400,
  sticker: 500,
  speechBubble: 650,
  footer: 200,
} as const;

/**
 * Hook to manage animation state with reset capability
 */
export function useAnimationReset(slideIndex: number): {
  key: number;
  reset: () => void;
} {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [slideIndex]);

  const reset = useCallback(() => {
    setKey((prev) => prev + 1);
  }, []);

  return { key, reset };
}
