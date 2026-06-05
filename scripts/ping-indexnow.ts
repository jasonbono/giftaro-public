import { OCCASIONS } from "../src/data/occasions";
import { listGuides } from "../src/lib/content";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://giftaro.app";

const STATIC_PATHS = [
  "/",
  "/why",
  "/support",
  "/privacy",
  "/terms",
  "/group-gift",
];

async function main() {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    console.log(`[indexnow] skipping (VERCEL_ENV=${process.env.VERCEL_ENV})`);
    return;
  }

  const guides = await listGuides();
  const guidesIndex = guides.length > 0 ? ["/guides"] : [];
  const guidePaths = guides.map((g) => `/guides/${g.slug}`);
  const occasionPaths = OCCASIONS.map((o) => `/group-gift/${o.slug}`);

  const paths = [
    ...STATIC_PATHS,
    ...guidesIndex,
    ...guidePaths,
    ...occasionPaths,
  ];
  const urls = paths.map((p) => `${BASE_URL}${p}`);
  const host = new URL(BASE_URL).host;

  console.log(`[indexnow] pinging ${urls.length} URLs at ${host}`);

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    const body = await res.text();
    console.log(`[indexnow] status=${res.status}`, body.slice(0, 300));
  } catch (err) {
    console.error("[indexnow] error:", err);
  }
}

main().catch((err) => {
  console.error("[indexnow] fatal:", err);
});
