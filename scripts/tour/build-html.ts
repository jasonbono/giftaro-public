/**
 * Builds a single self-contained tour.html from captured screenshots.
 *
 * Layout: sticky sidebar TOC on the left, grid of 2-3 mobile screenshots
 * per row on the right, grouped by section. Images are inlined as base64
 * data URLs so the HTML works as a single file you can drop anywhere.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { Shot } from "./capture";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildHtml(shots: Shot[], inDir: string, outFile: string, branch: string) {
  // Group by section, preserving order of first appearance.
  const order: string[] = [];
  const groups = new Map<string, Shot[]>();
  for (const s of shots) {
    if (!groups.has(s.section)) {
      groups.set(s.section, []);
      order.push(s.section);
    }
    groups.get(s.section)!.push(s);
  }

  const inlineImg = (file: string) => {
    const p = path.join(inDir, file);
    const buf = fs.readFileSync(p);
    const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const generated = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";

  const sidebar = order
    .map((section) => {
      const items = groups
        .get(section)!
        .map((s) => `<li><a href="#${slug(section)}-${slug(s.label)}">${escapeHtml(s.label)}</a></li>`)
        .join("");
      return `<li class="section-link"><a href="#${slug(section)}">${escapeHtml(section)}</a><ul>${items}</ul></li>`;
    })
    .join("");

  const sections = order
    .map((section) => {
      const cards = groups
        .get(section)!
        .map((s) => {
          const id = `${slug(section)}-${slug(s.label)}`;
          return `
            <figure class="shot" id="${id}">
              <img src="${inlineImg(s.file)}" alt="${escapeHtml(s.label)}" loading="lazy">
              <figcaption>${escapeHtml(s.label)}</figcaption>
            </figure>`;
        })
        .join("");
      return `
        <section id="${slug(section)}">
          <h2>${escapeHtml(section)}</h2>
          <div class="grid">${cards}</div>
        </section>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Giftaro tour — ${escapeHtml(branch)}</title>
<style>
  :root {
    --bg: #fafaf9;
    --surface: #fff;
    --ink: #18181b;
    --muted: #71717a;
    --border: #e4e4e7;
    --accent: #16a34a;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--ink); background: var(--bg);
  }
  .layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
  aside {
    position: sticky; top: 0; align-self: start;
    height: 100vh; overflow-y: auto;
    background: var(--surface); border-right: 1px solid var(--border);
    padding: 24px 20px;
  }
  aside h1 { font-size: 16px; margin: 0 0 4px; }
  aside .meta { font-size: 12px; color: var(--muted); margin-bottom: 20px; }
  aside ul { list-style: none; padding: 0; margin: 0; }
  aside .section-link > a {
    display: block; padding: 6px 0; font-weight: 600; color: var(--ink);
    text-decoration: none; font-size: 13px; margin-top: 8px;
  }
  aside .section-link > a:hover { color: var(--accent); }
  aside .section-link ul { padding-left: 8px; border-left: 1px solid var(--border); margin: 2px 0 4px; }
  aside .section-link ul a {
    display: block; padding: 3px 0 3px 8px;
    color: var(--muted); text-decoration: none; font-size: 12px;
  }
  aside .section-link ul a:hover { color: var(--ink); }
  main { padding: 32px 40px; }
  section { margin-bottom: 48px; scroll-margin-top: 16px; }
  section h2 { font-size: 20px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 24px;
  }
  .shot { margin: 0; scroll-margin-top: 16px; }
  .shot img {
    display: block; width: 100%;
    border-radius: 14px; border: 1px solid var(--border);
    background: #fff;
  }
  .shot figcaption {
    margin-top: 8px; font-size: 12px; color: var(--muted); text-align: center;
  }
  @media (max-width: 800px) {
    .layout { grid-template-columns: 1fr; }
    aside { position: static; height: auto; }
    main { padding: 20px; }
  }
</style>
</head>
<body>
<div class="layout">
  <aside>
    <h1>Giftaro tour</h1>
    <div class="meta">${escapeHtml(branch)} · ${escapeHtml(generated)}</div>
    <ul>${sidebar}</ul>
  </aside>
  <main>${sections}</main>
</div>
</body>
</html>`;

  fs.writeFileSync(outFile, html);
}

export function currentBranch(): string {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: path.resolve(__dirname, "../..") })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}
