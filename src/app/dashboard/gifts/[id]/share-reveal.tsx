"use client";

import { useGiftUrl } from "@/hooks/use-gift-url";
import { useShare } from "@/hooks/use-share";

export function ShareRevealButton({ giftId }: { giftId: string }) {
  const url = useGiftUrl(giftId, "/reveal");
  const { share, copied } = useShare({
    url,
    text: "Your friends got you something! Open this to see:",
  });

  return (
    <button
      onClick={share}
      className="w-full rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
    >
      {copied ? "Link copied!" : "Share reveal page with the recipient"}
    </button>
  );
}
