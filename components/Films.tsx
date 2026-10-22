"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Film } from "@/data/films";
import { EASE, flip, lockScroll } from "@/lib/motion";

// Vertical (phone-style) videos get their card beside the video instead of over its corner
const isTall = (ratio?: string) => {
  if (!ratio) return false;
  const [a, b] = ratio.split("/").map(Number);
  return !!a && !!b && a / b < 1;
};

export default function Films({ films }: { films: Film[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const rooms = useRef<(HTMLElement | null)[]>([]);
  const frames = useRef<(HTMLButtonElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const openRef = useRef<number | null>(null);
  openRef.current = open;

  // Scroll-linked motion, same feel as the photo gallery
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      rooms.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = r.top + r.height / 2 - vh / 2;
        const p = Math.max(-1, Math.min(1, dist / (vh / 2 + r.height / 2)));
        el.style.setProperty("--e", reduce ? "1" : (1 - Math.abs(p)).toFixed(4));
      });
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

  // Autoplay (muted) when a film scrolls into view, pause when it leaves
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting && openRef.current === null) v.play().catch(() => {});
          else v.pause();
        }),
      { threshold: 0.45 }
    );
    videos.current.forEach((v) => v && io.observe(v));
    return () => io.disconnect();
  }, []);

  const openAt = (i: number) => {
    (document.activeElement as HTMLElement | null)?.blur();
    videos.current.forEach((v) => v?.pause());
    setOrigin(frames.current[i]?.getBoundingClientRect() ?? null);
    setOpen(i);
  };

  const close = useCallback(() => {
    setOpen(null);
    // resume whichever film is on screen
    const vh = window.innerHeight;
    videos.current.forEach((v) => {
      if (!v) return;
      const r = v.getBoundingClientRect();
      if (r.bottom > vh * 0.3 && r.top < vh * 0.7) v.play().catch(() => {});
    });
  }, []);

  return (
    <>
      <header className="films-intro">
        <p className="eyebrow">Films</p>
        <h2 className="display">In Motion</h2>
      </header>

      {films.map((f, i) => (
        <section
          key={f.slug}
          className={`film ${i % 2 ? "film-right" : "film-left"} ${isTall(f.ratio) ? "film-tall" : ""}`}
          ref={(el) => {
            rooms.current[i] = el;
          }}
        >
          <div className="film-stage" style={{ "--ar": f.ratio ?? "16/9" } as React.CSSProperties}>
            <button
              className={`film-frame ${open === i ? "is-lifted" : ""}`}
              onClick={() => openAt(i)}
              aria-label={`Play ${f.title} with sound`}
              ref={(el) => {
                frames.current[i] = el;
              }}
            >
              <video
                ref={(el) => {
                  videos.current[i] = el;
                }}
                src={f.src}
                poster={f.poster}
                muted
                loop
                playsInline
                preload="metadata"
              />
              <span className="film-hint" aria-hidden>
                <span className="film-hint-icon" />
                Watch with sound
              </span>
            </button>

            <div className="film-card">
              <span className="placard-num">FILM {String(i + 1).padStart(2, "0")}</span>
              <h3 className="display">{f.title}</h3>
              <p className="film-theme">{f.theme}</p>
              <p className="film-meta">
                {[f.category, f.year, f.runtime].filter(Boolean).join("  ·  ")}
              </p>
              <button className="read" onClick={() => openAt(i)}>
                Watch the film <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </section>
      ))}

      {open !== null && <Theater film={films[open]} origin={origin} onClose={close} />}
    </>
  );
}

function Theater({ film, origin, onClose }: { film: Film; origin: DOMRect | null; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const played = useRef(false);
  const [closing, setClosing] = useState(false);

  // The video grows out of its spot in the page. The ref guard stops it playing twice.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || played.current) return;
    played.current = true;
    if (origin) {
      el.animate([{ transform: flip(origin, el.getBoundingClientRect()) }, { transform: "none" }], {
        duration: 800,
        easing: EASE,
      });
    } else {
      el.animate([{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }], {
        duration: 600,
        easing: EASE,
      });
    }
    // Clicking counts as permission to play with sound
    const v = video.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }, [origin]);

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    video.current?.pause();
    const el = box.current;
    if (!el) return onClose();
    el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.97)" }], {
      duration: 450,
      easing: EASE,
      fill: "forwards",
    }).finished.then(onClose);
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  const blocks = [
    <p key="meta" className="eyebrow">
      {[film.category, film.year, film.runtime].filter(Boolean).join("  ·  ")}
    </p>,
    <h2 key="title" className="display">{film.title}</h2>,
    <p key="theme" className="story-theme">{film.theme}</p>,
    ...film.story.map((p, i) => <p key={`p${i}`} className="theater-p">{p}</p>),
  ];
  if (film.details)
    blocks.push(
      <dl key="details" className="details">
        {film.details.map((d) => (
          <div key={d.label}>
            <dt>{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>
    );

  return (
    <div className={`theater ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" aria-label={film.title}>
      <div className="viewer-bg" onClick={close} />
      <button className="close" onClick={close} aria-label="Close">
        <span />
        <span />
      </button>
      <div className="theater-scroll" data-lenis-prevent>
        <div className="theater-video" ref={box} style={{ "--ar": film.ratio ?? "16/9" } as React.CSSProperties}>
          <video ref={video} src={film.src} poster={film.poster} controls playsInline preload="auto" />
        </div>
        <article className="theater-story">
          {blocks.map((el, i) => (
            <div key={i} className="stagger" style={{ "--i": i } as React.CSSProperties}>
              {el}
            </div>
          ))}
        </article>
      </div>
    </div>
  );
}
