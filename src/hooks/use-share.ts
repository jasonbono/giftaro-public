"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { COPY_FEEDBACK_MS } from "@/lib/constants";

const subscribe = () => () => {};

export function useShare(config: {
  url: string;
  title?: string;
  text?: string;
}): { share: () => Promise<void>; copied: boolean } {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(subscribe, () => !!navigator.share, () => false);

  const share = useCallback(async () => {
    if (canShare) {
      try {
        await navigator.share({
          ...(config.title ? { title: config.title } : {}),
          ...(config.text ? { text: config.text } : {}),
          url: config.url,
        });
        return;
      } catch {
        // User cancelled
      }
    }
    const copyText = config.text ? `${config.text} ${config.url}` : config.url;
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, [canShare, config.url, config.title, config.text]);

  return { share, copied };
}
