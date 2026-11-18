// Printer ink ramps for the mountain's times of day.
import type { Tint } from './paletteLooks';

/**
 * The printer's ink for each time of the day: every outline, gouge and hatch in the game is cut in the ink ramp, so
 * one tinted ink per look makes each level read as one print (sepia by day, plum at dusk, indigo by night).
 */
export const PRINT_INK: Record<string, Tint> = {
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
  // the records cellar: deep archive-green ink
  cellar: [
    [10, 36, 36],
    [70, 120, 112],
  ],
  // the cold hour: steel-blue ink
  frost: [
    [30, 48, 74],
    [140, 170, 198],
  ],
  // the blue hour: gaslight yellow-brown ink
  lamplit: [
    [40, 36, 10],
    [146, 126, 52],
  ],
  // the afternoon in the orchard: bottle-green ink
  afternoon: [
    [20, 46, 30],
    [96, 136, 100],
  ],
};
