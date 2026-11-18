// Environmental palette ramps for the mountain's times of day.
type RGB = [number, number, number];

/** A ramp's new look: [darkest, lightest, middle]. */
export type Tint = [RGB, RGB, RGB?];

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
    // high noon, printed in two inks and a gold: an ochre sky, sun-bleached olive turf, sienna earth
    sky: [
      [200, 150, 70],
      [255, 244, 204],
      [240, 206, 128],
    ],
    grass: [
      [70, 80, 26],
      [232, 222, 120],
      [150, 156, 56],
    ],
    moss: [
      [60, 70, 24],
      [220, 214, 110],
      [130, 140, 50],
    ],
    dirt: [
      [92, 40, 20],
      [236, 160, 100],
      [170, 84, 44],
    ],
    rock: [
      [70, 50, 40],
      [240, 220, 190],
      [160, 130, 110],
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
  // the records cellar: the tunnel's dark, with greener, paper-dusty walls
  cellar: {
    sky: [
      [6, 12, 16],
      [40, 56, 60],
      [16, 28, 32],
    ],
    brick: [
      [14, 22, 20],
      [96, 118, 100],
      [44, 62, 54],
    ],
    stone: [
      [16, 26, 24],
      [116, 138, 120],
      [52, 70, 62],
    ],
    dirt: [
      [14, 12, 10],
      [84, 64, 52],
      [38, 30, 26],
    ],
    grass: [
      [14, 30, 26],
      [80, 120, 100],
      [34, 64, 54],
    ],
  },
  // the cold hour before dawn: pale ice-blue sky, frosted turf, glassy water
  frost: {
    sky: [
      [96, 128, 176],
      [240, 246, 255],
      [176, 206, 232],
    ],
    grass: [
      [60, 94, 84],
      [210, 232, 226],
      [136, 176, 164],
    ],
    dirt: [
      [60, 46, 56],
      [190, 164, 170],
      [118, 92, 100],
    ],
    rock: [
      [50, 58, 80],
      [226, 234, 244],
      [140, 150, 176],
    ],
    water: [
      [46, 86, 140],
      [236, 248, 255],
      [150, 196, 230],
    ],
    stone: [
      [64, 84, 120],
      [240, 248, 255],
      [170, 196, 224],
    ],
  },
  // the blue hour on the hill: a deep blue sky going amber at the rim, the terraces dim
  lamplit: {
    sky: [
      [20, 44, 96],
      [250, 190, 116],
      [66, 84, 130],
    ],
    grass: [
      [30, 54, 44],
      [170, 180, 100],
      [84, 116, 72],
    ],
    dirt: [
      [56, 28, 36],
      [196, 124, 96],
      [116, 66, 60],
    ],
    rock: [
      [46, 42, 66],
      [214, 192, 190],
      [106, 98, 122],
    ],
  },
  // the orchard in the afternoon: honey sky, apple-green turf, warm sienna earth
  afternoon: {
    sky: [
      [150, 130, 70],
      [255, 238, 180],
      [236, 206, 130],
    ],
    grass: [
      [36, 80, 36],
      [204, 224, 110],
      [110, 164, 62],
    ],
    moss: [
      [30, 66, 36],
      [190, 214, 110],
      [90, 140, 60],
    ],
    dirt: [
      [84, 40, 22],
      [226, 160, 96],
      [160, 90, 48],
    ],
    rock: [
      [60, 50, 50],
      [234, 218, 190],
      [150, 128, 112],
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
