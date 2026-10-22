"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Work } from "@/data/photos";
import { EASE, flip, lockScroll } from "@/lib/motion";

// The size the browser loads for gallery tiles. The story view shows this same version
// instantly while the sharper one loads, so opening a photo never flashes blank.
const TILE_SIZES = "(max-width: 700px) 92vw, 46vw";

// Two balanced columns: each photo goes into whichever column is currently shorter,
// so the columns end at about the same height and the order still reads top to bottom.
function splitColumns(works: Work[]) {
  const cols: number[][] = [[], []];
  const h = [0, 0];
  works.forEach((w, i) => {
    const c = h[0] <= h[1] ? 0 : 1;
    cols[c].push(i);
    h[c] += w.height / w.width + 0.14; // + room for the caption
  });
  return cols;
}

export default function Gallery({ works }: { works: Work[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const [twoCols, setTwoCols] = useState(true);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const set = () => setTwoCols(!mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // Each photo fades up gently the first time it scrolls into view
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tiles.current.forEach((t) => t?.closest(".work")?.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".work").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [twoCols, works.length]);

  const centerTile = (i: number) => {
    const el = tiles.current[i];
    if (!el) return;
    const offset = -(window.innerHeight - el.offsetHeight) / 2;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(el, { immediate: true, force: true, offset });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset });
  };

  // Open a photo straight from a shared link like yoursite.com/#first-light
  useEffect(() => {
    const i = works.findIndex((w) => w.slug === window.location.hash.slice(1));
    if (i >= 0) {
      setTimeout(() => {
        centerTile(i);
        setOrigin(null);
        setOpen(i);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAt = (i: number) => {
    (document.activeElement as HTMLElement | null)?.blur();
    setOrigin(tiles.current[i]?.getBoundingClientRect() ?? null);
    setOpen(i);
    history.replaceState(null, "", `#${works[i].slug}`);
  };

  // Paging with Previous / Next keeps the page behind in step, so closing lands on the right photo
  const goTo = useCallback(
    (i: number) => {
      centerTile(i);
      setOpen(i);
      history.replaceState(null, "", `#${works[i].slug}`);
    },
    [works]
  );

  const close = useCallback(() => {
    setOpen(null);
    history.replaceState(null, "", window.location.pathname);
  }, []);

  const columns = twoCols ? splitColumns(works) : [works.map((_, i) => i)];

  return (
    <>
      <div className={`works ${twoCols ? "two" : "one"}`}>
        {columns.map((col, c) => (
          <div key={c} className="works-col">
            {col.map((i) => {
              const w = works[i];
              return (
                <figure key={w.slug} className="work">
                  <button
                    className={`work-frame ${open === i ? "is-lifted" : ""}`}
                    ref={(el) => {
                      tiles.current[i] = el;
                    }}
                    style={{ aspectRatio: `${w.width} / ${w.height}` }}
                    onClick={() => openAt(i)}
                    aria-label={w.title ? `Open ${w.title} and read its story` : "Open this photo"}
                  >
                    {/* Soft glow in the photo's own colours, shown on hover */}
                    <span className="work-glow" aria-hidden>
                      <Image src={w.src} alt="" fill sizes="64px" quality={40} />
                    </span>
                    <span className="work-img">
                      {w.video ? (
                        <video src={w.video} poster={w.src} muted loop playsInline autoPlay />
                      ) : (
                        <Image
                          src={w.src}
                          alt={w.title || w.theme || "Photograph"}
                          width={w.width}
                          height={w.height}
                          sizes={TILE_SIZES}
                          priority={i < 2}
                        />
                      )}
                    </span>
                  </button>
                  {/* Caption only when something's been written: a photo with no title or theme just shows on its own */}
                  {(w.title || w.theme) && (
                    <figcaption>
                      {w.title && (
                        <button className="work-title display" onClick={() => openAt(i)}>
                          {w.title}
                        </button>
                      )}
                      {w.theme && <p className="work-theme">{w.theme}</p>}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        ))}
      </div>

      {open !== null && (
        <Viewer
          works={works}
          index={open}
          origin={origin}
          getTarget={(i) => tiles.current[i]?.getBoundingClientRect() ?? null}
          getCrop={() => null}
          onChange={goTo}
          onCloseStart={() => {}}
          onClose={close}
        />
      )}
    </>
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
  const media = () => box.current?.querySelector<HTMLElement>(".media-main") ?? null;

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

  // Anything left blank (title, theme, story) is simply skipped
  const story = [
    <p key="meta" className="eyebrow">{[w.category, w.year].filter(Boolean).join(" · ")}</p>,
    w.title ? <h2 key="title" className="display">{w.title}</h2> : null,
    w.theme ? <p key="theme" className="story-theme">{w.theme}</p> : null,
    ...w.story.map((p, i) => <p key={`p${i}`}>{p}</p>),
  ];
  if (w.details?.length)
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
    <div className={`viewer ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" aria-label={w.title || "Photograph"}>
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
              <video className="media-main" src={w.video} poster={w.src} controls autoPlay playsInline />
            ) : (
              <>
                {/* the gallery's version of this photo is already loaded, so it shows instantly underneath */}
                <Image className="media-thumb" src={w.src} alt="" fill sizes={TILE_SIZES} aria-hidden />
                <Image
                  className="media-main"
                  src={w.src}
                  alt={w.title || w.theme || "Photograph"}
                  width={w.width}
                  height={w.height}
                  sizes="(max-width: 900px) 92vw, 70vw"
                  priority
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="story">
        {/* Only the text scrolls; the Previous / Next bar below stays in the same place for every photo */}
        <article className="story-body" key={w.slug} data-lenis-prevent>
          {story.filter(Boolean).map((el, i) => (
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
