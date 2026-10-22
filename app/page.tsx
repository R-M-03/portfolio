import Films from "@/components/Films";
import Gallery from "@/components/Gallery";
import Header from "@/components/Header";
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

      <Header name={site.name} email={site.email} />

      <main id="top">
        <h1 className="sr-only">
          {site.name}, {site.role}
        </h1>
        <section className="intro">
          <p className="eyebrow">
            {site.role} · {site.location}
          </p>
          <p className="intro-text">{site.intro}</p>
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
          <h2 className="display">Hi, I&apos;m {site.name.split(" ")[0]}</h2>
          <p>
            I’m a photographer and videographer based in Toronto, drawn to quiet, honest moments and the people in them. I work across portraits, events and short films, and I care about making people feel at ease in front of the camera. I’m looking for work where I can tell real stories with a creative team.
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
        <span className="footer-mark wordmark">{site.name}</span>
        © {new Date().getFullYear()} {site.name}
      </footer>
    </>
  );
}
