// Every photo or video on the site lives here.
// To add one: drop the file in /public/photos and add an entry below.
//
//  theme   short line shown under the photo in the grid
//  story   the longer piece shown when someone clicks it (one string per paragraph)
//  video   optional: path to an .mp4 in /public/photos, or leave out for a photo
//  details optional: camera, lens, settings, location, anything worth noting

export type Work = {
  slug: string;
  title: string;
  theme: string;
  src: string;
  video?: string;
  width: number;
  height: number;
  year: string;
  category: string;
  story: string[];
  details?: { label: string; value: string }[];
};

export const works: Work[] = [

  {
    slug: "img-3159",
    title: "Larch",
    theme: "Stillness, and learning to wait for the right moment.",
    src: "/photos/img-3159.jpg",
    width: 1290,
    height: 834,
    year: "2026",
    category: "Photography",
    story: [
      "I took this early one morning when the light was still soft and nobody else was around. I had walked past this spot many times but had never really stopped to look at it.",
      "I stayed for about half an hour, trying different angles and waiting for the light to change. This was one of the last frames I took before packing up.",
      "Looking back, it reminds me that the best photos usually come from slowing down rather than chasing something new.",
    ],
    details: [
      { label: "Camera", value: "Sony A7 III" },
      { label: "Lens", value: "35mm f/1.8" },
      { label: "Settings", value: "1/200s, f/4, ISO 100" },
      { label: "Location", value: "Vancouver, BC" },
    ],
  },
  {
    slug: "img-DSC07433",
    title: "Energy",
    theme: "Colour, contrast, and the energy of a busy place.",
    src: "/photos/DSC07433.JPG",
    width: 1361,
    height: 2048,
    year: "2026",
    category: "Photography",
    story: [
      "This was shot on a Saturday afternoon when the whole street was packed. I wanted to capture how chaotic it felt without the photo itself feeling messy.",
      "I found a spot a little above the crowd and waited for a gap where the colours lined up. It took a lot of attempts to get one frame where everything worked together.",
    ],
    details: [
      { label: "Camera", value: "Fujifilm X-T4" },
      { label: "Lens", value: "23mm f/2" },
      { label: "Settings", value: "1/500s, f/5.6, ISO 400" },
      { label: "Location", value: "Granville Island" },
    ],
  },
  {
    slug: "img-3160",
    title: "Peace",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/img-3160.jpg",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
  {
    slug: "img-3162",
    title: "Market",
    theme: "Stillness, and learning to wait for the right moment.",
    src: "/photos/DSC02209.jpg",
    width: 1361,
    height: 2048,
    year: "2026",
    category: "Photography",
    story: [
      "I took this early one morning when the light was still soft and nobody else was around. I had walked past this spot many times but had never really stopped to look at it.",
      "I stayed for about half an hour, trying different angles and waiting for the light to change. This was one of the last frames I took before packing up.",
      "Looking back, it reminds me that the best photos usually come from slowing down rather than chasing something new.",
    ],
    details: [
      { label: "Camera", value: "Sony A7 III" },
      { label: "Lens", value: "35mm f/1.8" },
      { label: "Settings", value: "1/200s, f/4, ISO 100" },
      { label: "Location", value: "Vancouver, BC" },
    ],
  },
  {
    slug: "img-3164",
    title: "Evergreen",
    theme: "Colour, contrast, and the energy of a busy place.",
    src: "/photos/img-3164.jpg",
    width: 1361,
    height: 2048,
    year: "2026",
    category: "Photography",
    story: [
      "This was shot on a Saturday afternoon when the whole street was packed. I wanted to capture how chaotic it felt without the photo itself feeling messy.",
      "I found a spot a little above the crowd and waited for a gap where the colours lined up. It took a lot of attempts to get one frame where everything worked together.",
    ],
    details: [
      { label: "Camera", value: "Fujifilm X-T4" },
      { label: "Lens", value: "23mm f/2" },
      { label: "Settings", value: "1/500s, f/5.6, ISO 400" },
      { label: "Location", value: "Granville Island" },
    ],
  },
  {
    slug: "img-3168",
    title: "Stillness",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/DSC02356.JPG",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
    {
    slug: "img-03039",
    title: "Golden",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/DSC03039.JPG",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
  {
    slug: "img-05455",
    title: "Golden",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/DSC05455.JPG",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
  {
    slug: "img-05304",
    title: "Golden",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/DSC05304.JPG",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
   {
    slug: "img-00088",
    title: "Golden",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/DSC00088.JPG",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
     {
    slug: "img-03641",
    title: "Golden",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/DSC03641.JPG",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
   {
    slug: "img-0547",
    title: "Golden",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/DSC_0547.JPG",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
  {
    slug: "dsc00088",
    title: "Dsc00088",
    theme: "Colour, contrast, and the energy of a busy place.",
    src: "/photos/DSC00088.jpg",
    width: 2560,
    height: 1703,
    year: "2026",
    category: "Photography",
    story: [
      "This was shot on a Saturday afternoon when the whole street was packed. I wanted to capture how chaotic it felt without the photo itself feeling messy.",
      "I found a spot a little above the crowd and waited for a gap where the colours lined up. It took a lot of attempts to get one frame where everything worked together.",
    ],
    details: [
      { label: "Camera", value: "Fujifilm X-T4" },
      { label: "Lens", value: "23mm f/2" },
      { label: "Settings", value: "1/500s, f/5.6, ISO 400" },
      { label: "Location", value: "Granville Island" },
    ],
  },
  {
    slug: "img-3162-2",
    title: "Img 3162 2",
    theme: "Stillness, and learning to wait for the right moment.",
    src: "/photos/img-3162-2.jpg",
    width: 1361,
    height: 2048,
    year: "2026",
    category: "Photography",
    story: [
      "I took this early one morning when the light was still soft and nobody else was around. I had walked past this spot many times but had never really stopped to look at it.",
      "I stayed for about half an hour, trying different angles and waiting for the light to change. This was one of the last frames I took before packing up.",
      "Looking back, it reminds me that the best photos usually come from slowing down rather than chasing something new.",
    ],
    details: [
      { label: "Camera", value: "Sony A7 III" },
      { label: "Lens", value: "35mm f/1.8" },
      { label: "Settings", value: "1/200s, f/4, ISO 100" },
      { label: "Location", value: "Vancouver, BC" },
    ],
  },
  {
    slug: "img-3168-2",
    title: "Img 3168 2",
    theme: "A quiet portrait about comfort and familiarity.",
    src: "/photos/img-3168-2.jpg",
    width: 2048,
    height: 1361,
    year: "2026",
    category: "Photography",
    story: [
      "I asked a close friend to sit for this one in her own apartment, because I wanted her to feel completely relaxed rather than posed.",
      "We talked for most of the shoot and I only picked the camera up when she forgot it was there. The light from the window did most of the work.",
      "It's still one of my favourite portraits because it feels honest.",
    ],
    details: [
      { label: "Camera", value: "Canon EOS R6" },
      { label: "Lens", value: "50mm f/1.8" },
      { label: "Settings", value: "1/160s, f/2.2, ISO 800" },
      { label: "Location", value: "Kitsilano" },
    ],
  },
];
