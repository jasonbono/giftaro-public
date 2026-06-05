"use client";

import { useEffect, useState } from "react";
import { Confetti } from "@/components/confetti";

const STORAGE_KEY = "giftaro:fundedCelebrationCounts";
const MAX_CELEBRATIONS = 5;

export function FundedCelebration({ giftId }: { giftId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let counts: Record<string, number> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) counts = JSON.parse(raw);
    } catch {}

    if ((counts[giftId] ?? 0) >= MAX_CELEBRATIONS) return;

    setShow(true);
    counts[giftId] = (counts[giftId] ?? 0) + 1;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch {}
  }, [giftId]);

  return show ? <Confetti /> : null;
}
