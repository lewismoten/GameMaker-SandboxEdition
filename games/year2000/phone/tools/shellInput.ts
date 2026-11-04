// What the phone shell is sized from, read out of a variant's own files: mechanical/interface.json (board, holes, dial),
// kicad/qr_spots.json (the silkscreen squares on the back the shell must leave windows over) and viewer/parts.json (where the
// switches, the tallest parts and the battery holder are). Units mm; x = board x, y = height (front +), z = board y (down).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { leadsFrom, type Lead } from './clearance';

export interface Variant {
  id: 'cheap' | 'deluxe';
  dir: string;
  /** Names the way Dex would call them. */
  name: string;
  subtitle: string;
  W: number;
  H: number;
  holes: [number, number][];
  dial: { c: [number, number]; R: number; ring: number; holeD: number; stopDeg: number; digitDeg: number[] };
  /** Pulse switch, off-normal switch and the two button switches (center x, z), and the top of the dial switches. */
  pulse: [number, number];
  offNormal: [number, number];
  buttons: [number, number][];
  swTop: number;
  frontMax: number;
  backMax: number;
  /** The 4 x AAA holder (x length, z width, y thickness; it lies in the bay past the board's bottom end), the pads its leads and the
   *  microphone's wires go to (board x, z), the thumbwheel pot's (x, z), the speaker's center and the displays' boxes (x0, z0, x1, z1). */
  holder: { L: number; Wd: number; T: number };
  btPads: [number, number][];
  micPads: [number, number][];
  wheel: [number, number] | null;
  speaker: [number, number];
  displays: [number, number, number, number][];
  /** Part bodies (boxes) on each face, and the lead stubs the opposite parts' pads leave on each (clearance.ts). */
  bodies: { id: string; side: string; bbox: number[] }[];
  leads: Lead[];
  windows: { x: number; z: number; w: number; h: number; what: string }[];
}

interface PartRow {
  id: string;
  side: string;
  bbox: number[];
  made?: string;
}

export function loadVariant(id: 'cheap' | 'deluxe', dir: string): Variant {
  const rd = (p: string) => JSON.parse(readFileSync(join(dir, p), 'utf8')) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const mech = rd('mechanical/interface.json');
  const spots = rd('kicad/qr_spots.json');
  const parts = (rd('viewer/parts.json').parts as PartRow[]).filter((p) => !p.id.startsWith('=>') && !p.made);
  const first = (ref: string) => parts.find((p) => p.id === ref)!;
  const mid = (ref: string): [number, number] => {
    const b = first(ref).bbox;
    return [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2];
  };
  const d = mech.dial;
  const sec = (k: string) => mech.front?.[k] ?? mech.back?.[k]; // the interface file groups its parts under front and back
  const hold = sec('battery_holder');
  const W: number = mech.board.width;
  const H: number = mech.board.height;
  const rest = parts.filter((p) => !p.id.startsWith('BT') && !p.id.startsWith('MK'));
  const win = (o: { x: number; y: number; size?: number; width?: number; height?: number }, what: string) => ({
    x: o.x,
    z: o.y,
    w: o.size ?? o.width ?? 0,
    h: o.size ?? o.height ?? 0,
    what,
  });
  return {
    id,
    dir,
    name:
      id === 'deluxe'
        ? 'Science Project No. 1: The Pocket Telephone (Deluxe Model)'
        : 'Science Project No. 2: The Pocket Telephone, Junior Lab Edition (parts from any hobby shop)',
    subtitle: id === 'deluxe' ? 'Deluxe Model' : 'Junior Lab Edition',
    W,
    H,
    holes: (mech.board.mounting_holes as { x: number; y: number }[]).map((h) => [h.x, h.y] as [number, number]),
    dial: {
      c: d.center,
      R: d.radius,
      ring: d.number_ring_radius,
      holeD: d.suggested_finger_hole_diameter,
      stopDeg: d.finger_stop_angle_cw_from_top_deg,
      digitDeg: (d.digit_positions as { angle_cw_from_top_deg: number }[]).map((p) => p.angle_cw_from_top_deg),
    },
    pulse: mid('SW2'),
    offNormal: mid('SW3'),
    buttons: [mid('SW4'), mid('SW5')],
    swTop: Math.max(...parts.filter((p) => p.id === 'SW2').map((p) => p.bbox[4])),
    frontMax: Math.max(...rest.filter((p) => p.side === 'front').map((p) => p.bbox[4])),
    backMax: -Math.min(...rest.filter((p) => p.side === 'back').map((p) => p.bbox[1])),
    holder: { L: hold.body[0], Wd: hold.body[1], T: hold.height },
    btPads: hold.lead_pads as [number, number][],
    micPads: sec('microphone').solder_pads as [number, number][],
    wheel: sec('volume_wheel') ? (sec('volume_wheel').center as [number, number]) : null,
    speaker: sec('speaker').center as [number, number],
    displays: ['DS1', 'DS2'].map((r) => {
      const b = first(r).bbox;
      return [b[0], b[2], b[3], b[5]] as [number, number, number, number];
    }),
    bodies: rest.map((p) => ({ id: p.id, side: p.side, bbox: p.bbox })),
    leads: leadsFrom(rd('kicad/placement.json') as never),
    windows: [win(spots.codes.parts, 'parts list QR'), win(spots.codes.site, 'site QR'), win(spots.dex, 'Dex Dynamo')],
  };
}
