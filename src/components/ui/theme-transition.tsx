"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";

// Wraps next-themes setTheme with a View Transitions API cross-fade.
// Falls back silently in browsers that don't support startViewTransition.
export function useThemeTransition() {
  const { setTheme } = useTheme();

  const setThemeWithTransition = useCallback(
    (newTheme: string, event?: React.MouseEvent) => {
      // No View Transitions support → just switch
      if (!document.startViewTransition) {
        setTheme(newTheme);
        return;
      }

      // Clip-path circle expand from click origin (or center of screen)
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;

      // Distance to farthest corner
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = document.startViewTransition(() => {
        setTheme(newTheme);
      });

      transition.ready.then(() => {
        const isDark = newTheme === "dark";
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          { clipPath: isDark ? clipPath : [...clipPath].reverse() },
          {
            duration: 420,
            easing: "ease-in-out",
            pseudoElement: isDark
              ? "::view-transition-new(root)"
              : "::view-transition-old(root)",
          },
        );
      });
    },
    [setTheme],
  );

  return { setTheme: setThemeWithTransition };
}
