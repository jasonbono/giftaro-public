import { BASE_URL } from "@/lib/constants";
import { pingIndexNow } from "@/lib/indexnow";
import { listGuides } from "@/lib/content";
import { listOccasions } from "@/data/occasions";

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/why", "/support", "/privacy", "/terms"];

function authorized(req: Request): boolean {
  const expected = process.env.INDEXNOW_TRIGGER_SECRET;
  if (!expected) return false;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(provided && provided === expected);
}

async function allUrls(): Promise<string[]> {
  const guides = await listGuides();
  const occasions = listOccasions();
  return [
    ...STATIC_PATHS.map((p) => `${BASE_URL}${p}`),
    ...guides.map((g) => `${BASE_URL}/guides/${g.slug}`),
    ...occasions.map((o) => `${BASE_URL}/group-gift/${o.slug}`),
  ];
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return new Response("unauthorized", { status: 401 });
  }
  const urls = await allUrls();
  const result = await pingIndexNow(urls);
  return Response.json({ pinged: urls.length, ...result });
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return new Response("unauthorized", { status: 401 });
  }
  const urls = await allUrls();
  return Response.json({ urls });
}
