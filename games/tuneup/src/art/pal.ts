// Tune-Up's colors. The Teddy finale's ramps come first, in its order, so Teddy, Gwinn, Doc Leo
// and the clowns (drawn by the trilogy, imported as they are) keep their colors. Then the preset
// pictures' fixed colors (presetIcons.ts PALETTE), which no time of day changes, and a ramp per
// instrument family in the preset picker's hues (instrumentLook.ts: pale tile, mid, strong).
import { buildRampPalette, type PalWithBuilder as Pal, type RampSpec } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { lightColor, TIME_OF_DAY_SKY as SKY, type Lighting, type TimeOfDay } from '@lewismoten/gamemaker-sandbox-tools/colors';
import { SCREEN_RAMPS } from '../../../teddy/src/art/screenRamps';
import { P as FINALE } from '../../../teddy3/src/art/pal';
import { iconColor } from '../../../../web/src/editor/editors/music/presetIcons';
import { PRESET_GROUPS } from '../../../../web/src/audio/oplPresets';

type RGB = [number, number, number];
export type { Pal, TimeOfDay };

/** [name, shades, dark, light, mid?, glows at night?]: the finale's, unchanged. */
const TEDDY: RampSpec[] = [
  ['ink', 2, [20, 14, 18], [52, 40, 44]],
  ['sky', 8, [92, 150, 230], [214, 238, 255]],
  ['cloud', 3, [190, 204, 228], [255, 255, 255]],
  ['grass', 5, [30, 84, 26], [150, 214, 84]],
  ['leaf', 4, [16, 56, 30], [70, 140, 64]],
  ['dirt', 5, [60, 34, 18], [176, 122, 74]],
  ['wood', 5, [70, 38, 20], [212, 156, 96]],
  ['paint', 4, [150, 156, 170], [255, 255, 250]],
  ['brick', 5, [84, 26, 22], [214, 110, 82]],
  ['stone', 5, [70, 70, 80], [200, 196, 190]],
  ['asphalt', 4, [36, 36, 44], [104, 104, 116]],
  ['roof', 4, [64, 26, 34], [170, 72, 72]],
  ['siding', 4, [56, 90, 130], [150, 190, 226]],
  ['corgi', 5, [112, 44, 10], [250, 176, 92]],
  ['fur', 3, [196, 186, 176], [255, 252, 244]],
  ['gwinn', 5, [44, 22, 12], [170, 104, 62]],
  ['red', 4, [120, 10, 20], [255, 84, 84]],
  ['yellow', 4, [150, 104, 0], [255, 238, 96]],
  ['blue', 4, [20, 40, 120], [96, 160, 255]],
  ['green', 3, [20, 100, 50], [96, 220, 120]],
  ['purple', 4, [60, 20, 90], [190, 120, 240]],
  ['pink', 4, [170, 60, 110], [255, 190, 220]],
  ['skin', 4, [120, 70, 48], [255, 214, 180]],
  ['metal', 5, [50, 56, 66], [220, 226, 232]],
  ['water', 4, [24, 70, 150], [150, 220, 255]],
  ['tongue', 2, [190, 60, 80], [255, 130, 150]],
  ['glow', 4, [170, 110, 30], [255, 252, 200], undefined, true],
  ['neon', 4, [255, 60, 140], [80, 220, 255], [255, 230, 80], true],
  ['gold', 3, [150, 100, 10], [255, 230, 110]],
  // new in the sequel: wallpaper, tile, hay and mud
  ['peach', 4, [150, 90, 70], [255, 220, 186]],
  ['teal', 4, [20, 80, 90], [160, 232, 222]],
  ['hay', 4, [120, 84, 20], [250, 224, 130]],
  ['mud', 3, [46, 28, 14], [120, 82, 44]],
  // new in the finale: frosting, balloons, the funhouse's lilac and the road's lane paint
  ['frost', 3, [220, 170, 190], [255, 244, 250]],
  ['lilac', 4, [70, 40, 110], [210, 180, 250]],
  ['orange', 4, [150, 60, 10], [255, 190, 90]],
];

/** The preset pictures' letters, each a one-shade ramp named icon-<letter>. */
export const ICON_LETTERS = 'kwgyonrbcpeT';

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function hsl(h: number, s: number, l: number): RGB {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/** The family's hue, as the preset picker colors it (instrumentLook.ts hueOf). */
const hueOf = (gi: number) => (gi * 47 + 20) % 360;

const ICONS: RampSpec[] = [...ICON_LETTERS].map((ch) => {
  const c = hex(iconColor(ch) ?? '#000000');
  return [`icon-${ch}`, 1, c, c] as RampSpec;
});
/** fam-<group>: 0 strong (the track color), 1 mid, 2 the pale tile behind a picture. */
const FAMILIES: RampSpec[] = PRESET_GROUPS.map((g, gi) => [`fam-${g.id}`, 3, hsl(hueOf(gi), 0.65, 0.5), hsl(hueOf(gi), 0.7, 0.84)] as RampSpec);

/** The bandstand's evening light. */
const EVENING: Lighting = { mul: [1, 0.92, 0.82], add: [16, 8, 0] };

const FIXED = (name: string) => name.startsWith('icon-') || name.startsWith('fam-');

export function buildPalette(time: TimeOfDay): Pal {
  return buildRampPalette([...TEDDY, ...ICONS, ...FAMILIES], {
    overrides: { sky: SKY[time] },
    transform: (name, c, glows) => {
      if (FIXED(name)) return c;
      // the bandstand's evening: a warm gold light, not the stock sunset's rose over everything
      if (time === 'sunset' && !glows) return lightColor(c, EVENING);
      if (time === 'night' && name === 'fur') return lightColor(c, { mul: [0.78, 0.82, 0.94], add: [12, 12, 12] });
      return glows && (time === 'night' || time === 'sunset' || time === 'show') ? c : lightColor(c, time);
    },
  });
}

/** The title, menu and text screens: every ramp plus the family's screen inks. */
export const buildScreenPalette = (): Pal => buildRampPalette([...TEDDY, ...ICONS, ...FAMILIES, ...SCREEN_RAMPS]);

/** Index of a ramp shade in every palette (the builders add ramps in the same order). */
export const P = buildPalette('noon');

// The trilogy's sprites use the finale's numbers: they must be the same here.
for (const name of FINALE.b.ramps.keys()) if (FINALE.r(name).join() !== P.r(name).join()) throw new Error(`tuneup palette: ramp ${name} moved`);
