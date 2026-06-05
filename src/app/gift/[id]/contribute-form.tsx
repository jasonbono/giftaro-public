"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PixelArtModal } from "@/components/pixel-art-modal";
import { Input as FormInput, Textarea as FormTextarea, Button } from "@/components/ui";
import { prepareImageForUpload, prepareImageErrorMessage } from "@/lib/image-client";

const AMOUNTS = [10, 25, 50, 100];

const STOCK_IMAGES = [
  { src: "/gift_blue_smile_v4.png", label: "Gift" },
  { src: "/stock/heart_3d.png", label: "Heart" },
  { src: "/stock/party_3d.png", label: "Party" },
  { src: "/stock/cake_3d.png", label: "Cake" },
  { src: "/stock/balloon_3d.png", label: "Balloon" },
  { src: "/stock/star_3d.png", label: "Star" },
  { src: "/stock/cheers_3d.png", label: "Cheers" },
  { src: "/stock/champagne_3d.png", label: "Champagne" },
  { src: "/stock/fire_3d.png", label: "Fire" },
  { src: "/stock/trophy_3d.png", label: "Trophy" },
  { src: "/stock/rainbow_3d.png", label: "Rainbow" },
  { src: "/stock/rocket_3d.png", label: "Rocket" },
  { src: "/stock/ring_3d.png", label: "Ring" },
  { src: "/stock/gradcap_3d.png", label: "Graduation" },
  { src: "/stock/teddy_3d.png", label: "Teddy bear" },
  { src: "/stock/unicorn_3d.png", label: "Unicorn" },
  { src: "/stock/xmas_3d.png", label: "Christmas" },
  { src: "/stock/pizza_3d.png", label: "Pizza" },
];

const STORAGE_KEY = "giftaro_contribute_form";

type FormDraft = {
  amount: number | "";
  customAmount: string;
  name: string;
  note: string;
  stockImage: string | null;
};

function loadDraft(giftId: string): FormDraft | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}_${giftId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(giftId: string, draft: FormDraft) {
  try {
    sessionStorage.setItem(`${STORAGE_KEY}_${giftId}`, JSON.stringify(draft));
  } catch {}
}

export function clearContributeDraft(giftId: string) {
  try {
    sessionStorage.removeItem(`${STORAGE_KEY}_${giftId}`);
  } catch {}
}

export function ClearContributeDraft({ giftId }: { giftId: string }) {
  useEffect(() => {
    clearContributeDraft(giftId);
  }, [giftId]);
  return null;
}

export function ContributeForm({ giftId, defaultName }: { giftId: string; defaultName?: string }) {
  const [amount, setAmount] = useState<number | "">("");
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stockImage, setStockImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAllEmoji, setShowAllEmoji] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [pixelArtOpen, setPixelArtOpen] = useState(false);
  const [pixelArtSaving, setPixelArtSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Stable per-attempt key so a retry after a dropped response reuses the
  // same Stripe Checkout Session instead of creating a duplicate.
  const idempotencyKeyRef = useRef<string | null>(null);
  if (idempotencyKeyRef.current === null && typeof crypto !== "undefined" && crypto.randomUUID) {
    idempotencyKeyRef.current = crypto.randomUUID();
  }

  useEffect(() => {
    const draft = loadDraft(giftId);
    if (draft) {
      setAmount(draft.amount);
      setCustomAmount(draft.customAmount);
      setName(draft.name);
      setNote(draft.note);
      if (draft.stockImage) setStockImage(draft.stockImage);
      if (draft.note || draft.stockImage) setCardOpen(true);
    } else if (defaultName) {
      setName(defaultName);
    }
  }, [giftId, defaultName]);

  const persistDraft = useCallback(
    (patch: Partial<FormDraft>) => {
      const current: FormDraft = { amount, customAmount, name, note, stockImage };
      saveDraft(giftId, { ...current, ...patch });
    },
    [giftId, amount, customAmount, name, note, stockImage]
  );

  const selectedAmount =
    typeof amount === "number" ? amount : parseFloat(customAmount) || 0;

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const prepared = await prepareImageForUpload(file);
    if ("error" in prepared) {
      setError(prepareImageErrorMessage(prepared.error));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(prepared.file);
    setStockImage(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(prepared.file);
  }

  function selectStockImage(src: string) {
    setStockImage(src);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    persistDraft({ stockImage: src });
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setStockImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    persistDraft({ stockImage: null });
  }

  async function handlePixelArtSave(dataUrl: string) {
    setPixelArtSaving(true);
    try {
      const res = await fetch("/api/pixel-art/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStockImage(data.url);
      setImagePreview(dataUrl);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPixelArtOpen(false);
      persistDraft({ stockImage: data.url });
    } finally {
      setPixelArtSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedAmount < 1) return;
    setLoading(true);
    setError("");

    try {
      let contributor_image_url: string | undefined;

      if (stockImage) {
        contributor_image_url = stockImage;
      } else if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch(`/api/gifts/${giftId}/upload`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        setUploading(false);
        if (!uploadRes.ok) {
          setError(uploadData.error || "Image upload failed");
          setLoading(false);
          return;
        }
        contributor_image_url = uploadData.url;
      }

      const res = await fetch(`/api/gifts/${giftId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: Math.round(selectedAmount * 100),
          contributor_name: name || undefined,
          contributor_note: note || undefined,
          contributor_image_url,
          idempotency_key: idempotencyKeyRef.current || undefined,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Connection error. Please try again.");
      setUploading(false);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
        onChange={handleImageSelect}
        className="hidden"
      />

      <div className="grid grid-cols-4 gap-2">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAmount(a);
              setCustomAmount("");
              setError("");
              persistDraft({ amount: a, customAmount: "" });
            }}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              amount === a
                ? "border-brand bg-brand text-white"
                : "border-zinc-200 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            ${a}
          </button>
        ))}
      </div>

      <div>
        <FormInput
          type="number"
          placeholder="Custom amount"
          min="1"
          step="0.01"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setAmount("");
            setError("");
            persistDraft({ customAmount: e.target.value, amount: "" });
          }}
        />
      </div>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        Only the gift organizer sees your amount
      </p>

      <div>
        <FormInput
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            persistDraft({ name: e.target.value });
          }}
        />
      </div>

      {!cardOpen ? (
        <button
          type="button"
          onClick={() => setCardOpen(true)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-left text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
        >
          Sign the card (optional)
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Your card
            </span>
            <button
              type="button"
              onClick={() => setCardOpen(false)}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Hide
            </button>
          </div>

          <div>
            <FormTextarea
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                persistDraft({ note: e.target.value });
              }}
              rows={2}
              maxLength={500}
              className="resize-none"
            />
          </div>

          <div>
            {imagePreview || stockImage ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(imagePreview || stockImage)!}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs text-white dark:bg-zinc-50 dark:text-zinc-900"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-6 gap-2">
                  {(showAllEmoji ? STOCK_IMAGES : STOCK_IMAGES.slice(0, 6)).map((img) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => selectStockImage(img.src)}
                      className="overflow-hidden rounded-lg border border-zinc-200 transition-all hover:scale-110 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={img.label} className="h-full w-full" />
                    </button>
                  ))}
                </div>
                {STOCK_IMAGES.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllEmoji(!showAllEmoji)}
                    className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showAllEmoji ? "Show less" : `+${STOCK_IMAGES.length - 6} more`}
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPixelArtOpen(true)}
                    className="flex-1 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
                  >
                    Draw pixel art
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
                  >
                    Upload photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading || selectedAmount < 1}
      >
        {uploading
          ? "Uploading photo..."
          : loading
          ? "Redirecting..."
          : selectedAmount >= 1
            ? `Chip in $${selectedAmount % 1 === 0 ? selectedAmount.toFixed(0) : selectedAmount.toFixed(2)}`
            : "Select an amount"}
      </Button>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        A small processing fee is added at checkout.
      </p>
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
              clipRule="evenodd"
            />
          </svg>
          Secured by Stripe — no account needed
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Your card details never touch Giftaro
        </p>
      </div>

      <PixelArtModal
        open={pixelArtOpen}
        onClose={() => setPixelArtOpen(false)}
        onSave={handlePixelArtSave}
        saving={pixelArtSaving}
      />
    </form>
  );
}
