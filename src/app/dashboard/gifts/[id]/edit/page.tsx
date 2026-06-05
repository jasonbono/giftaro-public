"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { GiftForm, type GiftFormInitialData } from "../../gift-form";

export default function EditGiftPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<GiftFormInitialData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/gifts/${id}`);
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        const gift = await res.json();
        setInitialData({
          giftName: gift.og_title || "",
          title: gift.title,
          description: gift.description || "",
          organizerName: gift.organizer_name || "",
          targetAmount: (gift.target_amount_cents / 100).toString(),
          raisedCents: gift.total_contributed_cents || 0,
          imageUrl: gift.og_image || null,
          imageZoom: gift.image_zoom ?? 1,
          imageOffsetX: gift.image_offset_x ?? 0,
          imageOffsetY: gift.image_offset_y ?? 0,
          aiImagesGenerated: gift.ai_images_generated ?? 0,
          imageGallery: gift.image_gallery ?? null,
        });
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (loading || !initialData) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader inlineNav>
        <Link
          href={`/dashboard/gifts/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          &larr; Back
        </Link>
      </AppHeader>
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Edit gift page
        </h1>
        <GiftForm mode="edit" giftId={id} initialData={initialData} />
      </main>
    </div>
  );
}
