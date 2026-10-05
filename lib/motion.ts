"use client";

// Shared by the photo gallery, the grid and the films section: freezes the page behind an open view.
// Counts locks, so the page only unfreezes once every open view (e.g. grid + story) has closed.
let locks = 0;
export function lockScroll(lock: boolean) {
  locks = Math.max(0, locks + (lock ? 1 : -1));
  const frozen = locks > 0;
  const lenis = window.__lenis;
  if (lenis) {
    if (frozen) lenis.stop();
    else lenis.start();
  }
  document.body.style.overflow = frozen ? "hidden" : "";
}

// Apple's go-to easing: fast start, long soft landing.
export const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

// Transform that makes a box at `to` look like it's sitting at `from`.
export function flip(from: DOMRect, to: DOMRect) {
  const x = from.left - to.left;
  const y = from.top - to.top;
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  return `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;
}
