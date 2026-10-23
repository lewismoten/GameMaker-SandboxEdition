// The monsters of a room (.MON). First come the parts every board shares (always at the
// same numbers, so Watt's reboot burst is the same monster in every room); then the room's
// currents, one per wire: a battery gives birth to a spark of its wire every few ticks, and
// the spark runs along that wire's path, four pixels a tick, until the path ends. Sparks
// back to back make a solid, deadly line of current.
//
// Who beats whom is all done with power (the stronger monster survives a touch; equal
// powers pass through each other; anything under 100 is beaten when Watt touches it):
//   gate 40 < current 60 = switch on < relay NO 65 < control current 70 < switch off 80
//   < relay NC off 75 ... and the "hot" states (120) that Watt can't flip twice in a row.
import { Bestiary, type BlockSet } from '../blocks/sets';

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

/** Monsters 0..COMMON_PARTS-1 are the shared parts; wire k is monster COMMON_PARTS + k. */
export const COMMON_PARTS = 46;
export const isWire = (monnum: number) => monnum >= COMMON_PARTS && monnum < 64;

/** One room's monster list: the shared parts, then its wires. */
export function buildMonsters(mb: BlockSet, wires: (Wire | undefined)[]): Bestiary {
  const b = new Bestiary(mb);
  // Knife switches: off stops current, on lets it by. A bump flips one. Parts named with
  // a V sit on wires running up and down (their pictures are turned a quarter); with a C,
  // on pink control wires (on matches control current's power, so it passes too).
  let first = true;
  for (const v of ['', 'V'])
    for (const k of ['', 'C']) {
      const n = `${v}${k}`;
      b.add(`switchOff${n}`, { pics: [[`swOff${v}`, 50]], power: POWER.switchOff, becomes: `switchOnHot${n}` }, first ? 0 : undefined);
      first = false;
      b.add(`switchOnHot${n}`, { pics: [[`swOnHot${v}`, 50]], power: POWER.hot, end: HOT_TICKS, becomes: `switchOn${n}` });
      b.add(`switchOn${n}`, { pics: [[`swOn${v}`, 50]], power: k ? POWER.ctrl : POWER.switchOn, becomes: `switchOffHot${n}` });
      b.add(`switchOffHot${n}`, { pics: [[`swOffHot${v}`, 50]], power: POWER.hot, end: HOT_TICKS, becomes: `switchOff${n}` });
    }
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
  for (const v of ['', 'V']) {
    b.add(`gateOpen${v}`, { pics: [[`gateFade2${v}`, 50]], power: POWER.open, end: -2 });
    b.add(`gateOpening${v}`, {
      pics: [
        [`gateFade1${v}`, 4],
        [`gateFade2${v}`, 6],
      ],
      power: POWER.open,
      end: 10,
      becomes: `gateOpen${v}`,
    });
    b.add(`gate${v}`, {
      pics: [
        [`gate0${v}`, 2],
        [`gate1${v}`, 2],
        [`gate2${v}`, 2],
      ],
      power: POWER.gate,
      becomes: `gateOpening${v}`,
    });
    // Fuses carry current until Watt bumps one (or control current hits it): then never again.
    b.add(`fuse${v}`, { pics: [[`fuse${v}`, 50]], power: POWER.current, becomes: `fuseBlown${v}` });
    b.add(`fuseBlown${v}`, { pics: [[`fuseBlown${v}`, 50]], power: POWER.fuseBlown, end: -2 });
  }
  // Relays: control current (pink) throws them; then they stay thrown.
  b.add('relayNO', { pics: [['relayNO', 50]], power: POWER.relayNO, becomes: 'relayNOon' });
  b.add('relayNOon', { pics: [['relayNOon', 50]], power: POWER.current, becomes: 'relayNOon' });
  b.add('relayNC', { pics: [['relayNC', 50]], power: POWER.current, becomes: 'relayNCoff' });
  b.add('relayNCoff', { pics: [['relayNCoff', 50]], power: POWER.relayNCoff, end: -2 });
  // A character LCD sunk in the housing on a wire, in two halves: current passing through
  // boots it (it is weaker than current), and booted it is exactly as strong as current, so
  // the sparks pass straight on through it to whatever is next.
  for (const h of [0, 1]) {
    b.add(`lcd${h}`, { pics: [[`lcd${h}`, 50]], power: POWER.gate, becomes: `lcdReady${h}` });
    const pics: [string, number][] = h
      ? [
          ['lcdReady1', 6],
          ['lcdBlank1', 6],
        ]
      : [['lcdReady0', 50]];
    b.add(`lcdReady${h}`, { pics, power: POWER.current, end: -2 });
  }
  // The CitiCar, three blocks parked over a wire: charging current turns its headlights on
  // (the same trick as the LCD) and runs on through it.
  for (const k of [0, 1, 2]) {
    b.add(`car${k}`, { pics: [[`car${k}`, 50]], power: POWER.gate, becomes: `carOn${k}` });
    const pics: [string, number][] =
      k === 2
        ? [
            ['carOn2', 4],
            ['carFlash2', 4],
          ]
        : [[`carOn${k}`, 50]];
    b.add(`carOn${k}`, { pics, power: POWER.current, end: -2 });
  }
  // Watt's reboot: a little burst that turns into a big one a tick later.
  b.add('boom', { pics: [['boom1', 9]], power: 1, end: 1, becomes: 'boomBig' });
  b.add('boomBig', { pics: [['boom2', 9]], power: 1, end: 4 });
  if (b.names.length !== COMMON_PARTS) throw new Error(`The shared parts take ${b.names.length} monsters, not ${COMMON_PARTS}`);
  wires.forEach((w, k) => {
    if (!w) return;
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
    b.add(`wire${k}`, {
      pics: [
        [pics[0], 2],
        [pics[1], 2],
      ],
      power: w.ctrl ? POWER.ctrl : POWER.current,
      path,
      end: -1,
    });
  });
  return b;
}
