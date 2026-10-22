// Every film in the Films section lives here, in the order they appear.
//
// To add one:
//   1. Put the video in /public/films (an .mp4, 1080p, ideally under 50MB, see README)
//   2. Optionally add a still frame as a .jpg to use as the cover while it loads
//   3. Add a block below. Copy an existing one and change the text.
//
//  src      the video file
//  poster   optional cover image shown before the video starts
//  ratio    optional shape of the video, e.g. "16/9" (normal) or "2.39/1" (wide cinema). Defaults to 16/9.
//  theme    short line shown on the card
//  story    shown under the video when someone opens it (one string per paragraph)
//  details  optional list like camera, location, client, role

export type Film = {
  slug: string;
  title: string;
  theme: string;
  src: string;
  poster?: string;
  ratio?: string;
  year: string;
  category: string;
  runtime?: string;
  story: string[];
  details?: { label: string; value: string }[];
};

export const films: Film[] = [
  {
    slug: "copy-b4ac666b-4194-48b9-beba-ffb4df0217fc",
    title: "Copy B4ac666b 4194 48b9 Beba Ffb4df0217fc",
    theme: "A short film about slowing down and noticing the small things.",
    src: "/films/copy-b4ac666b-4194-48b9-beba-ffb4df0217fc.mp4",
    poster: "/films/copy-b4ac666b-4194-48b9-beba-ffb4df0217fc.jpg",
    year: "2026",
    category: "Film",
    runtime: "0:54",
    story: [
      "I filmed this over a couple of days, mostly in the early morning when the light was soft and the streets were still quiet.",
      "There was no script. I just followed what felt interesting and found the shape of it in the edit, which is how most of my favourite work starts.",
    ],
    details: [
      { label: "Role", value: "Director, Camera, Edit" },
      { label: "Camera", value: "iPhone 15 Pro" },
      { label: "Location", value: "Vancouver, BC" },
    ],
  },
  {
    slug: "copy-c8ba07a5-bb78-47d9-ae30-6547b043f8cb",
    title: "Copy C8ba07a5 Bb78 47d9 Ae30 6547b043f8cb",
    theme: "A short film about slowing down and noticing the small things.",
    src: "/films/copy-c8ba07a5-bb78-47d9-ae30-6547b043f8cb.mp4",
    poster: "/films/copy-c8ba07a5-bb78-47d9-ae30-6547b043f8cb.jpg",
    year: "2026",
    category: "Film",
    runtime: "2:01",
    story: [
      "I filmed this over a couple of days, mostly in the early morning when the light was soft and the streets were still quiet.",
      "There was no script. I just followed what felt interesting and found the shape of it in the edit, which is how most of my favourite work starts.",
    ],
    details: [
      { label: "Role", value: "Director, Camera, Edit" },
      { label: "Camera", value: "iPhone 15 Pro" },
      { label: "Location", value: "Vancouver, BC" },
    ],
  },
  {
    slug: "15d0d72d-d6a9-4e39-b273-01813157ddd9",
    title: "15d0d72d D6a9 4e39 B273 01813157ddd9",
    theme: "Movement, music, and the energy of a single night.",
    src: "/films/15d0d72d-d6a9-4e39-b273-01813157ddd9.mp4",
    poster: "/films/15d0d72d-d6a9-4e39-b273-01813157ddd9.jpg",
    year: "2026",
    category: "Film",
    runtime: "0:59",
    story: [
      "This came together quickly with a few friends and one borrowed light. We had about three hours and used every minute of it.",
      "I cut it to the music first and then went back to find shots that matched the rhythm, rather than the other way around.",
    ],
    details: [
      { label: "Role", value: "Cinematographer, Edit" },
      { label: "Camera", value: "Sony FX3" },
      { label: "Location", value: "Downtown Vancouver" },
    ],
  },
  {
    slug: "copy-496ad193-a807-4ba5-9657-7e1016ce2987",
    title: "Copy 496ad193 A807 4ba5 9657 7e1016ce2987",
    theme: "Movement, music, and the energy of a single night.",
    src: "/films/copy-496ad193-a807-4ba5-9657-7e1016ce2987.mp4",
    poster: "/films/copy-496ad193-a807-4ba5-9657-7e1016ce2987.jpg",
    ratio: "1080/1920",
    year: "2026",
    category: "Film",
    runtime: "0:58",
    story: [
      "This came together quickly with a few friends and one borrowed light. We had about three hours and used every minute of it.",
      "I cut it to the music first and then went back to find shots that matched the rhythm, rather than the other way around.",
    ],
    details: [
      { label: "Role", value: "Cinematographer, Edit" },
      { label: "Camera", value: "Sony FX3" },
      { label: "Location", value: "Downtown Vancouver" },
    ],
  },
  {
    slug: "copy-dbd8894c-044f-4bea-9335-d96406591641",
    title: "Copy Dbd8894c 044f 4bea 9335 D96406591641",
    theme: "Movement, music, and the energy of a single night.",
    src: "/films/copy-dbd8894c-044f-4bea-9335-d96406591641.mp4",
    poster: "/films/copy-dbd8894c-044f-4bea-9335-d96406591641.jpg",
    ratio: "1920/886",
    year: "2026",
    category: "Film",
    runtime: "0:55",
    story: [
      "This came together quickly with a few friends and one borrowed light. We had about three hours and used every minute of it.",
      "I cut it to the music first and then went back to find shots that matched the rhythm, rather than the other way around.",
    ],
    details: [
      { label: "Role", value: "Cinematographer, Edit" },
      { label: "Camera", value: "Sony FX3" },
      { label: "Location", value: "Downtown Vancouver" },
    ],
  },
  {
    slug: "dc8953bb81ce42d98e5fcc21dbc25fe3",
    title: "Dc8953bb81ce42d98e5fcc21dbc25fe3",
    theme: "Movement, music, and the energy of a single night.",
    src: "/films/dc8953bb81ce42d98e5fcc21dbc25fe3.mp4",
    poster: "/films/dc8953bb81ce42d98e5fcc21dbc25fe3.jpg",
    year: "2026",
    category: "Film",
    runtime: "0:27",
    story: [
      "This came together quickly with a few friends and one borrowed light. We had about three hours and used every minute of it.",
      "I cut it to the music first and then went back to find shots that matched the rhythm, rather than the other way around.",
    ],
    details: [
      { label: "Role", value: "Cinematographer, Edit" },
      { label: "Camera", value: "Sony FX3" },
      { label: "Location", value: "Downtown Vancouver" },
    ],
  },
];
