// Sprites: Watt the repair robot (.CBL) and the moving parts of the boards (.MBL): the
// current itself, switches, timer buttons, force-field gates, fuses and relays.
import { orientIndex } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { chezSide, CHEZ_LAMP } from '../../../kit/chez';
import { CLEAR, bevel, blob, micro, outline, shadeAt } from '../art/draw';
import { c, r } from '../art/pal';
import { BlockSet, SOLID, type BlockDef } from '../blocks/sets';

const blank = () => new Pixels(20, 20, CLEAR);

/** Hit points a touch of live current (or a gate's field) takes: always fatal. */
export const ZAP = -100;

/** A segment of live current running left to right through the middle of a block. */
function spark(frame: number, ramp: string): Pixels {
  // A bead of current. PLAYGAME tests touches on the unturned picture, so the bead is round
  // and small (columns 7..12, rows 8..13): Watt can bump a switch 8 pixels deep, or stand
  // in an open gate's doorway, without touching current running through.
  const p = blank();
  const k = r(ramp);
  const cx = 9.5;
  const cy = 10.5;
  for (let y = 8; y < 14; y++)
    for (let x = 7; x < 13; x++) {
      const d = Math.hypot(x + 0.5 - (cx + 0.5), y + 0.5 - (cy + 0.5));
      if (d > 3.2) continue;
      p.set(x, y, d < 1.3 ? k[4] : d < 2.3 ? k[frame ? 3 : 4] : k[frame ? 1 : 2]);
    }
  return p;
}

/** A picture turned a quarter (for parts on wires that run up and down). */
export function turned(src: Pixels): Pixels {
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.px[y * 20 + x] = src.px[orientIndex(1, x, y)];
  return p;
}

/** The switch housing; `on`: the knife blade is down across the contacts. */
function switchPic(on: boolean, flash = false): Pixels {
  const p = blank();
  bevel(p, 0, 1, 20, 18, r('metal'), 3, 2);
  p.rect(2, 3, 16, 14, c('ink', 1));
  // contacts on the wire's line
  p.rect(2, 8, 4, 4, c('copper', 3)).rect(14, 8, 4, 4, c('copper', 3));
  if (on) {
    p.rect(4, 8, 12, 4, c('metal', 5)).rect(4, 11, 12, 1, c('metal', 2));
    p.rect(8, 5, 4, 3, c('green', 3)).rect(8, 4, 4, 1, c('green', 1));
  } else {
    p.line(5, 10, 14, 3, c('metal', 5)).line(5, 11, 14, 4, c('metal', 5)).line(6, 11, 15, 4, c('metal', 2));
    p.rect(13, 2, 4, 3, c('red', 3));
  }
  p.disc(5, 10, 1.5, c('metal', 1));
  if (flash)
    for (const [x, y] of [
      [3, 2],
      [16, 15],
      [10, 16],
      [2, 14],
    ])
      p.set(x, y, c('zap', 3));
  return p;
}

/** A push button with a clock face: it springs back off by itself. */
function timerPic(on: boolean, hand: number): Pixels {
  const p = blank();
  bevel(p, 0, 1, 20, 18, r('plastic'), 3, 2);
  p.rect(2, 8, 16, 4, c('copper', 2));
  blob(p, 9.5, 10, 6.5, 6.5, on ? r('green') : r('red'), 0, 3);
  p.ring(9.5, 10, 6, c('ink', 0));
  const a = (hand / 8) * Math.PI * 2 - Math.PI / 2;
  p.line(9.5, 10, 9.5 + Math.cos(a) * 5, 10 + Math.sin(a) * 5, c('paper', 3));
  p.set(9, 10, c('ink', 0));
  return p;
}

/** A force-field gate: posts top and bottom and a crackling field between. */
function gatePic(frame: number, fade = 0): Pixels {
  const p = blank();
  const R = rng(frame * 13 + 5);
  if (fade < 2) {
    for (let x = 1; x < 19; x++)
      for (let y = 3; y < 17; y++) {
        const v = Math.sin(x * 1.3 + frame * 2) + Math.sin(y * 0.9 - frame * 1.7);
        if (fade === 0 ? R() < 0.55 || Math.abs(v) < 0.4 : R() < 0.18) p.set(x, y, shadeAt(r('zap'), 0, 3, (v + 2) / 4, x, y));
      }
    for (let y = 3; y < 17; y += 3) p.set(0, y, c('zap', 3)).set(19, y + 1, c('zap', 3));
  }
  bevel(p, 0, 0, 20, 3, r('metal'), 2);
  bevel(p, 0, 17, 20, 3, r('metal'), 2);
  if (fade === 0) p.rect(4, 0, 2, 1, c('red', 4)).rect(14, 0, 2, 1, c('red', 4));
  else p.rect(4, 0, 2, 1, c('green', 3)).rect(14, 0, 2, 1, c('green', 3));
  return p;
}

/** A glass cartridge fuse across the wire. */
function fusePic(blown: boolean): Pixels {
  const p = blank();
  // a holder that fills the block, so a bump is felt at its very edge
  bevel(p, 0, 0, 20, 20, r('plastic'), 1, 2);
  bevel(p, 0, 4, 20, 12, r('ink'), 1);
  p.rect(0, 6, 4, 8, c('metal', 4)).rect(16, 6, 4, 8, c('metal', 4));
  for (let x = 4; x < 16; x++) for (let y = 6; y < 14; y++) p.set(x, y, blown ? c('ink', 1) : shadeAt(r('teal'), 2, 4, 1 - (y - 6) / 8, x, y));
  if (blown) {
    p.line(4, 10, 8, 9, c('copper', 1)).line(12, 11, 15, 10, c('copper', 1));
    p.set(9, 7, c('metal', 2)).set(11, 12, c('metal', 2));
  } else p.line(4, 10, 15, 10, c('copper', 4)).line(4, 9, 15, 9, c('copper', 2));
  p.rect(5, 6, 1, 3, c('paper', 3));
  return p;
}

/** A relay: a coil (control current, up/down) and a contact (power, left/right). */
function relayPic(closed: boolean, normallyClosed: boolean): Pixels {
  const p = blank();
  bevel(p, 1, 1, 18, 18, r('blue'), 1, 1);
  p.rect(8, 0, 4, 20, c('purple', 1));
  for (let y = 3; y < 17; y += 2) p.rect(7, y, 6, 1, c('copper', 3));
  p.rect(0, 8, 5, 4, c('copper', 3)).rect(15, 8, 5, 4, c('copper', 3));
  if (closed) p.rect(4, 9, 12, 2, c('metal', 5));
  else p.line(4, 10, 14, 5, c('metal', 5));
  micro(p, 2, 14, normallyClosed ? 'NC' : 'NO', c('paper', 3));
  return p;
}

/** A little two-line character LCD, split across two blocks (half 0 left, 1 right). Unpowered
 * it shows what a real one shows before anyone has talked to it: a row of solid boxes.
 * Booted, it says READY, and the cursor blinks. */
function lcdPic(half: number, booted: boolean, cursor = true): Pixels {
  const w = new Pixels(40, 20, CLEAR);
  bevel(w, 0, 0, 40, 20, r('green'), 0, 1);
  for (let i = 0; i < 8; i++) w.set(3 + i * 2, 1, c('gold', 2));
  w.rect(3, 4, 34, 13, c('ink', 0));
  w.rect(4, 5, 32, 11, booted ? c('green', 3) : c('green', 1));
  if (booted) {
    micro(w, 6, 6, 'READY', c('ink', 0));
    if (cursor) w.rect(6, 12, 3, 3, c('ink', 0));
  } else for (let i = 0; i < 8; i++) w.rect(5 + i * 4, 6, 3, 4, c('green', 0));
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, w.get(x + half * 20, y));
  return p;
}

/** The Bitmores' 1976½ CitiCar (the Bicentennial year: it still flies a little flag), in
 * profile across three blocks: part 0 the charging cord, 1 the car, 2 its nose and headlight
 * beams. THE CHEZ's shared side view (games/kit/chez.ts): a short tomato-red wedge, one straight
 * line from the low nose over the hood and windshield to the short black roof, a flat tail, one
 * door window, the racing stripes stepping up over the rear quarter, the headlight's pod on the
 * hood and white wheels. The cord plugs in at the tail and wraps around to the port on the far
 * (passenger) side. Charging current turns its headlight on; `flash` is the brighter frame. */
function citiCarPic(part: number, lit: boolean, flash = false): Pixels {
  const w = new Pixels(60, 20, c('ink', 1));
  for (let x = 0; x < 60; x += 4) w.rect(x, 18, 2, 2, c('ink', 2)); // the garage floor
  const S = 0.85;
  const ox = 10;
  const oy = 3;
  chezSide(w, ox, oy, {
    body: [c('red', 1), c('red', 2), c('red', 3)],
    trim: c('red', 0),
    glass: [c('teal', 1), c('teal', 4)],
    roof: c('ink', 0),
    tire: c('ink', 0),
    hub: c('metal', 3),
    rim: c('paper', 3),
    bumper: c('ink', 0),
    lamp: c('orange', 3),
    tail: c('red', 4),
    stripe: c('ink', 2),
    pin: c('paper', 3),
    lens: lit ? c('yellow', 3) : c('metal', 4),
  }, 'right', S);
  // the cord: along the wire, up into the plug at the tail, and around to the far side
  w.rect(0, 9, 14, 2, c('ink', 0)).rect(0, 9, 14, 1, c('metal', 1));
  w.rect(13, 8, 3, 4, c('metal', 2)).rect(13, 8, 3, 1, c('metal', 4));
  // the parade flag on its whip antenna, at the back of the roof
  const fx = Math.round(ox + 8.5 * S);
  w.line(fx, 3, fx, 0, c('metal', 4)).set(fx + 1, 0, c('red', 3)).set(fx + 2, 0, c('paper', 3)).set(fx + 3, 0, c('red', 3));
  if (lit) {
    const hx = Math.round(ox + CHEZ_LAMP[0] * S);
    const hy = Math.round(oy + CHEZ_LAMP[1] * S);
    w.set(hx, hy, c('paper', 3));
    for (let i = 0; i < (flash ? 4 : 3); i++) w.line(hx + 4 + i * 2, hy - 1 - i, hx + 4 + i * 2, hy + 1 + i, c('yellow', flash ? 3 : 2));
  }
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, w.get(x + part * 20, y));
  return p;
}

/** Watt's reset: a cartoon "boing" burst. */
function boomPic(big: boolean): Pixels {
  const p = blank();
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    const len = big ? (a % 2 ? 9 : 6) : a % 2 ? 5 : 3;
    p.line(10, 10, 10 + Math.cos(ang) * len, 10 + Math.sin(ang) * len, a % 2 ? c('zap', 3) : c('red', 3));
  }
  p.disc(10, 10, big ? 3 : 2, c('paper', 3));
  return p;
}

export function buildMonsterBlocks(): BlockSet {
  const mb = new BlockSet(100, true);
  const add = (name: string, px: Pixels, def: BlockDef = {}) => mb.add(name, px, def);
  add('sparkA', spark(0, 'spark'), { hp: ZAP });
  add('sparkB', spark(1, 'spark'), { hp: ZAP });
  add('ctrlA', spark(0, 'pink'), { hp: ZAP });
  add('ctrlB', spark(1, 'pink'), { hp: ZAP });
  // Parts on wires that run up and down get the same pictures turned a quarter.
  for (const v of ['', 'V']) {
    const t = (px: Pixels) => (v ? turned(px) : px);
    add(`swOff${v}`, t(switchPic(false)), { solid: SOLID });
    add(`swOn${v}`, t(switchPic(true)), { solid: SOLID });
    add(`swOffHot${v}`, t(switchPic(false, true)), { solid: SOLID });
    add(`swOnHot${v}`, t(switchPic(true, true)), { solid: SOLID });
    for (let f = 0; f < 3; f++) add(`gate${f}${v}`, t(gatePic(f)), { hp: ZAP });
    add(`gateFade1${v}`, t(gatePic(0, 1)));
    add(`gateFade2${v}`, t(gatePic(1, 2)));
    add(`fuse${v}`, t(fusePic(false)), { solid: SOLID });
    add(`fuseBlown${v}`, t(fusePic(true)), { solid: SOLID });
  }
  for (let h = 0; h < 8; h++) add(`timer${h}`, timerPic(true, h), { solid: SOLID });
  add('timerOff', timerPic(false, 0), { solid: SOLID });
  add('relayNO', relayPic(false, false), { solid: SOLID });
  add('relayNOon', relayPic(true, false), { solid: SOLID });
  add('relayNC', relayPic(true, true), { solid: SOLID });
  add('relayNCoff', relayPic(false, true), { solid: SOLID });
  for (const h of [0, 1]) {
    add(`lcd${h}`, lcdPic(h, false));
    add(`lcdReady${h}`, lcdPic(h, true));
  }
  add('lcdBlank1', lcdPic(1, true, false));
  for (const k of [0, 1, 2]) {
    add(`car${k}`, citiCarPic(k, false));
    add(`carOn${k}`, citiCarPic(k, true));
  }
  add('carFlash2', citiCarPic(2, true, true));
  add('boom1', boomPic(false));
  add('boom2', boomPic(true), { hp: -999 });
  return mb;
}

// ---------------------------------------------------------------- Watt (.CBL)

type View = 'down' | 'up' | 'side';

function watt(view: View, step: number, mood: 'ok' | 'blink' | 'zapped' | 'toast' = 'ok'): Pixels {
  const p = blank();
  const zapped = mood === 'zapped';
  const toast = mood === 'toast';
  const head = zapped ? r('zap') : toast ? r('ink') : r('teal');
  const body = zapped ? r('paper') : toast ? r('ink') : r('orange');
  // treads
  const tx = view === 'side' ? 4 : 3;
  const tw = view === 'side' ? 13 : 14;
  p.rect(tx, 16, tw, 4, c('ink', 0));
  for (let x = tx + ((step + 1) % 2); x < tx + tw; x += 2) p.set(x, 17, c('metal', 2)).set(x, 19, c('metal', 1));
  if (view === 'side') for (const wx of [6, 10, 14]) p.disc(wx, 18, 1.2, c('metal', 3));
  // body
  bevel(p, 5, 12, 10, 5, body, toast ? 1 : 2);
  if (view === 'down') p.rect(9, 13, 2, 2, toast ? c('ink', 0) : c('yellow', 3));
  if (view === 'up') p.rect(7, 13, 6, 1, c('orange', 0)).rect(7, 15, 6, 1, c('orange', 0));
  // head
  const hx = view === 'side' ? 4 : 4;
  // Watt keeps out of the top four rows (outline included): current arriving at an
  // open gate runs four pixels into the doorway before its posts swallow it.
  blob(p, hx + 6, 9.2, 5.4, 3.8, head, 0, head.length - 1);
  // a short bent antenna
  const ax = view === 'side' ? 12 : 13;
  const droop = toast ? 2 : 0;
  p.line(ax - 1, 6, ax, 6, c('metal', 4));
  p.rect(ax + 1, 5 + droop, 2, 2, zapped ? c('paper', 3) : toast ? c('ink', 2) : c('red', 3));
  // face
  const eye = (x: number) => {
    if (toast) {
      p.line(x - 1, 8, x + 1, 10, c('paper', 1)).line(x + 1, 8, x - 1, 10, c('paper', 1));
      return;
    }
    if (mood === 'blink') {
      p.rect(x - 2, 9, 4, 1, c('ink', 0));
      return;
    }
    p.disc(x, 9, 2.1, c('paper', 3));
    if (zapped) p.rect(x - 2, 9, 4, 1, c('ink', 0)).rect(x - 1, 7, 2, 4, c('ink', 0));
    else p.rect(x - (view === 'side' ? 1 : 0), 9, 2, 2, c('ink', 0));
  };
  if (view === 'down') {
    eye(7.5);
    eye(12.5);
  } else if (view === 'side') {
    eye(6.5);
    p.rect(5, 11, 2, 1, c('teal', 0));
  } else {
    for (let y = 6; y < 11; y += 2) p.rect(7, y, 6, 1, c('teal', 1));
  }
  if (zapped)
    for (const [x, y] of [
      [1, 3],
      [18, 5],
      [2, 12],
      [17, 13],
      [0, 8],
      [19, 9],
    ])
      p.set(x, y, c('zap', 3));
  return outline(p, c('ink', 0));
}

function smoke(k: number): Pixels {
  const p = blank();
  const R = rng(k + 4);
  p.rect(3, 16, 14, 4, c('ink', 0));
  for (let i = 0; i < 9; i++) {
    const x = 3 + R() * 14;
    const y = 15 + R() * 4;
    p.disc(x, y, 1.4, i % 3 ? c('metal', 2) : c('copper', 2));
  }
  // a spring
  for (let y = 6 - k * 2; y < 15; y += 2) p.line(8, y, 12, y + 1, c('metal', 4));
  for (let i = 0; i < 5; i++) p.disc(6 + i * 2 + k, 4 - k - i, 2 - i * 0.2, c('metal', 1 + (i % 2)));
  return p;
}

export function buildWattBlocks(): BlockSet {
  const cb = new BlockSet(50, true);
  const add = (name: string, px: Pixels) => cb.add(name, px);
  add('down0', watt('down', 0));
  add('down1', watt('down', 1));
  add('blink', watt('down', 0, 'blink'));
  add('up0', watt('up', 0));
  add('up1', watt('up', 1));
  add('side0', watt('side', 0));
  add('side1', watt('side', 1));
  add('zapped', watt('down', 0, 'zapped'));
  add('toast', watt('down', 0, 'toast'));
  add('bolts0', smoke(0));
  add('bolts1', smoke(1));
  return cb;
}
