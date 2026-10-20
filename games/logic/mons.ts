// The monsters of a board (.MON). Slots 0..15 are the board's currents: battery k gives
// birth to a spark of monster k every few ticks, and the spark runs along that wire's
// path, four pixels a tick, until the path ends. Sparks back to back make a solid, deadly
// line of current. From slot 16 on come the parts every board shares.
//
// Who beats whom is all done with power (the stronger monster survives a touch; equal
// powers pass through each other; anything under 100 is beaten when Watt touches it):
//   gate 40 < current 60 = switch on < relay NO 65 < control current 70 < switch off 80
//   < relay NC off 75 ... and the "hot" states (120) that Watt can't flip twice in a row.
import { ROUTES } from './ids';
import { Bestiary, type BlockSet } from './sets';

export const POWER = {
  gate: 40,
  current: 60,
  ctrl: 70,
  switchOn: 60,
  switchOff: 80,
  hot: 120,
  relayNO: 65,
  relayNCoff: 75,
  fuseBlown: 150,
  open: 200,
} as const;

/** Ticks a timer button stays on (about five and a half seconds). */
export const TIMER_TICKS = 100;
/** Ticks a switch ignores Watt after he flips it (so one bump flips it once). */
export const HOT_TICKS = 9;
/** Pixels a tick that current runs. */
export const SPARK_SPEED = 4;

export interface Wire {
  /** Corners as cumulative block offsets from the battery. */
  corners: [number, number][];
  ctrl?: boolean;
}

/** One board's monster list: its wires in slots 0..15, then the shared parts. */
export function buildMonsters(mb: BlockSet, wires: (Wire | undefined)[]): Bestiary {
  const b = new Bestiary(mb);
  wires.forEach((w, k) => {
    if (!w) return;
    if (k >= ROUTES) throw new Error('Too many wires');
    if (w.corners.length > 10) throw new Error(`Wire ${k} has ${w.corners.length} corners (10 at most)`);
    let px = 0;
    let py = 0;
    const path = w.corners.map(([x, y]) => {
      const vertical = x === px;
      px = x;
      py = y;
      return [x, y, SPARK_SPEED, vertical ? 1 : 0] as [number, number, number, number];
    });
    void py;
    const pics = w.ctrl ? ['ctrlA', 'ctrlB'] : ['sparkA', 'sparkB'];
    b.add(
      `wire${k}`,
      {
        pics: [
          [pics[0], 2],
          [pics[1], 2],
        ],
        power: w.ctrl ? POWER.ctrl : POWER.current,
        path,
        end: -1,
      },
      k,
    );
  });
  // Knife switches: off stops current, on lets it by. A bump flips one.
  b.add('switchOff', { pics: [['swOff', 50]], power: POWER.switchOff, becomes: 'switchOnHot' }, ROUTES);
  b.add('switchOnHot', { pics: [['swOnHot', 50]], power: POWER.hot, end: HOT_TICKS, becomes: 'switchOn' });
  b.add('switchOn', { pics: [['swOn', 50]], power: POWER.switchOn, becomes: 'switchOffHot' });
  b.add('switchOffHot', { pics: [['swOffHot', 50]], power: POWER.hot, end: HOT_TICKS, becomes: 'switchOff' });
  // Timer buttons: on for a while, then off by themselves (or at a second bump).
  b.add('timerOff', { pics: [['timerOff', 50]], power: POWER.switchOff, becomes: 'timerHot' });
  b.add('timerHot', { pics: [['timer0', 50]], power: POWER.hot, end: HOT_TICKS, becomes: 'timerOn' });
  const hand = Math.round(TIMER_TICKS / 8);
  b.add('timerOn', {
    pics: Array.from({ length: 8 }, (_, h) => [`timer${h}`, hand] as [string, number]),
    power: POWER.switchOn,
    end: TIMER_TICKS,
    becomes: 'timerOffHot',
  });
  b.add('timerOffHot', { pics: [['timerOff', 50]], power: POWER.hot, end: HOT_TICKS, becomes: 'timerOff' });
  // Force-field gates: deadly to touch; current reaching one shuts it down for good, and
  // the open gate's posts swallow any current that follows (so the doorway stays safe).
  // "gateV" is the same gate turned a quarter, for current coming in from the side.
  for (const [name, orient] of [
    ['gate', 0],
    ['gateV', 1],
  ] as const) {
    const path: [number, number, number, number][] = [[0, 0, 0, orient]];
    b.add(`${name}Open`, { pics: [['gateFade2', 50]], power: POWER.open, end: -2, path });
    b.add(`${name}Opening`, {
      pics: [
        ['gateFade1', 4],
        ['gateFade2', 6],
      ],
      power: POWER.open,
      end: 10,
      becomes: `${name}Open`,
      path,
    });
    b.add(name, {
      pics: [
        ['gate0', 2],
        ['gate1', 2],
        ['gate2', 2],
      ],
      power: POWER.gate,
      becomes: `${name}Opening`,
      path,
    });
  }
  // Fuses carry current until Watt bumps one (or control current hits it): then never again.
  b.add('fuse', { pics: [['fuse', 50]], power: POWER.current, becomes: 'fuseBlown' });
  b.add('fuseBlown', { pics: [['fuseBlown', 50]], power: POWER.fuseBlown, end: -2 });
  // Relays: control current (pink) throws them; then they stay thrown.
  b.add('relayNO', { pics: [['relayNO', 50]], power: POWER.relayNO, becomes: 'relayNOon' });
  b.add('relayNOon', { pics: [['relayNOon', 50]], power: POWER.current, becomes: 'relayNOon' });
  b.add('relayNC', { pics: [['relayNC', 50]], power: POWER.current, becomes: 'relayNCoff' });
  b.add('relayNCoff', { pics: [['relayNCoff', 50]], power: POWER.relayNCoff, end: -2 });
  // Watt's reboot: a little burst that turns into a big one a tick later.
  b.add('boom', { pics: [['boom1', 9]], power: 1, end: 1, becomes: 'boomBig' });
  b.add('boomBig', { pics: [['boom2', 9]], power: 1, end: 4 });
  return b;
}
