"use client";

import { useEffect, useRef, useState } from "react";
import { useSharedInViewObserver } from "./in-view-observer";

export function useInView<T extends HTMLElement>() {
  const observe = useSharedInViewObserver();
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (observe) {
      return observe(el, () => setInView(true));
    }

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setInView(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [observe]);

  return { ref, inView };
}
