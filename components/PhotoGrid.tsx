"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Work } from "@/data/photos";
import { lockScroll } from "@/lib/motion";

type Row = { items: number[]; h: number };
type Layout = { rows: Row[]; width: number; scroll: boolean };

// Rows of photos that fill the width exactly, every photo keeping its own shape (no cropping).
// First tries to fit everything on one screen, choosing the number of rows that makes the photos
// as big as possible. If that would make them too small, it switches to a scrolling grid instead.
function computeLayout(ars: number[], W: number, H: number, minRow: number, GAP: number): Layout {
  const n = ars.length;
  if (!n || W <= 0 || H <= 0) return { rows: [], width: W, scroll: false };

  const build = (width: number, groups: number[][]): Row[] =>
    groups.map((items) => ({
      items,
      h: (width - GAP * (items.length - 1)) / items.reduce((s, i) => s + ars[i], 0),
    }));

  // Split into r rows with roughly equal total width
  const split = (r: number) => {
    const total = ars.reduce((a, b) => a + b, 0);
    const groups: number[][] = Array.from({ length: r }, () => []);
    let cum = 0;
    ars.forEach((a, i) => {
      groups[Math.min(r - 1, Math.floor(((cum + a / 2) / total) * r))].push(i);
      cum += a;
    });
    return groups.filter((g) => g.length);
  };

  let best: { area: number; groups: number[][]; scale: number } | null = null;
  for (let r = 1; r <= n; r++) {
    const groups = split(r);
    const rows = build(W, groups);
    const height = rows.reduce((s, row) => s + row.h, 0) + GAP * (rows.length - 1);
    let scale = Math.min(1, H / height);
    const tallest = Math.max(...rows.map((row) => row.h)) * scale;
    if (tallest > H * 0.62) scale *= (H * 0.62) / tallest; // a single huge row looks odd
    const area = rows.reduce((s, row) => s + row.items.reduce((t, i) => t + row.h * row.h * ars[i], 0), 0) * scale * scale;
    if (!best || area > best.area) best = { area, groups, scale };
  }

  const width = W * best!.scale;
  const rows = build(width, best!.groups);
  if (Math.min(...rows.map((r) => r.h)) >= minRow) return { rows, width, scroll: false };

  // Too many photos to fit on one screen nicely: justified rows that scroll
  const target = Math.max(minRow * 1.5, 220);
  const out: Row[] = [];
  let cur: number[] = [];
  ars.forEach((a, i) => {
    cur.push(i);
    const h = (W - GAP * (cur.length - 1)) / cur.reduce((s, j) => s + ars[j], 0);
    if (h <= target) {
      out.push({ items: cur, h });
      cur = [];
    }
  });
  if (cur.length) out.push({ items: cur, h: target }); // last row keeps a natural height, left-aligned
  return { rows: out, width: W, scroll: true };
}

export default function PhotoGrid({
  works,
  lifted,
  onOpen,
  onClose,
  paused,
  tileRefs,
}: {
  works: Work[];
  lifted: number | null;
  onOpen: (i: number) => void;
  onClose: () => void;
  paused: boolean; // true while a story is open on top, so Esc only closes that
  tileRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}) {
  const body = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [closing, setClosing] = useState(false);

  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      setBox({
        w: el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        h: el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 380);
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !paused) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, paused]);

  const ars = works.map((w) => w.width / w.height);
  const small = box.w < 600;
  const gap = small ? 6 : 12;
  const layout = computeLayout(ars, box.w, box.h, small ? 84 : 130, gap);

  return (
    <div className={`grid-view ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" aria-label="All photographs">
      <header className="grid-head">
        <div>
          <p className="eyebrow">Photographs · {String(works.length).padStart(2, "0")}</p>
          <h2 className="script">The Collection</h2>
        </div>
        <button className="close grid-close" onClick={close} aria-label="Close the grid">
          <span />
          <span />
        </button>
      </header>

      <div
        ref={body}
        className={`grid-body ${layout.scroll ? "is-scrolling" : ""}`}
        data-lenis-prevent
      >
        <div className="grid-rows" style={{ width: layout.width, gap }}>
          {layout.rows.map((row, r) => (
            <div key={r} className="grid-row" style={{ height: row.h, gap }}>
              {row.items.map((i) => {
                const w = works[i];
                return (
                  <button
                    key={w.slug}
                    ref={(el) => {
                      tileRefs.current[i] = el;
                    }}
                    className={`grid-tile ${lifted === i ? "is-lifted" : ""}`}
                    style={{ width: row.h * ars[i], "--i": i } as React.CSSProperties}
                    onClick={() => {
                      (document.activeElement as HTMLElement | null)?.blur();
                      onOpen(i);
                    }}
                    aria-label={`Open ${w.title}`}
                  >
                    <Image
                      src={w.src}
                      alt={w.title}
                      width={w.width}
                      height={w.height}
                      sizes="(max-width: 900px) 92vw, 70vw"
                    />
                    <span className="grid-cap">
                      <span className="script">{w.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
