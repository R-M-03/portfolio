// Adds any new videos in public/films to the Films section.
//
// Run it with:  npm run films
//
// Drop videos straight from her phone or camera (.mov, .mp4, .m4v...) into public/films, then run it.
// For each new video it:
//   - converts it to a web-friendly MP4 that plays in every browser (iPhone HDR footage included)
//   - keeps it small enough for GitHub and fast to load (1080p, under about 45MB)
//   - removes hidden data like GPS location from the file
//   - saves a cover image from a frame partway through
//   - moves the big original out of the website into film-originals/ (kept safe, not uploaded)
//   - adds an entry to data/films.ts with sample text to replace
//
// npm run films:clean  removes entries in data/films.ts whose video file has been deleted.

import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filmDir = path.join(root, "public", "films");
const originalsDir = path.join(root, "film-originals");
const dataFile = path.join(root, "data", "films.ts");

const VIDEO = new Set([".mov", ".mp4", ".m4v", ".avi", ".mkv", ".webm", ".mts"]);
const TARGET_MB = 45;

const toSlug = (name) =>
  name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "film";
const toTitle = (slug) => slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const q = (t) => JSON.stringify(t);
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + "MB";

const SAMPLES = [
  {
    theme: "A short film about slowing down and noticing the small things.",
    story: [
      "I filmed this over a couple of days, mostly in the early morning when the light was soft and the streets were still quiet.",
      "There was no script. I just followed what felt interesting and found the shape of it in the edit, which is how most of my favourite work starts.",
    ],
    details: [["Role", "Director, Camera, Edit"], ["Camera", "iPhone 15 Pro"], ["Location", "Vancouver, BC"]],
  },
  {
    theme: "Movement, music, and the energy of a single night.",
    story: [
      "This came together quickly with a few friends and one borrowed light. We had about three hours and used every minute of it.",
      "I cut it to the music first and then went back to find shots that matched the rhythm, rather than the other way around.",
    ],
    details: [["Role", "Cinematographer, Edit"], ["Camera", "Sony FX3"], ["Location", "Downtown Vancouver"]],
  },
];

if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
  console.log("The video converter isn't installed yet. Run  npm install  first, then try again.");
  process.exit(1);
}

// ---------- read a video's details ----------
function probe(file) {
  const out = spawnSync(ffmpegPath, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr || "";
  const d = out.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const duration = d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0;
  const vline = out.split("\n").find((l) => /Stream #.*Video:/.test(l)) || "";
  const size = vline.match(/, (\d{2,5})x(\d{2,5})/);
  let width = size ? +size[1] : 0;
  let height = size ? +size[2] : 0;
  const rot = out.match(/rotation of (-?\d+(?:\.\d+)?) degrees/);
  if (rot && Math.abs(Math.round(+rot[1])) % 180 === 90) [width, height] = [height, width];
  const transfer = /arib-std-b67/.test(vline) ? "arib-std-b67" : /smpte2084/.test(vline) ? "smpte2084" : null;
  return {
    duration,
    width,
    height,
    hdr: transfer,
    codec: (vline.match(/Video: (\w+)/) || [])[1],
    pix: (vline.match(/Video: [^,]+, (\w+)/) || [])[1],
    audio: /Stream #.*Audio:/.test(out),
  };
}

const hasZscale = /\szscale\s/.test(
  spawnSync(ffmpegPath, ["-hide_banner", "-filters"], { encoding: "utf8" }).stdout || ""
);

// ---------- convert one video ----------
function convert(input, output, info) {
  // Long films get a lower bitrate cap so the file stays under the size target
  const audioK = info.audio ? 160 : 0;
  let videoK = Math.floor((TARGET_MB * 8 * 1024) / Math.max(info.duration, 1) - audioK);
  videoK = Math.min(videoK, 12000);
  const landscape = info.width >= info.height;
  let [boxW, boxH] = landscape ? [1920, 1080] : [1080, 1920];
  if (videoK < 2500) [boxW, boxH] = landscape ? [1280, 720] : [720, 1280];

  const scale = `scale=w='min(${boxW},iw)':h='min(${boxH},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;
  let vf = `${scale},format=yuv420p`;
  if (info.hdr && hasZscale) {
    // iPhone HDR footage: map its extra-bright colours down to normal web colours so it doesn't look washed out
    vf =
      `${scale},zscale=tin=${info.hdr}:pin=bt2020:min=bt2020nc:t=linear:npl=203,format=gbrpf32le,` +
      `zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`;
  }

  const args = [
    "-hide_banner", "-y", "-i", input,
    "-map", "0:v:0", ...(info.audio ? ["-map", "0:a:0"] : []),
    "-map_metadata", "-1", // strips GPS location, device info etc.
    "-vf", vf,
    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-profile:v", "high",
    "-maxrate", `${videoK}k`, "-bufsize", `${videoK * 2}k`,
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    ...(info.audio ? ["-c:a", "aac", "-b:a", "160k", "-ac", "2"] : ["-an"]),
    "-movflags", "+faststart",
    "-progress", "pipe:1", "-nostats", "-loglevel", "error",
    output,
  ];

  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args);
    let err = "";
    p.stdout.on("data", (buf) => {
      const m = String(buf).match(/out_time_us=(\d+)/g);
      if (m && info.duration) {
        const t = +m[m.length - 1].split("=")[1] / 1e6;
        const pct = Math.min(99, Math.floor((t / info.duration) * 100));
        process.stdout.write(`\r  converting... ${pct}%   `);
      }
    });
    p.stderr.on("data", (b) => (err += b));
    p.on("close", (code) => {
      process.stdout.write("\r                          \r");
      code === 0 ? resolve() : reject(new Error(err.trim().split("\n").slice(-3).join("\n")));
    });
  });
}

function poster(video, jpg, duration) {
  const at = Math.max(0, Math.min(duration * 0.2, duration - 0.5));
  spawnSync(ffmpegPath, [
    "-hide_banner", "-loglevel", "error", "-y", "-ss", at.toFixed(2), "-i", video,
    "-frames:v", "1", "-vf", "scale='min(1600,iw)':-2", "-q:v", "3", jpg,
  ]);
}

const runtime = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function ensureGitignore() {
  const gi = path.join(root, ".gitignore");
  const text = fs.existsSync(gi) ? fs.readFileSync(gi, "utf8") : "";
  if (!/^film-originals\/?$/m.test(text)) fs.writeFileSync(gi, text.replace(/\n?$/, "\n") + "film-originals\n");
}

// ---------- remove entries whose video is gone ----------
function clean() {
  let data = fs.readFileSync(dataFile, "utf8");
  const start = data.indexOf("= [", data.indexOf("export const films")) + 2;
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
    if (src && !fs.existsSync(path.join(root, "public", src))) {
      const lineStart = data.lastIndexOf("\n", a) + 1;
      let end = b;
      if (data[end] === ",") end++;
      if (data[end] === "\n") end++;
      data = data.slice(0, lineStart) + data.slice(end);
      removed++;
    }
  }
  fs.writeFileSync(dataFile, data);
  console.log(`Removed ${removed} film entr${removed === 1 ? "y" : "ies"} whose video was deleted.`);
}

// ---------- main ----------
if (process.argv.includes("--clean")) {
  clean();
  process.exit(0);
}

fs.mkdirSync(filmDir, { recursive: true });
let data = fs.readFileSync(dataFile, "utf8");
const listed = new Set([...data.matchAll(/src:\s*"([^"]+)"/g)].map((m) => m[1]));
const slugs = new Set([...data.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]));

const files = fs
  .readdirSync(filmDir)
  .filter((f) => !f.startsWith(".") && VIDEO.has(path.extname(f).toLowerCase()) && !listed.has(`/films/${f}`))
  .sort();

if (!files.length) {
  console.log("No new videos found in public/films.");
  process.exit(0);
}

const added = [];
let n = 0;
for (const file of files) {
  n++;
  const input = path.join(filmDir, file);
  const info = probe(input);
  if (!info.width || !info.duration) {
    console.log(`! ${file}: couldn't read this video, skipping it.`);
    continue;
  }
  console.log(`\n[${n}/${files.length}] ${file}  (${info.width}x${info.height}, ${runtime(info.duration)}, ${mb(fs.statSync(input).size)}${info.hdr ? ", HDR" : ""})`);

  let slug = toSlug(file);
  for (let k = 2; slugs.has(slug) || (fs.existsSync(path.join(filmDir, `${slug}.mp4`)) && `${slug}.mp4` !== file); k++)
    slug = `${toSlug(file)}-${k}`;
  slugs.add(slug);

  const out = path.join(filmDir, `${slug}.mp4`);
  const tmp = path.join(filmDir, `.${slug}.converting.mp4`);
  try {
    await convert(input, tmp, info);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    console.log(`! ${file}: conversion failed.\n${e.message}`);
    continue;
  }

  // Keep the original safe outside the website
  fs.mkdirSync(originalsDir, { recursive: true });
  let keep = path.join(originalsDir, file);
  for (let k = 2; fs.existsSync(keep); k++) keep = path.join(originalsDir, `${path.parse(file).name}-${k}${path.extname(file)}`);
  fs.renameSync(input, keep);
  fs.renameSync(tmp, out);
  ensureGitignore();

  const done = probe(out);
  poster(out, path.join(filmDir, `${slug}.jpg`), done.duration);
  const size = fs.statSync(out).size;
  console.log(`  done: films/${slug}.mp4  ${done.width}x${done.height}, ${mb(size)}${info.hdr && !hasZscale ? "  (HDR colours may look a little flat)" : ""}`);
  if (size > 95 * 1024 * 1024) console.log("  ! Still over 95MB: GitHub won't accept it. Consider trimming it or hosting it on Vimeo.");

  const ratio = done.width / done.height;
  const s = SAMPLES[(slugs.size + added.length) % SAMPLES.length];
  added.push(`  {
    slug: ${q(slug)},
    title: ${q(toTitle(slug))},
    theme: ${q(s.theme)},
    src: "/films/${slug}.mp4",
    poster: "/films/${slug}.jpg",${Math.abs(ratio - 16 / 9) > 0.03 ? `\n    ratio: "${done.width}/${done.height}",` : ""}
    year: "${new Date().getFullYear()}",
    category: "Film",
    runtime: "${runtime(done.duration)}",
    story: [
${s.story.map((p) => `      ${q(p)},`).join("\n")}
    ],
    details: [
${s.details.map(([l, v]) => `      { label: ${q(l)}, value: ${q(v)} },`).join("\n")}
    ],
  },`);
}

if (added.length) {
  data = fs.readFileSync(dataFile, "utf8");
  const end = data.lastIndexOf("];");
  data = data.slice(0, end) + added.join("\n") + "\n" + data.slice(end);
  fs.writeFileSync(dataFile, data);
  console.log(`\nAdded ${added.length} film${added.length > 1 ? "s" : ""} to the end of data/films.ts.`);
  console.log("Open that file and replace the sample title, theme, story and details.");
  console.log("The full-quality originals were moved to the film-originals folder.");
}
