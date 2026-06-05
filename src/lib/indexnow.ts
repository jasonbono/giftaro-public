import { BASE_URL } from "@/lib/constants";

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

function host(): string {
  return new URL(BASE_URL).host;
}

export async function pingIndexNow(urls: string[]): Promise<{ ok: boolean; status: number; body: string }> {
  if (urls.length === 0) return { ok: true, status: 200, body: "no urls" };
  const payload = {
    host: host(),
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: String(err) };
  }
}
