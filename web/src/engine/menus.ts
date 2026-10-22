// Ports of playgame's in-graphics UI: GVertMenu, GGet, the default menu screen and
// the high score table (code/GM/PLAYGAME.C, GRAPHC.C, HISCOREL.C, PALC.C).
import type { Machine } from './machine';
import { match, RGB_BLUE, RGB_RED } from './showGraphic';
import { insertHighScore, parseHighScores, placeFor, serializeHighScores, type HighScore } from '../formats/highscore';
import { PALETTE_SIZE } from '../formats/palette';

/**
 * GVertMenu: a marker box left of `count` rows (`dy` pixels apart starting at y).
 * Returns 1..count, 0 for Esc, count+1 when idle for `idleSeconds`. The C timed the
 * idle wait in game ticks (IdleTime*18 of TimerCounter); this uses wall-clock time.
 *
 * The C cleared only the mouse buttons (mouclearbut), not the keyboard: a key typed
 * while the menu picture faded in (after the one ShowGraphic's PauseTimeKey(0) took)
 * was the menu's. `flushKeys` false keeps that; the default clears keys too, for menus
 * opened mid-level, where this port's keyboard also queues the keys gameplay used
 * (PLAYGAME's own keyboard interrupt kept those out of the BIOS buffer).
 */
export async function gVertMenu(m: Machine, x: number, y: number, dy: number, count: number, color: number, idleSeconds = Infinity, choice = 1, flushKeys = true): Promise<number> {
  // Rows are 1-based, so the marker for row c sits at y - 8 + c*dy, as in the C.
  const rowY = (c: number) => y - 8 + c * dy;
  let prev = m.screen.getCol(x, rowY(choice));
  if (flushKeys) m.flushKeys();
  else m.takeClick();
  let idleSince = m.now();
  for (;;) {
    m.screen.boxFill(x, rowY(choice), x + 5, rowY(choice) + 4, color);
    const k = m.keyboard.readKey();
    let move = 0;
    if (m.takeClick()) {
      // Pointer: pick the row that was clicked (rows span dy pixels around the text).
      // A port addition; the C mouse only acted as up/down arrows and Enter.
      const row = Math.floor((m.pointer.y - (y - 8) + dy / 2) / dy);
      if (row >= 1 && row <= count) {
        m.screen.boxFill(x, rowY(choice), x + 5, rowY(choice) + 4, prev);
        return row;
      }
    }
    if (k) {
      idleSince = m.now();
      if (k.ascii === 13) return choice;
      if (k.ascii === 27) return 0;
      if (k.scan === 72) move = -1;
      if (k.scan === 80) move = 1;
    } else if (m.now() - idleSince > idleSeconds * 1000) return count + 1;
    if (move) {
      m.screen.boxFill(x, rowY(choice), x + 5, rowY(choice) + 4, prev);
      choice += move;
      if (choice < 1) choice = count;
      if (choice > count) choice = 1;
      prev = m.screen.getCol(x, rowY(choice));
    }
    await m.frame();
  }
}

/** GGet: line editor with a blinking box cursor. Returns null on Esc. */
export async function gGet(m: Machine, x: number, y: number, col: number, bcol: number, initial: string, maxlen: number): Promise<string | null> {
  let ans = initial.slice(0, maxlen);
  m.screen.write(x, y, col, ans);
  m.flushKeys();
  const cursor = (c: number) => {
    const n = ans.length;
    if (n < maxlen) m.screen.box(x + n * 8, y, x + (n + 1) * 8 - 2, y + 7, c);
    else m.screen.line(x + n * 8 - 1, y, x + n * 8 - 1, y + 7, c);
  };
  for (;;) {
    // GGet blinked by counting delay(1) calls; a fixed 450 ms phase stands in for it.
    const blinkOn = Math.floor(m.now() / 450) % 2 === 0;
    cursor(blinkOn ? col : bcol);
    const k = m.keyboard.readKey();
    if (!k) {
      await m.frame();
      continue;
    }
    cursor(bcol);
    if (k.ascii === 27) return null;
    if (k.ascii === 13) return ans;
    if (k.ascii === 8 || k.scan === 75) {
      if (ans.length) {
        ans = ans.slice(0, -1);
        m.screen.boxFill(x + ans.length * 8, y, x + (ans.length + 1) * 8 - 1, y + 7, bcol);
      }
    } else if (k.ascii >= 32 && k.ascii < 256 && ans.length < maxlen) {
      ans += String.fromCharCode(k.ascii);
      m.screen.write(x, y, col, ans);
    }
  }
}

/**
 * RandCols (PALC.C): random smooth color ramps for the default menu screen. Each
 * channel steps by 2 per entry; every 32 entries a stopped channel may start rising
 * (random(2) only gives 0 or 1). A channel that reaches 63 falls back to 0 and waits there.
 */
export function randCols(rand = Math.random): Uint8Array {
  const pal = new Uint8Array(PALETTE_SIZE);
  const add = 2;
  let [r, g, b] = [0, 0, 0];
  let [rd, gd, bd] = [0, 0, 0];
  const random2 = () => Math.floor(rand() * 2);
  for (let l = 0; l < 256; l++) {
    if (l % (64 / add) === 0) {
      do {
        if (bd === 0) bd = random2();
        if (gd === 0) gd = random2();
        if (rd === 0) rd = random2();
      } while (bd === 0 && gd === 0 && rd === 0);
    }
    if (rd === 1) r += add;
    if (gd === 1) g += add;
    if (bd === 1) b += add;
    if (rd === 2) r -= add;
    if (gd === 2) g -= add;
    if (bd === 2) b -= add;
    if (r >= 63) [rd, r] = [2, 63];
    if (b >= 63) [bd, b] = [2, 63];
    if (g >= 63) [gd, g] = [2, 63];
    if (r < 0) [r, rd] = [0, 0];
    if (g < 0) [g, gd] = [0, 0];
    if (b < 0) [b, bd] = [0, 0];
    pal.set([r, g, b], l * 3);
  }
  return pal;
}

/** DrawDefaultScrn: concentric colored frames when a game has no menu graphic. */
export function drawDefaultScreen(m: Machine, colors: Uint8Array): void {
  m.screen.clear();
  colors.set(randCols());
  m.screen.setPalette(colors);
  // Box l uses color l, so the random ramps in palette entries 0..100 form the frames.
  for (let l = 0; l <= 100; l++) m.screen.box(40 - Math.trunc((l * 4) / 10), 100 - l, 280 + Math.trunc((l * 4) / 10), 180 + Math.trunc((l * 2) / 10), l);
}

export function highScoreFile(gamename: string): string {
  return `${gamename}.his`;
}

export function readHighScores(m: Machine, gamename: string): HighScore[] {
  const bytes = m.files.get(highScoreFile(gamename));
  return bytes ? parseHighScores(bytes) : Array.from({ length: 10 }, () => ({ score: 0, name: '' }));
}

/** ShowHighScores (HISCOREL.C): the table rows get closer together further down. */
export async function showHighScores(m: Machine, gamename: string, colors: Uint8Array, score = -1): Promise<void> {
  await m.need(highScoreFile(gamename));
  const top = readHighScores(m, gamename);
  const red = match(colors, RGB_RED);
  const blue = match(colors, RGB_BLUE);
  m.screen.setPalette(colors);
  m.screen.write(104, 0, red, 'Top Ten Scores');
  // Row gaps shrink 2, 1, 2, 1... pixels: 22, 20, 19, 17, ...
  let space = 22;
  let ypos = 27;
  for (let j = 0; j < 10; j++) {
    if (top[j].score !== 0) m.screen.write(20, ypos, blue, `${String(top[j].score).padStart(10)} ${top[j].name}`);
    ypos += space;
    if (j % 2 === 0) space--;
    space--;
  }
  if (score > 0) m.screen.write(20, ypos, blue, `${String(score).padStart(10)} Your Latest Score`);
  m.screen.write(116, 192, red, 'Hit any key');
  await m.pauseTimeKey(30);
}

/** CheckHighScores: asks for a name when the score makes the top ten; returns the 1-based place or 0. */
export async function checkHighScores(m: Machine, gamename: string, colors: Uint8Array, score: number): Promise<number> {
  await m.need(highScoreFile(gamename));
  const top = readHighScores(m, gamename);
  const place = placeFor(top, score);
  let result = 0;
  let next = top;
  if (place >= 0) {
    const red = match(colors, RGB_RED);
    const blue = match(colors, RGB_BLUE);
    m.screen.write(96, 40, red, 'Congratulations!');
    m.screen.write(0, 100, blue, `You scored number ${String(place + 1).padStart(2)} on the Top Ten!`);
    m.screen.write(0, 120, red, 'Enter Your Name:');
    const name = (await gGet(m, 136, 120, blue, 0, '', 22)) ?? '';
    next = insertHighScore(top, place, { score, name });
    result = place + 1;
  }
  m.files.set(highScoreFile(gamename), serializeHighScores(next));
  return result;
}
