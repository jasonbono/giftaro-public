"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function Confetti() {
  useEffect(() => {
    const end = Date.now() + 1500;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#f472b6", "#facc15", "#34d399", "#60a5fa", "#c084fc"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#f472b6", "#facc15", "#34d399", "#60a5fa", "#c084fc"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return null;
}
