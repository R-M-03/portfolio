// Adds any new photos in public/photos to data/photos.ts.
//
// Run it with:  npm run photos
//
// For every image in public/photos that isn't on the site yet, it:
//   - shrinks it to 2560px on the long side if it's bigger (keeps the site fast)
//   - works out the correct width and height (including photos taken sideways on a phone)
//   - adds a ready-to-fill entry to the end of data/photos.ts
// It also removes hidden data like GPS location from every photo, so it's safe to publish.
// Each new entry comes with a sample story and camera details to show the format.
// Then all you do is open data/photos.ts and replace them with the real ones.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// fileURLToPath handles folder names with spaces (e.g. "Uni shi/Meg Website")
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photoDir = path.join(root, "public", "photos");
const dataFile = path.join(root, "data", "photos.ts");
const MAX = 2560;

const IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);
const VIDEO = new Set([".mp4", ".mov", ".webm"]);

// Sample text so each new entry shows the format. Replace it with the real story and details.
// Any "details" line can be deleted if it doesn't apply, or you can add your own (e.g. Client, Edit).
const SAMPLES = [
  {
    theme: "Stillness, and learning to wait for the right moment.",
    story: [
      "I took this early one morning when the light was still soft and nobody else was around. I had walked past this spot many times but had never really stopped to look at it.",
      "I stayed for about half an hour, trying different angles and waiting for the light to change. This was one of the last frames I took before packing up.",
      "Looking back, it reminds me that the best photos usually come from slowing down rather than chasing something new.",
    ],
    details: [["Camera", "Sony A7 III"], ["Lens", "35mm f/1.8"], ["Settings", "1/200s, f/4, ISO 100"], ["Location", "Vancouver, BC"]],
  },
  {
    theme: "Colour, contrast, and the energy of a busy place.",
    story: [
      "This was shot on a Saturday afternoon when the whole street was packed. I wanted to capture how chaotic it felt without the photo itself feeling messy.",
      "I found a spot a little above the crowd and waited for a gap where the colours lined up. It took a lot of attempts to get one frame where everything worked together.",
    ],
    details: [["Camera", "Fujifilm X-T4"], ["Lens", "23mm f/2"], ["Settings", "1/500s, f/5.6, ISO 400"], ["Location", "Granville Island"]],
  },
  {
    theme: "A quiet portrait about comfort and familiarity.",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [["Camera", "Canon EOS R6"], ["Lens", "50mm f/1.8"], ["Settings", "1/160s, f/2.2, ISO 800"], ["Location", "Kitsilano"]],
  },
];

const q = (t) => JSON.stringify(t);
const sampleFields = (k) => {
  const x = SAMPLES[k % SAMPLES.length];
  return {
    theme: `theme: ${q(x.theme)},`,
    rest: `story: [
${x.story.map((p) => `      ${q(p)},`).join("\n")}
    ],
    details: [
${x.details.map(([l, v]) => `      { label: ${q(l)}, value: ${q(v)} },`).join("\n")}
    ],`,
  };
};

const toSlug = (name) =>
  name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toTitle = (slug) => slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

let data = fs.readFileSync(dataFile, "utf8");
const listed = new Set([...data.matchAll(/src:\s*"([^"]+)"/g)].map((m) => m[1]));
const slugs = new Set([...data.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]));

// Privacy: photos from phones and cameras carry hidden data, including the GPS location they were
// taken at. Strip it from every photo (the picture itself is unchanged; sideways photos are turned upright).
let cleaned = 0;
for (const f of fs.readdirSync(photoDir)) {
  if (f.startsWith(".") || !IMAGE.has(path.extname(f).toLowerCase())) continue;
  const full = path.join(photoDir, f);
  const meta = await sharp(full).metadata();
  if (!meta.exif && !meta.xmp && !meta.iptc) continue;
  const opts = meta.format === "jpeg" ? { quality: 92, mozjpeg: true } : {};
  const buf = await sharp(full).rotate().toFormat(meta.format, opts).toBuffer();
  fs.writeFileSync(full, buf);
  cleaned++;
}
if (cleaned) console.log(`Removed hidden data (like GPS location) from ${cleaned} photo${cleaned > 1 ? "s" : ""}.`);

const files = fs.readdirSync(photoDir).filter((f) => !f.startsWith(".")).sort();
const added = [];
const videos = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (VIDEO.has(ext)) {
    if (![...data.matchAll(/video:\s*"([^"]+)"/g)].some((m) => m[1] === `/photos/${file}`)) videos.push(file);
    continue;
  }
  if (!IMAGE.has(ext)) {
    if (ext === ".heic") console.log(`! ${file}: HEIC (iPhone) files don't work on websites. Export it as a JPEG first.`);
    continue;
  }
  if (listed.has(`/photos/${file}`)) continue;

  // Tidy the file name (no spaces or capitals) so it works on every server
  let slug = toSlug(file) || "photo";
  for (let n = 2; slugs.has(slug); n++) slug = `${toSlug(file)}-${n}`;
  slugs.add(slug);
  let name = file;
  const tidy = `${slug}${ext === ".jpeg" ? ".jpg" : ext}`;
  if (tidy !== file && !fs.existsSync(path.join(photoDir, tidy))) {
    fs.renameSync(path.join(photoDir, file), path.join(photoDir, tidy));
    console.log(`  renamed "${file}" -> ${tidy}`);
    name = tidy;
  }

  const full = path.join(photoDir, name);
  let img = sharp(full).rotate(); // .rotate() applies the phone's orientation so sideways photos come out upright
  let meta = await sharp(full).metadata();
  let w = meta.width, h = meta.height;
  if (meta.orientation && meta.orientation >= 5) [w, h] = [h, w];

  if (Math.max(w, h) > MAX || (meta.orientation && meta.orientation > 1)) {
    const buf = await img.resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true }).toBuffer();
    fs.writeFileSync(full, buf);
    const m2 = await sharp(full).metadata();
    if (Math.max(w, h) > MAX) console.log(`  resized ${name}: ${w}x${h} -> ${m2.width}x${m2.height}`);
    w = m2.width; h = m2.height;
  }

  const sample = sampleFields(slugs.size + added.length);
  added.push(`  {
    slug: "${slug}",
    title: "${toTitle(slug)}",
    ${sample.theme}
    src: "/photos/${name}",
    width: ${w},
    height: ${h},
    year: "${new Date().getFullYear()}",
    category: "Photography",
    ${sample.rest}
  },`);
}

// Upgrade entries made by the earlier version of this helper (one-line placeholder, no details)
let upgraded = 0;
data = data.replace(
  /theme: "One short line about the theme of this photo\.",(\n[\s\S]*?)story: \[\n\s*"Write the story of how this photo came about\. Each paragraph goes in its own set of quotes\.",\n\s*\],/g,
  (_, middle) => {
    const sample = sampleFields(upgraded++);
    return `${sample.theme}${middle}${sample.rest}`;
  }
);
if (upgraded) {
  fs.writeFileSync(dataFile, data);
  console.log(`Filled in sample stories and details for ${upgraded} existing photo${upgraded > 1 ? "s" : ""}.`);
}

if (added.length) {
  const end = data.lastIndexOf("];");
  data = data.slice(0, end) + added.join("\n") + "\n" + data.slice(end);
  fs.writeFileSync(dataFile, data);
  console.log(`\nAdded ${added.length} new photo${added.length > 1 ? "s" : ""} to the end of data/photos.ts.`);
  console.log("Open that file and replace the sample title, theme, story and details.");
} else if (!upgraded) {
  console.log("No new photos found in public/photos.");
}

const missing = [...listed].filter((src) => !fs.existsSync(path.join(root, "public", src)));

// npm run photos:clean  removes entries whose image file has been deleted
if (process.argv.includes("--clean") && missing.length) {
  data = fs.readFileSync(dataFile, "utf8");
  const start = data.indexOf("= [", data.indexOf("export const works")) + 2;
  // Walk the list one { ... } entry at a time, ignoring braces inside quoted text
  const blocks = [];
  let depth = 0, from = -1, quote = null;
  for (let i = start + 1; i < data.length; i++) {
    const ch = data[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") { if (depth++ === 0) from = i; }
    else if (ch === "}") { if (--depth === 0) blocks.push([from, i + 1]); }
    else if (ch === "]" && depth === 0) break;
  }
  let removed = 0;
  for (const [a, b] of blocks.reverse()) {
    const src = data.slice(a, b).match(/src:\s*"([^"]+)"/)?.[1];
    if (src && missing.includes(src)) {
      const lineStart = data.lastIndexOf("\n", a) + 1;
      let end = b;
      if (data[end] === ",") end++;
      if (data[end] === "\n") end++;
      data = data.slice(0, lineStart) + data.slice(end);
      removed++;
    }
  }
  fs.writeFileSync(dataFile, data);
  console.log(`\nRemoved ${removed} entr${removed === 1 ? "y" : "ies"} whose image was deleted.`);
  missing.length = 0;
}

if (missing.length) {
  console.log("\n! These are listed in data/photos.ts but the file isn't in public/photos:");
  missing.forEach((m) => console.log("  " + m));
  console.log("  Run  npm run photos:clean  to remove those entries.");
}

if (videos.length) {
  console.log("\nVideos found in public/photos. Films go in public/films and data/films.ts instead (see README):");
  videos.forEach((v) => console.log("  " + v));
}
