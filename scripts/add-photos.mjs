// Adds any new photos in public/photos to data/photos.ts.
//
//   npm run photos         add new photos
//   npm run photos:tidy    blank out any leftover sample text (titles made from file names,
//                          sample themes and stories, made-up camera details)
//   npm run photos:clean   remove entries whose photo file has been deleted
//
// For every new photo it:
//   - reads the camera, lens, settings and year from the photo itself and fills in "details"
//   - removes hidden data like the GPS location, so it's safe to publish
//   - shrinks it to 2560px on the long side if it's bigger, and turns sideways phone photos upright
//   - adds an entry to the end of data/photos.ts
// Title, theme and story start out blank. Writing them is optional: a photo with nothing written
// simply shows on its own, and its story view shows the camera details.
//
// Got the original, unshrunk photos somewhere else? This fills in camera details for photos
// that were added before this feature existed (matched by file name):
//   npm run photos -- --camera-from "/path/to/folder/of/originals"

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import exifReader from "exif-reader";

// fileURLToPath handles folder names with spaces (e.g. "Uni shi/Meg Website")
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photoDir = path.join(root, "public", "photos");
const dataFile = path.join(root, "data", "photos.ts");
const MAX = 2560;

const IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);
const VIDEO = new Set([".mp4", ".mov", ".webm"]);

const q = (t) => JSON.stringify(t);
const toSlug = (name) =>
  name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toTitle = (slug) => slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

// ---------- camera details from the photo itself ----------

// Sony's model codes aren't the names people know
const SONY = {
  "ILCE-1": "A1", "ILCE-9": "A9", "ILCE-9M2": "A9 II", "ILCE-9M3": "A9 III",
  "ILCE-7": "A7", "ILCE-7M2": "A7 II", "ILCE-7M3": "A7 III", "ILCE-7M4": "A7 IV",
  "ILCE-7R": "A7R", "ILCE-7RM2": "A7R II", "ILCE-7RM3": "A7R III", "ILCE-7RM3A": "A7R IIIA",
  "ILCE-7RM4": "A7R IV", "ILCE-7RM4A": "A7R IVA", "ILCE-7RM5": "A7R V",
  "ILCE-7S": "A7S", "ILCE-7SM2": "A7S II", "ILCE-7SM3": "A7S III",
  "ILCE-7C": "A7C", "ILCE-7CM2": "A7C II", "ILCE-7CR": "A7CR",
  "ILCE-6000": "A6000", "ILCE-6100": "A6100", "ILCE-6300": "A6300", "ILCE-6400": "A6400",
  "ILCE-6500": "A6500", "ILCE-6600": "A6600", "ILCE-6700": "A6700", "ILCE-5100": "A5100",
};
const titleCase = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

function cameraFrom(exifBuffer) {
  let ex;
  try {
    ex = exifReader(exifBuffer);
  } catch {
    return null;
  }
  const img = ex.Image || ex.image || {};
  const ph = ex.Photo || ex.exif || {};
  const details = [];

  let make = String(img.Make || "").replace(/\0/g, "").trim();
  let model = String(img.Model || "").replace(/\0/g, "").trim();
  const isPhone = /apple|samsung|google|pixel/i.test(make) || /iphone|pixel|galaxy/i.test(model);
  if (model) {
    if (/^sony$/i.test(make)) model = `Sony ${SONY[model] || model}`;
    else if (/^apple$/i.test(make)) model = model; // "iPhone 15 Pro" already says what it is
    else if (make && !model.toLowerCase().startsWith(make.split(" ")[0].toLowerCase())) {
      const brand = make.split(" ")[0];
      model = `${brand.length <= 4 ? brand.toUpperCase() : titleCase(brand)} ${model}`;
    }
    details.push(["Camera", model.replace(/\s+/g, " ")]);
  }

  const lens = String(ph.LensModel || "").replace(/\0/g, "").trim();
  if (!isPhone) {
    if (lens) details.push(["Lens", lens]);
    else if (ph.FocalLength) details.push(["Lens", `${Math.round(ph.FocalLength)}mm`]);
  }

  const settings = [];
  const t = ph.ExposureTime;
  if (t) settings.push(t < 1 ? `1/${Math.round(1 / t)}s` : `${+t.toFixed(1)}s`);
  if (ph.FNumber) settings.push(`f/${+ph.FNumber.toFixed(1)}`);
  const iso = ph.ISOSpeedRatings ?? ph.PhotographicSensitivity;
  if (iso) settings.push(`ISO ${Array.isArray(iso) ? iso[0] : iso}`);
  if (settings.length) details.push(["Settings", settings.join(", ")]);

  const taken = ph.DateTimeOriginal || ph.DateTimeDigitized || img.DateTime;
  const year = taken instanceof Date && !isNaN(taken) ? String(taken.getFullYear()) : null;
  return { details, year };
}

const detailsCode = (details) =>
  details.length
    ? `details: [\n${details.map(([l, v]) => `      { label: ${q(l)}, value: ${q(v)} },`).join("\n")}\n    ],`
    : "";

// ---------- walking the entries in data/photos.ts ----------
function entries(data) {
  const start = data.indexOf("= [", data.indexOf("export const works")) + 2;
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
  return blocks;
}
// Apply a change to each entry (works backwards so positions stay valid)
function editEntries(data, fn) {
  let count = 0;
  for (const [a, b] of entries(data).reverse()) {
    const before = data.slice(a, b);
    const after = fn(before);
    if (after !== before) {
      data = data.slice(0, a) + after + data.slice(b);
      count++;
    }
  }
  return [data, count];
}

// Sample text from earlier versions of this helper, so photos:tidy can recognise and remove it
const SAMPLE_TEXT = [
  "Stillness, and learning to wait for the right moment.",
  "Colour, contrast, and the energy of a busy place.",
  "A quiet portrait about comfort and familiarity.",
  "One short line about the theme of this photo.",
  "I took this early one morning when the light was still soft",
  "This was shot on a Saturday afternoon when the whole street was packed.",
  "I asked a close friend to sit for this one in her own apartment",
  "Write the story of how this photo came about.",
];
// The made-up details always paired a camera with a location, which real camera data never includes
const SAMPLE_DETAILS = [["Sony A7 III", "Vancouver, BC"], ["Fujifilm X-T4", "Granville Island"], ["Canon EOS R6", "Kitsilano"]];

function tidy(block) {
  const slug = block.match(/slug:\s*"([^"]+)"/)?.[1] || "";
  let out = block;
  // a title that's just the file name, e.g. "Img 3158" or "Dsc07433"
  const title = out.match(/title:\s*"([^"]*)"/)?.[1];
  if (title && (title === toTitle(slug) || title === toTitle(slug.replace(/-\d+$/, "")))) out = out.replace(/title:\s*"[^"]*"/, 'title: ""');
  const theme = out.match(/theme:\s*"([^"]*)"/)?.[1];
  if (theme && SAMPLE_TEXT.includes(theme)) out = out.replace(/theme:\s*"[^"]*"/, 'theme: ""');
  out = out.replace(/story:\s*\[[\s\S]*?\],/, (m) => (SAMPLE_TEXT.some((s) => m.includes(s)) ? "story: []," : m));
  out = out.replace(/\n\s*details:\s*\[[\s\S]*?\],/, (m) =>
    SAMPLE_DETAILS.some(([cam, place]) => m.includes(`"${cam}"`) && m.includes(`"${place}"`)) ? "" : m
  );
  return out;
}

// ---------- main ----------
let data = fs.readFileSync(dataFile, "utf8");
const args = process.argv.slice(2);

if (args.includes("--tidy")) {
  const [next, n] = editEntries(data, tidy);
  fs.writeFileSync(dataFile, next);
  console.log(n ? `Cleared sample text from ${n} photo${n > 1 ? "s" : ""}. Anything you wrote yourself was left alone.` : "No sample text found.");
  process.exit(0);
}

const listed = new Set([...data.matchAll(/src:\s*"([^"]+)"/g)].map((m) => m[1]));
const slugs = new Set([...data.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]));

// Read camera details, then strip all hidden data (including GPS location) from every photo
const camera = new Map();
let cleaned = 0;
for (const f of fs.readdirSync(photoDir)) {
  if (f.startsWith(".") || !IMAGE.has(path.extname(f).toLowerCase())) continue;
  const full = path.join(photoDir, f);
  const meta = await sharp(full).metadata();
  if (meta.exif) {
    const c = cameraFrom(meta.exif);
    if (c) camera.set(f, c);
  }
  if (!meta.exif && !meta.xmp && !meta.iptc) continue;
  const opts = meta.format === "jpeg" ? { quality: 92, mozjpeg: true } : {};
  const buf = await sharp(full).rotate().toFormat(meta.format, opts).toBuffer();
  fs.writeFileSync(full, buf);
  cleaned++;
}
if (cleaned) console.log(`Removed hidden data (like GPS location) from ${cleaned} photo${cleaned > 1 ? "s" : ""}.`);

// Existing photos that still had their camera data (e.g. replaced files) get their details filled in
const fillFrom = (lookup) =>
  editEntries(data, (block) => {
    if (/details:\s*\[\s*\{/.test(block)) return block; // already has details
    const src = block.match(/src:\s*"\/photos\/([^"]+)"/)?.[1];
    const c = src && lookup(src, block);
    if (!c || !c.details.length) return block;
    let out = block.replace(/\n\s*details:\s*\[\s*\],/, "");
    if (c.year) out = out.replace(/year:\s*"[^"]*"/, `year: "${c.year}"`);
    return out.replace(/\n(\s*)\}$/, `\n    ${detailsCode(c.details)}\n$1}`);
  });

let filled = 0;
[data, filled] = fillFrom((src) => camera.get(src));

// --camera-from "<folder>": read camera details from her original photos, matched by file name
const fromIdx = args.indexOf("--camera-from");
if (fromIdx >= 0) {
  const dir = args[fromIdx + 1];
  if (!dir || !fs.existsSync(dir)) {
    console.log(`! Couldn't find the folder "${dir || ""}". Put its path in quotes after --camera-from.`);
  } else {
    const originals = new Map();
    for (const f of fs.readdirSync(dir)) {
      if (!IMAGE.has(path.extname(f).toLowerCase())) continue;
      const meta = await sharp(path.join(dir, f)).metadata().catch(() => null);
      const c = meta?.exif && cameraFrom(meta.exif);
      if (c) originals.set(toSlug(f), c);
    }
    let n = 0;
    [data, n] = fillFrom((src, block) => {
      const slug = block.match(/slug:\s*"([^"]+)"/)?.[1] || toSlug(src);
      return originals.get(slug) || originals.get(slug.replace(/-\d+$/, ""));
    });
    filled += n;
    console.log(`Read camera details from ${originals.size} original${originals.size === 1 ? "" : "s"}.`);
  }
}
if (filled) {
  fs.writeFileSync(dataFile, data);
  console.log(`Filled in camera details for ${filled} existing photo${filled > 1 ? "s" : ""}.`);
}

// New photos
const added = [];
const videos = [];
for (const file of fs.readdirSync(photoDir).filter((f) => !f.startsWith(".")).sort()) {
  const ext = path.extname(file).toLowerCase();
  if (VIDEO.has(ext)) {
    videos.push(file);
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
  const tidyName = `${slug}${ext === ".jpeg" ? ".jpg" : ext}`;
  if (tidyName !== file && !fs.existsSync(path.join(photoDir, tidyName))) {
    fs.renameSync(path.join(photoDir, file), path.join(photoDir, tidyName));
    name = tidyName;
  }

  const full = path.join(photoDir, name);
  const meta = await sharp(full).metadata();
  let w = meta.width, h = meta.height;
  if (Math.max(w, h) > MAX) {
    const buf = await sharp(full).resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true }).toBuffer();
    fs.writeFileSync(full, buf);
    const m2 = await sharp(full).metadata();
    w = m2.width; h = m2.height;
  }

  const c = camera.get(file) || { details: [], year: null };
  added.push(`  {
    slug: ${q(slug)},
    title: "",
    theme: "",
    src: "/photos/${name}",
    width: ${w},
    height: ${h},
    year: "${c.year || new Date().getFullYear()}",
    category: "Photography",
    story: [],
    ${detailsCode(c.details) || "details: [],"}
  },`);
}

if (added.length) {
  const end = data.lastIndexOf("];");
  data = data.slice(0, end) + added.join("\n") + "\n" + data.slice(end);
  fs.writeFileSync(dataFile, data);
  const withCam = added.filter((a) => a.includes('label: "Camera"')).length;
  console.log(`\nAdded ${added.length} new photo${added.length > 1 ? "s" : ""} to the end of data/photos.ts` +
    (withCam ? ` (${withCam} with camera details filled in).` : "."));
  console.log("Title, theme and story are blank. Fill in any you like; blank ones just show the photo.");
} else if (!filled) {
  console.log("No new photos found in public/photos.");
}

// Entries whose photo has been deleted
const missing = [...listed].filter((src) => !fs.existsSync(path.join(root, "public", src)));
if (args.includes("--clean") && missing.length) {
  data = fs.readFileSync(dataFile, "utf8");
  let removed = 0;
  for (const [a, b] of entries(data).reverse()) {
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
  console.log("\nVideos found in public/photos. Films go in public/films instead, then run  npm run films");
}
