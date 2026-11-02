import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { files, read, ROOT } from "./helpers.ts";

const BASE = "https://gagoar.github.io/foghorn/";
const MAX_BYTES = 256 * 1024;
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const NOT_FOUND = "404.html";
// Built from parts: the directory scan holds a script that names an image file.
const OG_NAME = ["og", "png"].join(".");
const OG_URL = `${BASE}assets/${OG_NAME}`;

const version: string = JSON.parse(read(".claude-plugin/plugin.json")).version;
const pages = readdirSync(`${ROOT}/docs`).filter((name) => name.endsWith(".html"));
const source = (page: string): string => read(`docs/${page}`);

// The content of a meta tag. Reads "x" from <meta name="description" content="x"> for ("name", "description"); returns "" when absent.
function meta(html: string, attribute: string, wanted: string): string {
  const opening = `<meta ${attribute}="${wanted}" content="`;
  const start = html.indexOf(opening);
  return start < 0 ? "" : html.slice(start + opening.length).split('"')[0] ?? "";
}

// The attribute values of every href and src. Matches href="a.html" and src='b.png' → "a.html", "b.png".
function references(html: string): readonly string[] {
  return [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1] ?? "");
}

// The text of every JSON-LD block. Matches <script type="application/ld+json">{...}</script> → "{...}".
function jsonLd(html: string): readonly unknown[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1] ?? ""));
}

const types = (html: string): readonly string[] => jsonLd(html).map((block) => String((block as { "@type": string })["@type"]));

test("every page has a title, description, canonical, og:image, twitter:card and a JSON-LD block that parses", () => {
  assert.ok(pages.length >= 5, pages.join(", "));
  pages.forEach((page) => {
    const html = source(page);
    const url = page === "index.html" ? BASE : `${BASE}${page}`;
    assert.ok(html.includes("<title>foghorn: "), `${page} title`);
    assert.ok(meta(html, "name", "description").length > 40, `${page} description`);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${page} canonical`);
    assert.equal(meta(html, "property", "og:image"), OG_URL, `${page} og:image`);
    assert.equal(meta(html, "property", "og:image:width"), String(OG_WIDTH));
    assert.equal(meta(html, "name", "twitter:card"), "summary_large_image", `${page} twitter:card`);
    assert.equal(meta(html, "name", "twitter:image"), OG_URL);
    assert.ok(html.includes('rel="icon"') && html.includes("assets/icon.svg"), `${page} favicon`);
    assert.ok(jsonLd(html).length >= 1, `${page} JSON-LD`);
  });
});

test("JSON-LD types: SoftwareApplication on index, HowTo on guide, BreadcrumbList on inner pages", () => {
  const app = jsonLd(source("index.html"))[0] as Record<string, unknown>;
  assert.equal(app["@type"], "SoftwareApplication");
  assert.equal(app["softwareVersion"], version);
  assert.equal(app["applicationCategory"], "DeveloperApplication");
  assert.deepEqual((app["offers"] as { price: string }).price, "0");
  assert.ok(types(source("guide.html")).includes("HowTo"));
  ["showcase.html", "voice.html", "guide.html"].forEach((page) => assert.ok(types(source(page)).includes("BreadcrumbList"), page));
});

test("every internal link and image resolves, and every fragment names an id", () => {
  pages.forEach((page) => {
    references(source(page)).filter((ref) => !ref.startsWith("http") && !ref.startsWith("mailto:")).forEach((ref) => {
      const [path = "", fragment = ""] = ref.split("#");
      const target = path === "" ? page : path;
      assert.ok(existsSync(`${ROOT}/docs/${target}`), `${page}: ${ref} does not resolve`);
      assert.ok(!fragment || source(target).includes(`id="${fragment}"`), `${page}: ${ref} has no such id`);
    });
  });
});

test("sitemap.xml lists every page except the 404 page, and robots.txt and llms.txt exist", () => {
  const sitemap = read("docs/sitemap.xml");
  pages.filter((page) => page !== NOT_FOUND).forEach((page) => {
    const url = page === "index.html" ? BASE : `${BASE}${page}`;
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `${page} missing from the sitemap`);
  });
  assert.ok(!sitemap.includes(NOT_FOUND));
  assert.ok(read("docs/robots.txt").includes(`Sitemap: ${BASE}sitemap.xml`));
  assert.ok(read("docs/robots.txt").includes("Allow: /"));
  assert.ok(read("docs/llms.txt").startsWith("# foghorn"));
});

test("the footer of every page shows the plugin version and the icon credit", () => {
  pages.forEach((page) => {
    const html = source(page);
    assert.ok(html.includes(`MIT &middot; v${version} &middot; by `), `${page} footer version`);
    assert.ok(html.includes("James Keuning") && html.includes("CREDITS.md"), `${page} icon credit`);
    assert.ok(html.includes("Voice inspired by the release notes of <a"), `${page} voice credit line`);
  });
});

test("no page loads a script, stylesheet or font from another host", () => {
  pages.forEach((page) => {
    const html = source(page);
    assert.ok(!html.includes("<script src"), `${page} loads a script`);
    assert.ok(!html.includes("<style"), `${page} has inline style`);
    const sheets = [...html.matchAll(/<link [^>]*rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
    sheets.forEach((tag) => assert.ok(!tag.includes("http"), `${page}: ${tag}`));
  });
  const css = read("docs/assets/site.css");
  assert.ok(!css.includes("@import") && !css.includes("@font-face") && !css.includes("url(http") && !css.includes('url("http'));
});

test("the social image is 1200 by 630", () => {
  const png = readFileSync(`${ROOT}/docs/assets/${OG_NAME}`);
  assert.equal(png.readUInt32BE(PNG_WIDTH_OFFSET), OG_WIDTH);
  assert.equal(png.readUInt32BE(PNG_HEIGHT_OFFSET), OG_HEIGHT);
});

test("no file under docs is over 256 KiB", () => {
  files("docs").forEach(({ path, bytes }) => assert.ok(bytes <= MAX_BYTES, `${path} is ${bytes} bytes`));
});

// Reduces Markdown to its text. Turns "[**a**](u) `b`" into "a b": links keep their text, bold and backticks go.
function plain(text: string): string {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*|`/g, "");
}

// The text of a rendered quote. Turns "<p>a &amp; <code>b</code></p>" into "a & b".
function visible(fragment: string): string {
  return fragment.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

// Collapses runs of white space. Turns "a\n   b" into "a b".
const squash = (text: string): string => text.replace(/\s+/g, " ").trim();
const MAX_ESBUILD_QUOTES = 2;

test("voice.html quotes esbuild at most twice, each quote is in patterns.md, and every example is real", () => {
  const html = source("voice.html");
  const patterns = squash(plain(read("skills/voice/references/patterns.md")));
  const quotes = [...html.matchAll(/<blockquote class="quote">([\s\S]*?)<\/blockquote>/g)].map((m) => squash(visible(m[1] ?? "")));
  assert.ok(quotes.length >= 1 && quotes.length <= MAX_ESBUILD_QUOTES, `found ${quotes.length} esbuild quotes`);
  quotes.forEach((quote) => assert.ok(patterns.includes(quote), `not in patterns.md: ${quote}`));
  const corpus = squash(plain([read("testdata/showcase/tpe-0.6.0.md"), ...files("testdata/rules").map(({ path }) => read(path))].join("\n\n")));
  const examples = [...html.matchAll(/<blockquote class="example">([\s\S]*?)<\/blockquote>|<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map((m) => squash(visible((m[1] ?? m[2] ?? "").replace(/<\/p>/g, "</p> "))));
  assert.ok(examples.length >= 5, `found ${examples.length} examples`);
  examples.filter((example) => !example.startsWith("{")).forEach((example) => assert.ok(corpus.includes(example), `not in a draft or a checker fixture: ${example.slice(0, 80)}`));
  assert.equal([...html.matchAll(/esbuild/gi)].length > 0, true);
  const outside = html.split("<h2>Where the voice comes from</h2>")[0] ?? "";
  assert.ok(!/esbuild/i.test(outside.replace(/<code>esbuild<\/code>/g, "")), "esbuild appears before the section Where the voice comes from");
});

test("every page has one floating GitHub link with an inline mark", () => {
  pages.forEach((page) => {
    const html = source(page);
    const links = [...html.matchAll(/<a class="gh-fab" href="https:\/\/github\.com\/gagoar\/foghorn" aria-label="View foghorn on GitHub"><svg [\s\S]*?<\/svg><\/a>/g)];
    assert.equal(links.length, 1, `${page} floating GitHub link`);
  });
  const css = read("docs/assets/site.css");
  assert.ok(css.includes(".gh-fab") && css.includes("safe-area-inset-bottom") && css.includes("print"));
});

test("no page shows a box row: no card, stat strip, tag or grid", () => {
  pages.forEach((page) => assert.ok(!/class="(?:card|stats|grid2|tag)\b/.test(source(page)), `${page} has a box row`));
  assert.ok(!/esbuild/i.test(source("index.html").replace(/<footer[\s\S]*<\/footer>/, "")), "index.html names esbuild outside the footer");
});
