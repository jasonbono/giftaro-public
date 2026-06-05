import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { lookup } from "dns/promises";
import { isIP } from "net";
import { Agent } from "undici";
import { USER_AGENT } from "./constants";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const UPLOAD_MAX_SIZE = 4 * 1024 * 1024; // 4MB for user uploads
const DOWNLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB for OG image downloads

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function safeExtensionFor(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || "bin";
}

export async function validateUpload(
  formData: FormData
): Promise<{ file: File; safeName: string } | NextResponse> {
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return NextResponse.json({ error: "File must be JPEG, PNG, WebP, or GIF" }, { status: 400 });
  if (file.size > UPLOAD_MAX_SIZE)
    return NextResponse.json({ error: "File must be under 4MB" }, { status: 400 });
  // Derive the extension from the validated MIME type rather than trusting the
  // client-supplied filename — keeps attacker-chosen extensions (.html, .svg,
  // .js, etc.) out of the stored blob path.
  const ext = safeExtensionFor(file.type);
  const safeName = `${Date.now()}.${ext}`;
  return { file, safeName };
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true; // link-local / AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIP(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // link-local
    if (/^(fc|fd)[0-9a-f]{2}:/.test(lower)) return true; // unique-local
    const v4Mapped = lower.match(/^::ffff:([0-9.]+)$/);
    if (v4Mapped && isIP(v4Mapped[1]) === 4) return isPrivateIPv4(v4Mapped[1]);
    return false;
  }
  return true; // not a valid IP literal → treat as unsafe
}

// Resolve a URL's host to an IP, verify none of its addresses are private,
// and return the pinned address. Returning the address (rather than a boolean)
// lets the subsequent fetch reuse the same IP via a custom dispatcher, which
// defeats DNS-rebinding attacks where the authoritative server flips from a
// public IP (during validation) to a loopback/RFC1918 IP (during fetch).
async function resolvePublicHost(
  urlString: string
): Promise<{ address: string; family: 4 | 6 } | null> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) return null;
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) return null;

  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) return null;
    return { address: hostname, family: isIP(hostname) as 4 | 6 };
  }

  try {
    const results = await lookup(hostname, { all: true });
    if (results.length === 0) return null;
    for (const { address } of results) {
      if (isPrivateIP(address)) return null;
    }
    const first = results[0];
    return { address: first.address, family: first.family as 4 | 6 };
  } catch {
    return null;
  }
}

// True for URLs we trust to render in <img src> without proxying: stock images
// shipped with the app (relative paths) and our own Vercel Blob storage. Used
// to gate endpoints that store user-submitted image URLs so organizers can't
// point gift images at attacker-controlled hosts (visitor IP leak + swap-at-
// will content control).
export function isAllowedOwnBlobUrl(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host.endsWith(".vercel-storage.com") ||
      host.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

const MAX_GALLERY_LENGTH = 4000;

// Validate a serialized image_gallery payload (JSON string of
// [{url, source}, ...]). Returns the input string if every entry is on our
// own blob / static assets; otherwise returns null. Prevents organizers from
// smuggling arbitrary external image URLs into the gift page via endpoints
// that would otherwise store the value unchecked.
export function validateImageGallery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length > MAX_GALLERY_LENGTH) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") return null;
    const url = (entry as { url?: unknown }).url;
    if (typeof url !== "string" || !isAllowedOwnBlobUrl(url)) return null;
  }
  return raw;
}

export async function proxyImageToBlob(
  imageUrl: string,
  prefix: string = "gifts/images"
): Promise<string | null> {
  // Already on our blob storage — skip. Check the parsed hostname so that
  // a URL like https://attacker.com/?x=.vercel-storage.com can't bypass the
  // SSRF guard below via substring matching.
  try {
    const host = new URL(imageUrl).hostname.toLowerCase();
    if (host.endsWith(".vercel-storage.com") || host.endsWith(".public.blob.vercel-storage.com")) {
      return imageUrl;
    }
  } catch {
    return null;
  }

  try {
    const MAX_REDIRECTS = 3;
    let currentUrl = imageUrl;
    let res: Response | null = null;

    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      const pinned = await resolvePublicHost(currentUrl);
      if (!pinned) return null;

      // Pin DNS resolution to the pre-validated IP for the duration of the
      // fetch. Without this, undici would resolve the host again and an
      // attacker could race a DNS-rebinding flip between our check and the
      // outbound connection.
      const dispatcher = new Agent({
        connect: {
          lookup: (_host, _opts, cb) => cb(null, pinned.address, pinned.family),
        },
      });

      res = await fetch(currentUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "image/*",
        },
        signal: AbortSignal.timeout(5000),
        redirect: "manual",
        // @ts-expect-error undici dispatcher isn't in the global fetch types
        dispatcher,
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return null;
        currentUrl = new URL(location, currentUrl).href;
        continue;
      }
      break;
    }

    if (!res || !res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    const mimeType = contentType.split(";")[0].trim();
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > DOWNLOAD_MAX_SIZE) return null;

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) return null; // skip tiny images (tracking pixels etc)
    if (buffer.byteLength > DOWNLOAD_MAX_SIZE) return null;

    const filename = `${prefix}/${Date.now()}.${safeExtensionFor(mimeType)}`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: mimeType,
    });

    return blob.url;
  } catch {
    return null;
  }
}
