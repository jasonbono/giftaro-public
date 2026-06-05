"use client";

import { useState } from "react";
import { useGiftUrl } from "@/hooks/use-gift-url";
import { useShare } from "@/hooks/use-share";
import { Button } from "@/components/ui";
import { COPY_FEEDBACK_MS } from "@/lib/constants";

export function ShareActions({ giftId, giftTitle }: { giftId: string; giftTitle: string }) {
  const url = useGiftUrl(giftId);
  const { share } = useShare({ url, title: giftTitle });
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }

  return (
    <div className="flex gap-2">
      <Button onClick={share} shape="block" className="flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share
      </Button>
      <Button
        onClick={copy}
        variant="secondary"
        aria-label={copied ? "Copied" : "Copy link"}
        className="shrink-0 rounded-xl px-4 py-3 text-sm"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
