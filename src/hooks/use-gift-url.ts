"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useGiftUrl(giftId: string, path?: string): string {
  return useSyncExternalStore(
    subscribe,
    () => `${window.location.origin}/gift/${giftId}${path || ""}`,
    () => ""
  );
}
