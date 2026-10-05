import path from "node:path";
import sharp from "sharp";
import type { Work } from "@/data/photos";

// Reads each photo's real width and height straight from the image file when the site is built,
// so the numbers in data/photos.ts can never be out of step with the actual photo
// (for example after moving a `src` line to reorder). Sideways phone photos are handled too.
export async function withRealSizes(works: Work[]): Promise<Work[]> {
  return Promise.all(
    works.map(async (w) => {
      try {
        const meta = await sharp(path.join(process.cwd(), "public", w.src)).metadata();
        let width = meta.width;
        let height = meta.height;
        if (meta.orientation && meta.orientation >= 5) [width, height] = [height, width];
        if (width && height) return { ...w, width, height };
      } catch {
        console.warn(`Couldn't read ${w.src}; using the width and height from data/photos.ts`);
      }
      return w;
    })
  );
}
