"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Work } from "@/data/photos";
import { EASE, flip, lockScroll } from "@/lib/motion";
import PhotoGrid from "@/components/PhotoGrid";

export default function Gallery({ works }: { works: Work[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [closingView, setClosingView] = useState(false);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [active, setActive] = useState(0);
  const [inGallery, setInGallery] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const rooms = useRef<(HTMLElement | null)[]>([]);
  const frames = useRef<(HTMLDivElement | null)[]>([]);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll-linked motion: every room knows how close it is to the middle of the screen
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      let best = 0;
      let bestDist = Infinity;

      rooms.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = r.top + r.height / 2 - vh / 2;
        const p = Math.max(-1, Math.min(1, dist / (vh / 2 + r.height / 2)));
        el.style.setProperty("--p", reduce ? "0" : p.toFixed(4));
        el.style.setProperty("--e", reduce ? "1" : (1 - Math.abs(p)).toFixed(4));
        if (Math.abs(dist) < bestDist) {
          bestDist = Math.abs(dist);
          best = i;
        }
      });

      const root = document.documentElement;
      root.style.setProperty("--hero", reduce ? "0" : Math.min(1, window.scrollY / (vh * 0.7)).toFixed(4));

      const first = rooms.current[0]?.getBoundingClientRect();
      const last = rooms.current[rooms.current.length - 1]?.getBoundingClientRect();
      setInGallery(!!first && !!last && first.top < vh * 0.55 && last.bottom > vh * 0.45);
      setActive(best);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Open a piece straight from a shared link like yoursite.com/#first-light
  useEffect(() => {
    const slug = window.location.hash.slice(1);
    const i = works.findIndex((w) => w.slug === slug);
    if (i >= 0) {
      centerRoom(i);
      setOrigin(null);
      setOpen(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const centerRoom = (i: number) => {
    const el = rooms.current[i];
    if (!el) return;
    const offset = -(window.innerHeight - el.offsetHeight) / 2;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(el, { immediate: true, force: true, offset });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset });
  };

  const openAt = (i: number) => {
    // drop focus from the clicked tile so no focus ring flashes on it when the view closes
    (document.activeElement as HTMLElement | null)?.blur();
    setClosingView(false);
    setOrigin(frames.current[i]?.getBoundingClientRect() ?? null);
    setOpen(i);
    history.replaceState(null, "", `#${works[i].slug}`);
  };

  // Opening a story from the grid: it flies out of the grid tile instead
  const openFromGrid = (i: number) => {
    setClosingView(false);
    setOrigin(tiles.current[i]?.getBoundingClientRect() ?? null);
    setOpen(i);
    history.replaceState(null, "", `#${works[i].slug}`);
  };

  const goTo = useCallback(
    (i: number) => {
      centerRoom(i);
      setOpen(i);
      history.replaceState(null, "", `#${works[i].slug}`);
    },
    [works]
  );

  const close = useCallback(() => {
    setOpen(null);
    setClosingView(false);
    history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <>
      <div className="photos-intro">
        <p className="eyebrow">Photographs</p>
        <button className="view-all" onClick={() => setGridOpen(true)}>
          <GridIcon /> View all {works.length} <span aria-hidden>→</span>
        </button>
      </div>

      <div className="rooms">
        {works.map((w, i) => (
          <section
            key={w.slug}
            ref={(el) => {
              rooms.current[i] = el;
            }}
            className="room"
          >
            <button
              className="room-art"
              onClick={() => openAt(i)}
              aria-label={`Open ${w.title} and read its story`}
              style={{ "--ar": w.width / w.height } as React.CSSProperties}
            >
              {/* Soft glow in the photo's own colours: a tiny, heavily blurred copy sitting behind it */}
              <div className="glow" aria-hidden>
                <Image src={w.src} alt="" fill sizes="64px" quality={40} />
              </div>
              <div
                className={`frame ${open === i ? "is-lifted" : ""}`}
                ref={(el) => {
                  frames.current[i] = el;
                }}
              >
                <div className="parallax">
                  {w.video ? (
                    <video src={w.video} poster={w.src} muted loop playsInline autoPlay />
                  ) : (
                    <Image
                      src={w.src}
                      alt={w.title}
                      width={w.width}
                      height={w.height}
                      sizes="(max-width: 900px) 92vw, 70vw"
                      priority={i < 2}
                    />
                  )}
                </div>
              </div>
            </button>

            <div className="placard">
              <span className="placard-num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="script">{w.title}</h3>
              <p>{w.theme}</p>
              <button className="read" onClick={() => openAt(i)}>
                Read the story <span aria-hidden>→</span>
              </button>
            </div>
          </section>
        ))}
      </div>

      <button
        className={`counter ${inGallery && !gridOpen && (open === null || closingView) ? "show" : ""}`}
        onClick={() => setGridOpen(true)}
        aria-label="View all photos in a grid"
        title="View all photos"
      >
        <span>{String(active + 1).padStart(2, "0")}</span>
        <span className="counter-bar">
          <span style={{ transform: `scaleX(${(active + 1) / works.length})` }} />
        </span>
        <span>{String(works.length).padStart(2, "0")}</span>
        <span className="counter-grid">
          <GridIcon />
        </span>
      </button>

      {gridOpen && (
        <PhotoGrid
          works={works}
          lifted={open}
          onOpen={openFromGrid}
          onClose={() => setGridOpen(false)}
          paused={open !== null}
          tileRefs={tiles}
        />
      )}

      {open !== null && (
        <Viewer
          works={works}
          index={open}
          origin={origin}
          getTarget={(i) => (gridOpen ? tiles.current[i] : frames.current[i])?.getBoundingClientRect() ?? null}
          getCrop={(i) => (gridOpen ? null : frames.current[i]?.querySelector<HTMLElement>(".parallax") ?? null)}
          onChange={goTo}
          onCloseStart={() => setClosingView(true)}
          onClose={close}
        />
      )}
    </>
  );
}

function GridIcon() {
  return (
    <svg className="grid-icon" viewBox="0 0 14 14" width="13" height="13" aria-hidden>
      <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1" />
      <rect x="8" y="0.5" width="5.5" height="5.5" rx="1" />
      <rect x="0.5" y="8" width="5.5" height="5.5" rx="1" />
      <rect x="8" y="8" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function Viewer({
  works,
  index,
  origin,
  getTarget,
  getCrop,
  onChange,
  onCloseStart,
  onClose,
}: {
  works: Work[];
  index: number;
  origin: DOMRect | null;
  getTarget: (i: number) => DOMRect | null;
  getCrop: (i: number) => HTMLElement | null;
  onChange: (i: number) => void;
  onCloseStart: () => void;
  onClose: () => void;
}) {
  const w = works[index];
  const box = useRef<HTMLDivElement>(null);
  const animatedFor = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);
  const touchX = useRef<number | null>(null);

  // In the gallery each photo is slightly zoomed for the parallax drift.
  // This returns that same zoom, scaled to the viewer, so the image never jumps when it lands.
  const cropFor = (i: number, viewerHeight: number, tileHeight: number) => {
    const el = getCrop(i);
    if (!el) return "none";
    const m = new DOMMatrix(getComputedStyle(el).transform);
    const k = viewerHeight / tileHeight;
    return `matrix(${m.a}, 0, 0, ${m.d}, ${m.e * k}, ${m.f * k})`;
  };
  const media = () => box.current?.querySelector<HTMLElement>("img, video") ?? null;

  // The photo grows out of its spot on the wall (or cross-fades when paging).
  // animatedFor makes sure this plays exactly once per photo, even if React re-runs the effect.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || animatedFor.current === index) return;
    const isFirst = animatedFor.current === null;
    animatedFor.current = index;
    if (isFirst && origin) {
      const to = el.getBoundingClientRect();
      el.animate([{ transform: flip(origin, to) }, { transform: "none" }], { duration: 750, easing: EASE });
      media()?.animate([{ transform: cropFor(index, to.height, origin.height) }, { transform: "none" }], {
        duration: 750,
        easing: EASE,
      });
    } else {
      el.animate(
        [
          { opacity: 0, transform: "scale(0.96)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 600, easing: EASE }
      );
    }
  }, [index, origin]);

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const el = box.current;
    const target = getTarget(index);
    if (!el || !target) return onClose();
    onCloseStart();
    const from = el.getBoundingClientRect();
    media()?.animate([{ transform: "none" }, { transform: cropFor(index, from.height, target.height) }], {
      duration: 650,
      easing: EASE,
      fill: "forwards",
    });
    el.animate([{ transform: "none" }, { transform: flip(target, from) }], {
      duration: 650,
      easing: EASE,
      fill: "forwards",
    }).finished.then(onClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing, getTarget, index, onClose, onCloseStart]);

  const prev = useCallback(() => onChange((index - 1 + works.length) % works.length), [index, onChange, works.length]);
  const next = useCallback(() => onChange((index + 1) % works.length), [index, onChange, works.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, prev, next]);

  const story = [
    <p key="meta" className="eyebrow">{w.category} · {w.year}</p>,
    <h2 key="title" className="script">{w.title}</h2>,
    <p key="theme" className="story-theme">{w.theme}</p>,
    ...w.story.map((p, i) => <p key={`p${i}`}>{p}</p>),
  ];
  if (w.details)
    story.push(
      <dl key="details" className="details">
        {w.details.map((d) => (
          <div key={d.label}>
            <dt>{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>
    );

  return (
    <div className={`viewer ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" aria-label={w.title}>
      <div className="viewer-bg" onClick={close} />
      <button className="close" onClick={close} aria-label="Close">
        <span />
        <span />
      </button>

      <div
        className="viewer-media"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > 50) prev();
          if (dx < -50) next();
          touchX.current = null;
        }}
      >
        <div className="media-frame">
          <div className="viewer-glow" key={`glow-${w.slug}`} aria-hidden style={{ "--ar": w.width / w.height } as React.CSSProperties}>
            <Image src={w.src} alt="" fill sizes="64px" quality={40} />
          </div>
          <div className="media-box" ref={box} style={{ "--ar": w.width / w.height } as React.CSSProperties}>
            {w.video ? (
              <video src={w.video} poster={w.src} controls autoPlay playsInline />
            ) : (
              <Image src={w.src} alt={w.title} width={w.width} height={w.height} sizes="(max-width: 900px) 92vw, 70vw" priority />
            )}
          </div>
        </div>
      </div>

      <div className="story">
        {/* Only the text scrolls; the Previous / Next bar below stays in the same place for every photo */}
        <article className="story-body" key={w.slug} data-lenis-prevent>
          {story.map((el, i) => (
            <div key={i} className="stagger" style={{ "--i": i } as React.CSSProperties}>
              {el}
            </div>
          ))}
        </article>
        <div className="pager">
          <button onClick={prev}>← Previous</button>
          <span>
            {index + 1} / {works.length}
          </span>
          <button onClick={next}>Next →</button>
        </div>
      </div>
    </div>
  );
}
