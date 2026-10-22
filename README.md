# Photo Portfolio

A minimal photo and video portfolio built with Next.js, ready to deploy on Vercel.

Each photo shows a short theme line under it. Clicking a photo opens it full screen with the story of how it was made. Every photo also gets its own link (for example `yoursite.com/#first-light`) so she can send a recruiter straight to one piece.

## Run it on your computer

1. Install Node.js (version 20 or newer) from nodejs.org
2. In this folder, run `npm install`
3. Run `npm run dev` and open http://localhost:3000

## Add her photos

There's no limit. Add as many as you like.

1. Export the photos as JPEGs (not HEIC) and copy them into `public/photos/`.
2. In Terminal, in the portfolio folder, run `npm run photos`. For each new photo it:
   - reads the camera, lens, settings and year from the photo and fills in its details
   - removes hidden data like the GPS location, so it's safe to publish
   - tidies the file name, shrinks it if it's huge, and adds it to the end of `data/photos.ts`
3. Writing is optional. Title, theme and story start blank. A photo with nothing written just shows
   on its own, and its story view shows the camera details. Fill in any you like in `data/photos.ts`;
   each paragraph of a story goes in its own set of quotes, separated by commas.

Photos appear in the same order as in `data/photos.ts`, in two columns; the first two sit side by
side at the top. To reorder, move whole blocks (from `{` to `},`) up or down.

Other commands:
- `npm run photos:tidy` blanks any leftover sample text (titles made from file names, sample
  themes and stories, made-up camera details). Anything you wrote yourself is left alone.
- `npm run photos:clean` removes entries whose photo file you've deleted.
- `npm run photos -- --camera-from "/path/to/originals"` fills in camera details for older photos
  from her original files, matched by file name.

Keep her full-size originals somewhere else, because big files get shrunk.

## Add her films

Films have their own section under the photos. Each one autoplays silently when you scroll to it,
and opens full screen with sound when clicked.

1. Drop the videos into `public/films/` exactly as you got them (.mov from an iPhone is fine).
2. In Terminal, in the portfolio folder, run `npm run films`.
   It converts each one to a web-friendly MP4 (1080p, under about 45MB, iPhone HDR colours fixed,
   GPS location removed), saves a cover image, moves the big original into `film-originals/`
   (kept on your computer, never uploaded) and adds an entry to `data/films.ts`.
   Long or 4K videos can take a few minutes each.
3. Open `data/films.ts` and replace the sample title, theme, story and details.
4. To remove a film, delete its .mp4 and .jpg from `public/films/` and run `npm run films:clean`.
   If there are no films listed, the section hides itself.

Films appear in the same order as in `data/films.ts`. To use a different cover image, replace the
.jpg with the same name.

## Change her name and links

Edit `data/site.ts`. The about paragraph is in `app/page.tsx`. Drop her resume in `public/resume.pdf`.

## Put it online with Vercel

1. Create a free GitHub account and upload this folder as a new repository
2. Go to vercel.com, sign in with GitHub, click "Add New Project" and pick the repository
3. Click Deploy. Every time you push changes to GitHub, the site updates on its own.
4. In the Vercel project settings, under Domains, connect her custom domain
