// Client-side image normalization. Runs before POSTing to /api/upload so
// big iPhone photos (5–12MB) fit under Vercel's ~4.5MB serverless body limit,
// and so HEIC/HEIF captures get re-encoded to JPEG (our server MIME allowlist
// doesn't accept them).

const SAFE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const JPEG_QUALITIES = [0.85, 0.75, 0.6];

export type PrepareImageError =
  | { kind: "gif-too-large" }
  | { kind: "decode-failed" }
  | { kind: "still-too-large" };

export type PrepareImageResult =
  | { file: File }
  | { error: PrepareImageError };

export async function prepareImageForUpload(file: File): Promise<PrepareImageResult> {
  if (SAFE_TYPES.includes(file.type) && file.size <= MAX_UPLOAD_BYTES) {
    return { file };
  }
  // GIFs get rejected rather than re-encoded — canvas would lose the animation.
  if (file.type === "image/gif") {
    return { error: { kind: "gif-too-large" } };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { error: { kind: "decode-failed" } };
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { error: { kind: "decode-failed" } };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of JPEG_QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      return { file: new File([blob], `${base}.jpg`, { type: "image/jpeg" }) };
    }
  }
  return { error: { kind: "still-too-large" } };
}

export function prepareImageErrorMessage(err: PrepareImageError): string {
  switch (err.kind) {
    case "gif-too-large":
      return "GIFs must be under 4MB";
    case "decode-failed":
      return "Couldn't read that image — try a different file";
    case "still-too-large":
      return "Image is too large even after shrinking — try a smaller photo";
  }
}
