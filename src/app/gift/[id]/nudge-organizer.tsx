"use client";

import { useGiftUrl } from "@/hooks/use-gift-url";
import { useShare } from "@/hooks/use-share";
import { Button } from "@/components/ui";

export function NudgeOrganizerButton({
  giftId,
  organizerName,
  giftTitle,
}: {
  giftId: string;
  organizerName: string;
  giftTitle: string;
}) {
  const url = useGiftUrl(giftId);
  const firstName = organizerName.split(" ")[0] || organizerName;
  const text = `Hey ${firstName}! I'd love to chip in for ${giftTitle} — can you finish setting it up?`;
  const { share, copied } = useShare({ url, title: giftTitle, text });

  return (
    <Button onClick={share} shape="block" size="lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {copied ? "Copied!" : `Nudge ${firstName}`}
    </Button>
  );
}
