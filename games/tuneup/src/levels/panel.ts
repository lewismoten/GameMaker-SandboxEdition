// Level 13, The Instrument Panel (the cab at night, the dashboard's green glow; Teddy). The
// dashboard's instruments are instruments. Two scenes:
//   - Tuning: the radio's dial has a needle sweeping back and forth across it (each cell of the
//     dial a ring of blocks, the needle on it for a moment going each way). Under three stations
//     hang the preset buttons, each lit only while the needle crosses its station; Teddy hops up
//     into a lit one and the static becomes music (a hop into a dark one is only a crackle and a
//     point). The last station brings in the choir's "aah".
//   - The gauges: three gauges, each a chord of the parade tune (C, F, G) when Teddy hops up into
//     it, its needle jumping up; then the AM radio with its 8-track goes in, into the space just
//     above the accessory light, and the door opens for it. The choir swells under it all.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { AIR, countedDoor, kit, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import { addCameo, placeCameo } from '../blocks/cameo';
import { wattCameo } from '../../../kit/cameos';
import type { Pal } from '../art/palette';
import { CTR, MONEY, MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

export const PANEL = { w: 16, floor: 9, dial: 3, dialX: 3, buttons: 6, door: 13, exit: 14 } as const;
/** The dial's cells, and the ticks the needle stays on each (it sweeps across and back). */
export const DIAL = { cells: 10, ticks: 4 } as const;
/** The stations: dial cells (the preset buttons hang under them). */
export const STATIONS = [1, 5, 8];
/** What each station does as it comes in: its kind of change picks its sound. */
const STATION_KINDS = [{ hp: 1 }, { effect: MONEY, eamt: 1 }, { effect: CTR.stations, eamt: 1 }] as const;
/** The gauges' columns (level x), and what each chord does (C, F, G by its kind of change). */
export const GAUGES = [4, 7, 10];
const GAUGE_KINDS = [{ hp: 1 }, { effect: MONEY, eamt: 1 }, {}] as const;
/** The radio's place in the dash (level x, on the floor's row). */
export const RADIO_X = 12;

/** Dial cell `i`'s ring: [needle on it, ticks] runs, from the scene's start (the needle starts at the left). */
export function dialRing(i: number): [boolean, number][] {
  const { cells, ticks } = DIAL;
  const trip = cells * 2 * ticks;
  const marks: boolean[] = [];
  for (let t = 0; t < trip; t += ticks) {
    const step = t / ticks;
    const at = step < cells ? step : cells * 2 - 1 - step;
    marks.push(at === i);
  }
  const ring: [boolean, number][] = [];
  for (const on of marks) {
    const last = ring[ring.length - 1];
    if (last && last[0] === on) last[1] += ticks;
    else ring.push([on, ticks]);
  }
  return ring;
}

/** Points for a preset hopped into early, on the beat (the middle of the needle's pass) and late. */
const PRESET_GRADES = [60, 150, 60] as const;

/** A preset button's ring: the dial's, with each lit run in three grades (a tick, two, a tick; every grade is lit and tunes the station). */
function presetRing(i: number): { on: boolean; ticks: number; points?: number }[] {
  return dialRing(i).flatMap(([on, ticks]): { on: boolean; ticks: number; points?: number }[] => {
    if (!on) return [{ on, ticks }];
    const { ticks: step } = DIAL;
    if (ticks !== step) throw new Error(`dial cell ${i}: a lit run of ${ticks} ticks can't be graded`);
    const parts = [step / 4, step / 2, step / 4];
    return parts.map((t, g) => ({ on, ticks: t, points: PRESET_GRADES[g] }));
  });
}

export function panelBlocks(scene: 'tune' | 'gauges') {
  return (pal: Pal): Kit => {
    const k = kit(pal);
    baseSet(k, 'cab');
    const { book, c } = k;
    // the dash's face behind Teddy: dark vinyl stitched in rows, lit green from below
    const face = (row: number) => {
      const p = k.P(c('shade', 0));
      for (let y = 4; y < 20; y += 8) p.rect(0, y, 20, 1, c('shade', 1));
      if (row >= 7) p.rect(0, 19 - (row - 7) * 4, 20, 1, c('lamp', 0));
      return p;
    };
    for (let y = 0; y < PANEL.floor; y++) book.add(`face${y}`, face(y), AIR);
    // the windshield over the dash, the night through it
    const night = k.pic('glass');
    for (const [x, y] of [
      [4, 5],
      [13, 11],
      [17, 3],
    ])
      night.set(x, y, c('lamp', 4));
    book.add('night', night, AIR);
    // chrome trim: a strip along the dash, and a radio's bezel round the dial with its two knobs
    const trim = (top: boolean, row: number) => {
      const p = face(row);
      const y = top ? 14 : 0;
      return p
        .rect(0, y, 20, 6, c('mach', 2))
        .rect(0, top ? y : y + 5, 20, 1, c('mach', 3))
        .rect(0, top ? y + 5 : y, 20, 1, c('mach', 0));
    };
    book.add('trim.top', trim(true, PANEL.dial - 1), AIR);
    book.add('trim.bottom', trim(false, PANEL.dial + 1), AIR);
    const knob = face(PANEL.dial);
    knob.rect(0, 0, 20, 20, c('mach', 2)).disc(10, 10, 7, c('mach', 0)).disc(10, 10, 6, c('mach', 3)).rect(9, 4, 2, 5, c('mach', 0));
    book.add('knob', knob, AIR);
    if (scene === 'tune') {
      // the dial: a glowing strip with frequency marks, a station a brighter mark; the needle red
      const dial = (i: number, needle: boolean) => {
        const p = face(PANEL.dial);
        p.rect(0, 3, 20, 14, c('lamp', 1)).rect(0, 3, 20, 1, c('lamp', 3)).rect(0, 16, 20, 1, c('lamp', 0));
        for (let x = 2; x < 20; x += 6) p.rect(x, 12, 1, 3, c('shade', 0));
        if (STATIONS.includes(i)) p.rect(8, 5, 4, 4, c('lamp', 4)).rect(9, 10, 2, 5, c('lamp', 4));
        if (needle) p.rect(9, 2, 2, 16, c('red', 2)).rect(9, 2, 1, 16, c('red', 3));
        return p;
      };
      for (let i = 0; i < DIAL.cells; i++) {
        const ring = dialRing(i);
        ring.forEach(([on, t], f) => book.add(`dial${i}.${f}`, dial(i, on), { ...AIR, ntime: t, next: `dial${i}.${(f + 1) % ring.length}` }));
      }
      // the preset buttons: chrome, lit while the needle is on their station; a dark one crackles
      const button = (s: number, lit: boolean, set = false) => {
        const p = face(PANEL.buttons);
        p.rect(3, 4, 14, 12, c('mach', 1)).rect(4, 5, 12, 10, set ? c('lamp', 3) : lit ? c('lamp', 4) : c('mach', 2));
        p.rect(4, 5, 12, 1, c('mach', 3));
        for (let n = 0; n <= s; n++) p.rect(7 + n * 3, 9, 2, 2, set || lit ? c('shade', 0) : c('mach', 0));
        return p;
      };
      STATIONS.forEach((i, s) => {
        const ring = presetRing(i);
        ring.forEach(({ on, ticks: t, points }, f) =>
          book.add(`preset${s}.${f}`, button(s, on), {
            ...AIR,
            ...(on ? { ...STATION_KINDS[s], score: points, touch: `preset${s}.set` } : { score: -1, touch: `preset${s}.${f}` }),
            ntime: t,
            next: `preset${s}.${(f + 1) % ring.length}`,
          }),
        );
        book.add(`preset${s}.set`, button(s, true, true), AIR);
      });
      countedDoor(k, 'door', 'face8', CTR.stations, 1, (p: Pixels) => {
        p.disc(10, 12, 3, c('lamp', 3));
      });
    } else {
      // a gauge: a round face, its needle down; hopped into, a chord, and its needle swings up
      const gauge = (g: number, up: boolean) => {
        const p = face(PANEL.buttons);
        p.disc(10, 10, 9, c('mach', 0)).disc(10, 10, 8, c('lamp', up ? 2 : 1));
        for (let a = 0; a <= 4; a++) {
          const ang = Math.PI * (1.1 - a * 0.2);
          p.set(Math.round(10 + Math.cos(ang) * 6), Math.round(10 - Math.sin(ang) * 6), c('shade', 0));
        }
        const ang = up ? Math.PI * 0.25 : Math.PI * 0.95;
        p.line(10, 10, Math.round(10 + Math.cos(ang) * 6), Math.round(10 - Math.sin(ang) * 6), c('accent', 3));
        p.disc(10, 10, 1.5, c('shade', 0));
        // the chord's letter as dots: one, two or three
        for (let n = 0; n <= g; n++) p.set(7 + n * 3, 15, c('accent', 3));
        return p;
      };
      GAUGES.forEach((_, g) => {
        book.add(`gauge${g}`, gauge(g, false), { ...AIR, ...GAUGE_KINDS[g], score: 100, touch: `gauge${g}.up` });
        book.add(`gauge${g}.up`, gauge(g, true), AIR);
      });
      // the radio's space just above the accessory light: empty, then the AM radio with its 8-track
      const radio = (inside: boolean) => {
        const p = face(8);
        p.rect(1, 2, 18, 12, c('shade', 1)).frame(1, 2, 18, 12, c('mach', 2));
        if (inside) {
          p.rect(2, 3, 16, 10, c('mach', 1)).rect(5, 4, 10, 4, c('accent', 2)).rect(9, 4, 1, 4, c('red', 2));
          p.disc(3.5, 6, 1.5, c('mach', 3)).disc(16.5, 6, 1.5, c('mach', 3)).rect(5, 10, 10, 2, c('shade', 0));
        }
        // the accessory light under it
        p.rect(7, 16, 6, 3, c('accent', inside ? 3 : 1)).frame(7, 16, 6, 3, c('mach', 0));
        return p;
      };
      book.add('radio', radio(false), { ...AIR, effect: CTR.radio, eamt: 1, score: 500, touch: 'radio.in' });
      book.add('radio.in', radio(true), AIR);
      countedDoor(k, 'door', 'face8', CTR.radio, 1, (p: Pixels) => {
        p.disc(10, 12, 3, c('accent', 3));
      });
    }
    // a Clown Club red nose with a glint: an extra life (on the tuning scene's floor)
    book.add('life', k.pic(`face${PANEL.floor - 1}`).disc(10, 12, 6, c('ink', 0)).disc(10, 12, 5, c('red', 2)).disc(9, 11, 3, c('red', 3)).disc(8, 10, 1, c('cloud', 2)).rect(3, 4, 3, 1, c('lamp', 4)).rect(4, 3, 1, 3, c('lamp', 4)).rect(15, 5, 2, 1, c('lamp', 4)), { ...AIR, effect: 1, eamt: 1, score: 500, touch: `face${PANEL.floor - 1}` });
    // Watt, the repair robot, seeing to the dash's wiring (placed in the gauges' scene)
    addCameo(k, 'watt', `face${PANEL.floor - 1}`, (host, use) => wattCameo(host, 'side', 0, 'ok', { use }));
    return k;
  };
}

export function panel(scene: 'tune' | 'gauges') {
  return (book: Kit['book']): Level => {
    const { w, floor } = PANEL;
    const m = new MapBuilder(book, { '=': 'dash', n: 'night', '|': 'pillar' }, 'dash');
    for (let y = 0; y < floor; y++) m.fill(0, y, w, 1, `face${y}`);
    m.fill(0, 0, w, 2, 'n').fill(0, floor, w, 1, '=');
    m.fill(0, 0, 1, floor, '|').fill(w - 1, 0, 1, floor, '|');
    if (scene === 'tune') {
      m.set(7, floor - 1, 'life');
      m.fill(PANEL.dialX - 1, PANEL.dial - 1, DIAL.cells + 2, 1, 'trim.top').fill(PANEL.dialX - 1, PANEL.dial + 1, DIAL.cells + 2, 1, 'trim.bottom');
      m.set(PANEL.dialX - 1, PANEL.dial, 'knob').set(PANEL.dialX + DIAL.cells, PANEL.dial, 'knob');
      for (let i = 0; i < DIAL.cells; i++) m.set(PANEL.dialX + i, PANEL.dial, `dial${i}.0`);
      STATIONS.forEach((i, s) => m.set(PANEL.dialX + i, PANEL.buttons, `preset${s}.0`));
    } else {
      m.fill(1, PANEL.dial + 1, w - 2, 1, 'trim.bottom');
      GAUGES.forEach((x, g) => m.set(x, PANEL.buttons, `gauge${g}`));
      m.set(RADIO_X, floor - 1, 'radio');
      placeCameo(m, 'watt', `face${floor - 1}`, [[9, floor - 1]]);
    }
    m.set(PANEL.door, floor - 2, 'door.top').set(PANEL.door, floor - 1, 'door');
    m.link(PANEL.door, floor - 1);
    m.mon(MON.regina, 2, floor - 1);
    return { m, start: at(8, 5), size: [w, 10] };
  };
}
