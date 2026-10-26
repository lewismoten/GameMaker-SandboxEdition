// The two cartoons around the Cloud Lane: LIFTOFF.FLI, Dex finds Grandpa's car keys, unlocks the
// CitiCar on its charger, and it unplugs itself, puts out its stubby wings and lifts off into the
// clouds; and PARKING.FLI, the CitiCar sets Dex down on the Skyway's deck and flies itself home.
// The car is THE CHEZ's side view (games/kit/chez.ts through citicarBig), facing left: the
// passenger side, its door window, the stripes and the charge port at the rear.
import { Pixels, rng } from '../../../kit/pixels';
import { T, oval, shadeAt } from '../art/draw';
import { C } from '../art/pal';
import { FLOORS } from '../blocks/floors';
import { citicarBig } from '../art/citicar';
import { tiled } from '../art/bigart';
import { H, R, W, centeredText, fli, scaleBlit, speedLines, type Art } from './paint';

/** A morning sky with puffy clouds; `drift` slides the clouds down (the car climbing). */
function sky(p: Pixels, drift: number, bottom = H): void {
  for (let y = 0; y < bottom; y++) for (let x = 0; x < W; x++) p.set(x, y, shadeAt(R('sky'), 3, 7, y / H, x, y));
  const r = rng(9);
  for (let i = 0; i < 9; i++) {
    const cx = r() * W;
    const cy = ((r() * 260 + drift) % 260) - 30;
    const rx = 18 + r() * 26;
    if (cy > bottom) continue;
    oval(p, cx, cy + 4, rx, rx * 0.35, C('sky', 6));
    oval(p, cx, cy, rx * 0.8, rx * 0.4, C('gray', 7));
  }
}

/** Grandpa's key ring: two keys and the garage clicker. */
function keyRing(p: Pixels, x: number, y: number): void {
  p.ring(x, y, 2.5, C('gold', 5));
  p.rect(x + 2, y + 1, 5, 2, C('gold', 4)).rect(x + 5, y + 3, 1, 2, C('gold', 4));
  p.rect(x - 4, y + 2, 3, 5, C('red', 3)).set(x - 3, y + 3, C('gold', 5));
}

/** Dex's head for the door window. */
const head = (a: Art) => a.dex.crop(0, 0, 20, 10);

export function liftoffFli(a: Art): Uint8Array {
  const frames: Pixels[] = [];
  const S = 3;
  const lawn = (carY: number, o: Parameters<typeof citicarBig>[1], plugged: boolean, shadow = 1) => {
    const p = new Pixels(W, H);
    sky(p, 0, 140);
    p.blit(tiled(new Pixels(W, 60), FLOORS.grass), 0, 140);
    // the charger post, behind the car on the right
    p.rect(258, 104, 16, 40, C('chrome', 3)).rect(258, 104, 16, 3, C('chrome', 6)).rect(261, 110, 10, 8, C('night', 0));
    p.rect(262, 112, 8, 2, C('neon', 3));
    if (shadow > 0) oval(p, 160, 146, 62 * shadow, 5 * shadow, C('green', 0));
    const car = citicarBig(S, o);
    const cx = 160 - car.pic.w / 2;
    p.blit(car.pic, cx, carY, T);
    // the charging cord from the post to the port on the rear passenger corner
    const px = cx + car.portX;
    const py = carY + car.portY;
    if (plugged) p.line(260, 116, px + 2, py, C('gray', 0)).line(260, 117, px + 2, py + 1, C('gray', 0));
    else p.line(260, 116, 252, 140, C('gray', 0));
    return p;
  };
  const parkedY = 146 - 22 * S + 2;
  // Dex walks up with the keys.
  for (let k = 0; k < 8; k++) {
    const p = lawn(parkedY, {}, true);
    const dx = 10 + k * 9;
    scaleBlit(p, a.dexSide, dx, 86, 3);
    keyRing(p, dx + 50, 128 + (k % 2));
    if (k > 3) centeredText(p, 16, "GRANDPA'S KEYS!", C('gold', 5), C('gray', 0), 2);
    frames.push(p);
  }
  // Click: the doors unlock, the headlights blink, and he climbs in.
  for (let k = 0; k < 5; k++) {
    const p = lawn(parkedY, { headlights: k % 2 === 0, driver: k > 2 ? head(a) : undefined }, true);
    if (k <= 2) scaleBlit(p, a.dexSide, 82, 86, 3);
    centeredText(p, 16, k <= 2 ? 'CLICK!' : 'BUCKLE UP!', C('gold', 5), C('gray', 0), 2);
    frames.push(p);
  }
  // It unplugs itself, puts out its wings, and hums.
  for (let k = 0; k < 7; k++) {
    const p = lawn(parkedY, { driver: head(a), wings: k / 6, hum: k }, k < 2);
    centeredText(p, 16, 'AUTOPILOT: ON', C('teal', 5), C('gray', 0), 2);
    frames.push(p);
  }
  // Up, up and away.
  for (let k = 0; k < 10; k++) {
    const p = lawn(parkedY - k * k * 2, { driver: head(a), wings: 1, hum: k }, false, Math.max(0.2, 1 - k / 10));
    centeredText(p, 16, 'UP, UP AND AWAY!', C('gold', 5), C('gray', 0), 2);
    frames.push(p);
  }
  // Into the clouds, smaller and smaller toward the Skyway.
  for (let k = 0; k < 12; k++) {
    const p = new Pixels(W, H);
    sky(p, k * 14);
    const s = k < 4 ? 2 : 1;
    const car = citicarBig(s, { driver: s > 1 ? head(a) : undefined, wings: 1, hum: k });
    const x = 220 - k * 18;
    const y = 120 - k * 8;
    p.blit(car.pic, x, y, T);
    speedLines(p, x + car.pic.w - 6, y + car.pic.h / 2, 30, C('gray', 7));
    if (k > 6) centeredText(p, 176, 'NEXT STOP: THE SKYWAY', C('gray', 7), C('gray', 0));
    frames.push(p);
  }
  return fli(frames, 6, undefined, true);
}

export function parkingFli(a: Art): Uint8Array {
  const frames: Pixels[] = [];
  const S = 3;
  const deckTop = 150;
  const scene = (carX: number, carY: number, o: Parameters<typeof citicarBig>[1], drift: number) => {
    const p = new Pixels(W, H);
    sky(p, drift);
    // the Skyway's deck and its chrome rail
    p.blit(tiled(new Pixels(W, H - deckTop), FLOORS.deck), 0, deckTop);
    p.rect(0, deckTop - 10, W, 3, C('chrome', 6)).rect(0, deckTop - 7, W, 1, C('chrome', 2));
    for (let x = 6; x < W; x += 40) p.rect(x, deckTop - 10, 3, 10, C('chrome', 4));
    const car = citicarBig(S, o);
    if (carY + car.pic.h > deckTop - 4) oval(p, carX + car.pic.w / 2, deckTop + 8, 60, 4, C('chrome', 1));
    p.blit(car.pic, carX, carY, T);
    return p;
  };
  const landed = deckTop + 6 - 22 * S;
  // In from the right, wings out, settling onto the deck.
  for (let k = 0; k < 12; k++) {
    const t = k / 11;
    const p = scene(Math.round(330 - t * 230), Math.round(20 + (landed - 20) * (1 - (1 - t) ** 2)), { driver: head(a), wings: 1, hum: k }, 60 - k * 5);
    centeredText(p, 16, 'NOW ARRIVING: THE SKYWAY', C('gold', 5), C('gray', 0));
    frames.push(p);
  }
  // Wings in; Dex hops out.
  for (let k = 0; k < 8; k++) {
    const p = scene(100, landed, { driver: k < 3 ? head(a) : undefined, wings: Math.max(0, 1 - k / 3) }, 0);
    if (k >= 3) scaleBlit(p, a.dexSide, 238, deckTop - 58, 3, true);
    centeredText(p, 16, k < 3 ? 'PARKING...' : 'THANKS, CITICAR!', C('gold', 5), C('gray', 0), 2);
    frames.push(p);
  }
  // And it flies itself home to its charger.
  for (let k = 0; k < 10; k++) {
    const p = scene(100 - k * 22, landed - k * k * 2, { wings: 1, hum: k }, k * 3);
    scaleBlit(p, a.dexSide, 238, deckTop - 58, 3, true);
    centeredText(p, 16, 'HOME TO CHARGE!', C('gold', 5), C('gray', 0), 2);
    frames.push(p);
  }
  return fli(frames, 6, undefined, true);
}
