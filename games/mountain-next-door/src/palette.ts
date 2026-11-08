// THE MOUNTAIN MOVED NEXT DOOR's palette: the Starters' ramps with Tess's colors in the hero's ranges, the
// mountain's own rock and moss, fog, water, a glow for the tunnel's glow-worms and a dim ember for its lamplight; and one look per time of the
// day (the same blocks in other colors), from the foggy dawn to the next morning's sunrise.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { recolor, type Look } from '../../kit/starter/heroLook';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];

/** Tess: tan skin, a long auburn braid, a mustard sun hat, a forest-green fleece, denim trousers. */
export const TESS: Look = {
  skin: [4, [128, 78, 50], [246, 200, 160], [208, 146, 104]],
  hair: [3, [88, 30, 18], [196, 96, 50]],
  hat: [5, [120, 84, 10], [255, 236, 150], [218, 170, 40]],
  hood: [5, [14, 60, 36], [150, 220, 150], [40, 120, 70]],
  pants: [5, [24, 40, 90], [170, 196, 240], [70, 100, 170]],
};

/** The game's own ramps, after the shared ones. */
function extraRamps(b: PaletteBuilder): void {
  b.ramp('rock', 6, [58, 50, 64], [214, 204, 196], [132, 118, 120]);
  b.ramp('moss', 5, [30, 70, 44], [170, 214, 120], [80, 140, 70]);
  b.ramp('fog', 4, [170, 176, 196], [250, 252, 255], [214, 220, 236]);
  b.ramp('water', 5, [20, 60, 110], [190, 236, 250], [60, 140, 200]);
  b.ramp('glow', 5, [20, 60, 70], [230, 255, 220], [110, 220, 190]);
  // lamplight in the dark tunnel: warm, but only a little lighter than the dark it falls on
  b.ramp('ember', 3, [40, 26, 26], [120, 74, 40], [72, 44, 32]);
}

/** The base palette (the morning), with Tess in the hero's index ranges. */
export function buildMountainPalette(): Pal {
  const base = buildStarterPalette(extraRamps);
  return { ...base, pal: recolor(base, TESS) };
}

/** A ramp's new look: [darkest, lightest, middle]. */
export type Tint = [RGB, RGB, RGB?];

/** A copy of the palette bytes with the named ramps recolored. */
export function swapped(pal: Pal, tints: Record<string, Tint>): Uint8Array {
  const out = new Uint8Array(pal.pal);
  const scratch = new PaletteBuilder();
  for (const [name, [from, to, mid]] of Object.entries(tints)) {
    const idx = pal.r(name);
    const made = scratch.ramp(`t_${name}`, idx.length, from, to, mid);
    idx.forEach((at, i) => out.set(scratch.pal.subarray(made[i] * 3, made[i] * 3 + 3), at * 3));
  }
  return out;
}

/** The palette bytes of a look ('' is the morning). */
export const lookOf = (pal: Pal, look: string): Uint8Array => swapped(pal, { ...LOOKS[look || 'morning'], ink: PRINT_INK[look || 'morning'] });

/**
 * The printer's ink for each time of the day: every outline, gouge and hatch in the game is cut in the ink ramp, so
 * one tinted ink per look makes each level read as one print (sepia by day, plum at dusk, indigo by night).
 */
const PRINT_INK: Record<string, Tint> = {
  morning: [
    [34, 30, 36],
    [104, 96, 100],
  ],
  dawn: [
    [44, 26, 66],
    [120, 96, 150],
  ],
  high: [
    [18, 30, 62],
    [84, 104, 150],
  ],
  library: [
    [52, 22, 18],
    [130, 80, 60],
  ],
  mist: [
    [36, 44, 58],
    [110, 120, 140],
  ],
  rain: [
    [16, 34, 58],
    [80, 110, 140],
  ],
  noon: [
    [56, 34, 16],
    [140, 100, 60],
  ],
  sunset: [
    [66, 18, 30],
    [150, 70, 80],
  ],
  gloaming: [
    [54, 18, 52],
    [130, 80, 130],
  ],
  dusk: [
    [30, 18, 62],
    [100, 84, 150],
  ],
  tunnel: [
    [14, 8, 8],
    [70, 50, 40],
  ],
  night: [
    [8, 12, 40],
    [60, 70, 120],
  ],
  town: [
    [18, 14, 44],
    [80, 70, 130],
  ],
  sunrise: [
    [66, 30, 20],
    [160, 90, 60],
  ],
};

/** Each time of the day. */
export const LOOKS: Record<string, Record<string, Tint>> = {
  // the morning, printed: a cool teal sky, olive turf, warm gray stone and red-brown earth (no Starter blue or green)
  morning: {
    sky: [
      [70, 140, 160],
      [226, 242, 228],
      [128, 192, 196],
    ],
    grass: [
      [40, 84, 40],
      [214, 222, 126],
      [110, 158, 70],
    ],
    moss: [
      [34, 70, 40],
      [200, 214, 120],
      [96, 140, 66],
    ],
    rock: [
      [52, 48, 58],
      [226, 216, 200],
      [134, 124, 124],
    ],
    dirt: [
      [78, 40, 24],
      [232, 172, 112],
      [150, 88, 50],
    ],
  },
  // first light through the fog: lavender and peach, everything soft
  dawn: {
    sky: [
      [150, 140, 190],
      [255, 226, 214],
      [214, 184, 220],
    ],
    grass: [
      [50, 90, 80],
      [190, 220, 170],
      [110, 150, 120],
    ],
    rock: [
      [80, 70, 100],
      [230, 214, 224],
      [150, 136, 160],
    ],
    moss: [
      [50, 80, 80],
      [190, 220, 180],
      [100, 140, 120],
    ],
  },
  // high on the mountain's back: a deep, clear blue sky and cool gray rock
  high: {
    sky: [
      [40, 110, 210],
      [200, 236, 255],
      [96, 170, 240],
    ],
    rock: [
      [44, 50, 70],
      [220, 222, 226],
      [120, 126, 140],
    ],
    moss: [
      [24, 70, 50],
      [180, 230, 130],
      [70, 150, 80],
    ],
  },
  // inside the library: warm cream walls, deep red-brown wood, lamplight
  library: {
    sky: [
      [110, 70, 60],
      [255, 240, 210],
      [230, 200, 160],
    ],
    wood: [
      [50, 26, 20],
      [220, 160, 110],
      [130, 74, 44],
    ],
    brick: [
      [70, 30, 30],
      [230, 150, 120],
      [150, 70, 60],
    ],
  },
  // a gray, misty park
  mist: {
    sky: [
      [140, 160, 180],
      [236, 242, 246],
      [190, 206, 220],
    ],
    grass: [
      [40, 96, 60],
      [180, 226, 130],
      [90, 160, 80],
    ],
  },
  // rain on the stream: slate sky, deep greens, darker water
  rain: {
    sky: [
      [70, 84, 110],
      [190, 204, 220],
      [120, 138, 166],
    ],
    grass: [
      [20, 70, 50],
      [120, 190, 110],
      [50, 120, 70],
    ],
    dirt: [
      [60, 40, 34],
      [170, 130, 100],
      [110, 80, 60],
    ],
    water: [
      [16, 40, 80],
      [160, 200, 230],
      [50, 100, 160],
    ],
  },
  // noon at the crossroads: a high, bright sky and warm wood
  noon: {
    sky: [
      [60, 140, 230],
      [214, 244, 255],
      [120, 196, 250],
    ],
    grass: [
      [60, 120, 40],
      [220, 240, 110],
      [130, 190, 60],
    ],
  },
  // sunset over the empty spot
  sunset: {
    sky: [
      [140, 70, 140],
      [255, 220, 150],
      [250, 140, 110],
    ],
    grass: [
      [40, 70, 50],
      [200, 190, 100],
      [110, 120, 70],
    ],
    rock: [
      [90, 50, 70],
      [255, 190, 150],
      [190, 110, 110],
    ],
    dirt: [
      [80, 40, 40],
      [230, 150, 100],
      [150, 80, 60],
    ],
  },
  // the lookout at the last of the light: amber low down, violet overhead
  gloaming: {
    sky: [
      [70, 50, 120],
      [255, 200, 140],
      [190, 120, 150],
    ],
    wood: [
      [50, 30, 40],
      [230, 170, 120],
      [130, 80, 70],
    ],
    moss: [
      [30, 50, 50],
      [170, 170, 110],
      [80, 100, 70],
    ],
  },
  // dusk on the windy ridge: blue-violet sky, the last light low
  dusk: {
    sky: [
      [40, 40, 100],
      [240, 170, 170],
      [110, 90, 170],
    ],
    grass: [
      [24, 50, 60],
      [130, 160, 140],
      [60, 100, 90],
    ],
    rock: [
      [36, 32, 60],
      [190, 160, 190],
      [100, 84, 120],
    ],
    moss: [
      [24, 50, 50],
      [120, 160, 130],
      [60, 100, 80],
    ],
    dirt: [
      [40, 30, 50],
      [150, 110, 120],
      [90, 64, 80],
    ],
  },
  // inside the old tunnel: nearly black, until a lamp is lit
  tunnel: {
    sky: [
      [6, 8, 18],
      [40, 44, 70],
      [16, 18, 36],
    ],
    brick: [
      [16, 14, 24],
      [90, 80, 96],
      [44, 38, 54],
    ],
    stone: [
      [16, 18, 30],
      [100, 104, 130],
      [46, 50, 70],
    ],
    dirt: [
      [12, 10, 16],
      [70, 56, 56],
      [34, 28, 32],
    ],
    grass: [
      [14, 30, 26],
      [80, 120, 100],
      [34, 64, 54],
    ],
    water: [
      [8, 16, 34],
      [70, 110, 150],
      [24, 46, 80],
    ],
  },
  // night on the zigzag: navy sky, moonlit blue-green ground
  night: {
    sky: [
      [10, 14, 50],
      [80, 100, 170],
      [26, 34, 90],
    ],
    grass: [
      [16, 40, 50],
      [110, 170, 160],
      [40, 90, 90],
    ],
    dirt: [
      [20, 20, 40],
      [110, 100, 140],
      [56, 50, 80],
    ],
    rock: [
      [20, 20, 44],
      [150, 150, 200],
      [70, 70, 120],
    ],
    moss: [
      [16, 40, 46],
      [110, 170, 150],
      [40, 90, 84],
    ],
    wood: [
      [40, 30, 40],
      [170, 140, 150],
      [100, 80, 90],
    ],
  },
  // the town after midnight: the same navy sky, the houses' siding gone blue-gray in the dark
  town: {
    sky: [
      [10, 14, 50],
      [80, 100, 170],
      [26, 34, 90],
    ],
    parch: [
      [30, 30, 56],
      [236, 226, 196],
      [96, 96, 128],
    ],
    teal: [
      [10, 30, 44],
      [110, 170, 170],
      [34, 74, 90],
    ],
    stone: [
      [20, 22, 40],
      [140, 150, 190],
      [60, 66, 100],
    ],
    dirt: [
      [20, 20, 40],
      [110, 100, 140],
      [56, 50, 80],
    ],
  },
  // the next morning on top: gold and rose
  sunrise: {
    sky: [
      [240, 150, 120],
      [255, 246, 200],
      [255, 200, 150],
    ],
    grass: [
      [60, 110, 40],
      [240, 230, 120],
      [140, 180, 70],
    ],
    rock: [
      [110, 70, 70],
      [255, 220, 190],
      [200, 140, 120],
    ],
  },
};
