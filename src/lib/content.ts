import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type GuideFrontmatter = {
  title: string;
  description: string;
  date: string;
  updated?: string;
  author?: string;
  tags?: string[];
  related?: string[];
  image?: string;
};

export type GuideSummary = GuideFrontmatter & { slug: string };
export type GuideFull = GuideSummary & { body: string };

const GUIDES_DIR = path.join(process.cwd(), "src", "content", "guides");

async function readDirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

function isMdx(file: string): boolean {
  return file.endsWith(".mdx") || file.endsWith(".md");
}

function slugFromFile(file: string): string {
  return file.replace(/\.mdx?$/, "");
}

function parseFrontmatter(raw: string): { data: GuideFrontmatter; content: string } {
  const parsed = matter(raw);
  const fm = parsed.data as Partial<GuideFrontmatter>;
  if (!fm.title || !fm.description || !fm.date) {
    throw new Error("Guide frontmatter must include title, description, and date");
  }
  return {
    data: {
      title: fm.title,
      description: fm.description,
      date: fm.date,
      updated: fm.updated,
      author: fm.author,
      tags: fm.tags,
      related: fm.related,
      image: fm.image,
    },
    content: parsed.content,
  };
}

export async function listGuides(): Promise<GuideSummary[]> {
  const files = await readDirSafe(GUIDES_DIR);
  const guides: GuideSummary[] = [];
  for (const file of files) {
    if (!isMdx(file)) continue;
    const raw = await fs.readFile(path.join(GUIDES_DIR, file), "utf-8");
    const { data } = parseFrontmatter(raw);
    guides.push({ slug: slugFromFile(file), ...data });
  }
  guides.sort((a, b) => (a.date < b.date ? 1 : -1));
  return guides;
}

export async function loadGuide(slug: string): Promise<GuideFull | null> {
  for (const ext of [".mdx", ".md"] as const) {
    const file = path.join(GUIDES_DIR, `${slug}${ext}`);
    try {
      const raw = await fs.readFile(file, "utf-8");
      const { data, content } = parseFrontmatter(raw);
      return { slug, ...data, body: content };
    } catch {
      // try next
    }
  }
  return null;
}

export async function guideSlugs(): Promise<string[]> {
  const files = await readDirSafe(GUIDES_DIR);
  return files.filter(isMdx).map(slugFromFile);
}
