"use client";

import { useEffect, useState } from "react";

// Her name top left, links top right (like a classic photographer's site).
// It stays pinned while you scroll and tightens up once you're past the top.
export default function Header({ name, email }: { name: string; email: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <a href="#top" className="site-name wordmark" aria-label={name}>
        <span className="name-full">{name}</span>
        <span className="name-short" aria-hidden>
          {name
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </span>
      </a>
      <nav>
        <a href="#work">Photos</a>
        <a href="#films">Films</a>
        <a href="#about">About</a>
        <a href={`mailto:${email}`}>Contact</a>
      </nav>
    </header>
  );
}
