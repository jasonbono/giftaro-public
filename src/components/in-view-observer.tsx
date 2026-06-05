"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type ObserveFn = (el: Element, onIntersect: () => void) => () => void;

const InViewCtx = createContext<ObserveFn | null>(null);

export function InViewProvider({
  children,
  threshold = 0.1,
}: {
  children: ReactNode;
  threshold?: number;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbacks = useRef(new WeakMap<Element, () => void>());

  const observe = useMemo<ObserveFn>(() => {
    return (el, cb) => {
      if (typeof IntersectionObserver === "undefined") {
        queueMicrotask(cb);
        return () => {};
      }
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const fn = callbacks.current.get(entry.target);
              if (fn) {
                fn();
                observerRef.current?.unobserve(entry.target);
                callbacks.current.delete(entry.target);
              }
            }
          },
          { threshold },
        );
      }
      callbacks.current.set(el, cb);
      observerRef.current.observe(el);
      return () => {
        observerRef.current?.unobserve(el);
        callbacks.current.delete(el);
      };
    };
  }, [threshold]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return <InViewCtx.Provider value={observe}>{children}</InViewCtx.Provider>;
}

export function useSharedInViewObserver() {
  return useContext(InViewCtx);
}
