import Films from "@/components/Films";
import Gallery from "@/components/Gallery";
import SmoothScroll from "@/components/SmoothScroll";
import { site } from "@/data/site";
import { works } from "@/data/photos";
import { films } from "@/data/films";
import { withRealSizes } from "@/lib/photo-sizes";

export default async function Home() {
  const photos = await withRealSizes(works);

  return (
    <>
      <SmoothScroll />

      <header className="nav">
        <a href="#top" className="nav-logo" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/monogram.svg" alt="" />
        </a>
        <nav>
          <a href="#work">Photos</a>
          <a href="#films">Films</a>
          <a href="#about">About</a>
          <a href={`mailto:${site.email}`}>Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hero-mark" src="/brand/wordmark.svg" alt="" />
            <h1 className="sr-only">{site.name}</h1>
            <p className="eyebrow">{site.role}</p>
            <p className="hero-intro">{site.intro}</p>
            <p className="hero-meta">{site.location}</p>
          </div>
          <a href="#work" className="scroll-cue" aria-label="Scroll to the work">
            <span />
          </a>
        </section>

        <div id="work">
          <Gallery works={photos} />
        </div>

        {films.length > 0 && (
          <div id="films" className="films">
            <Films films={films} />
          </div>
        )}

        <section id="about" className="about">
          <p className="eyebrow">About</p>
          <h2 className="script">Hi, I&apos;m {site.name.split(" ")[0]}</h2>
          <p>
            Write a short paragraph here about who she is, what she loves to shoot, and what
            kind of work she is looking for. Two or three sentences is plenty.
          </p>
          <div className="links">
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <a href={site.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={site.resume} target="_blank" rel="noreferrer">Resume</a>
          </div>
        </section>
      </main>

      <footer className="footer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/monogram.svg" alt="" className="footer-mark" />
        © {new Date().getFullYear()} {site.name}
      </footer>
    </>
  );
}
