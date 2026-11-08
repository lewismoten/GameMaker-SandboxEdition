// AskConfigData (PLAYGAME.C 4845-5100): PLAYGAME's own Configure screen, run on a Machine's 320 x 200
// screen. Arrow keys move a blinking white cursor, Enter picks, Esc or Done saves. The mouse works as in
// the C: moving it left, right, up or down moves the cursor, a click is Enter.
import { displayFile } from '@lewismoten/gamemaker-sandbox-engine/engine/showGraphic';
import { gGet } from '@lewismoten/gamemaker-sandbox-engine/engine/menus';
import type { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { drawConfigScreen, drawHelpFrame, moveMark } from './draw';
import { CONFIG_HLP } from './helpText';
import { type Arrow, type ConfigState, BUT_C, DRVR_C, choose, moveCursor } from './model';

const SCAN: Record<number, Arrow> = { 72: 'up', 80: 'down', 75: 'left', 77: 'right' };

/** The `colors` array AskConfigData fades to: the panels' bevel purples, the yellows, and a blue ramp that peaks at the cursor. */
function configPalette(cursor: number): Uint8Array {
  const pal = new Uint8Array(768);
  const set = (i: number, r: number, g: number, b: number) => pal.set([r & 63, g & 63, b & 63], i * 3);
  for (let l = 50; l < 76; l++) set(l, 0, 30, 63 - Math.abs(l - 50 - cursor) * 2);
  set(cursor + 50, 63, 63, 63);
  set(7, 10, 50, 63);
  set(8, 60, 60, 20);
  set(9, 30, 30, 10); // (colors[8] + colors[5]) / 2, and colors[5] is black
  set(10, 20, 60, 20);
  set(11, 10, 40, 10);
  for (let l = 0; l < 4; l++) set(l + 1, 10 + l * 4, 0, 10 + l * 4);
  return pal;
}

/** Shows the screen over a black one and returns the state when the player picks Done or presses Esc. */
export async function askConfigData(m: Machine, initial: ConfigState): Promise<ConfigState> {
  const s = m.screen;
  let st = { ...initial };
  let cursor = BUT_C;
  m.keyboard.attach();
  s.setPaletteTo(0, 0, 0);
  s.clear(0);
  drawConfigScreen(s, st);
  await m.fadeTo(configPalette(cursor));
  m.flushKeys();

  // the mouse: its movement since the last look builds up from the screen's middle, as setmoupos(100,100) did
  let mx = 100;
  let my = 100;
  let last = { x: m.pointer.x, y: m.pointer.y };
  m.pointer.clicks = 0;
  let timer = 0;
  let tick = m.now();

  const showCursor = () => {
    for (let l = 50; l < 76; l++) s.setColor(l, 0, 30, 63 - Math.abs(l - 50 - cursor) * 2);
    s.setColor(cursor + 50, 63, 63, 63);
  };
  const drawAll = () => {
    s.boxFill(0, 0, 320, 200, 0);
    drawConfigScreen(s, st);
  };

  try {
    for (;;) {
      // the C waited in 1 ms steps; the cursor is white from 0 to 400 and blue from 400 to 900 of each round
      let key: Arrow | 'enter' | 'esc' | undefined;
      do {
        const k = m.keyboard.readKey();
        if (k) {
          if (k.ascii === 0) key = SCAN[k.scan];
          else if (k.ascii === 13) key = 'enter';
          else if (k.ascii === 27) key = 'esc';
          if (!key) continue; // another key does nothing, as the switch had no case for it
        } else {
          const dx = m.pointer.x - last.x;
          const dy = m.pointer.y - last.y;
          last = { x: m.pointer.x, y: m.pointer.y };
          mx += dx;
          my += dy;
          if (mx < 60) key = 'left';
          else if (mx > 140) key = 'right';
          else if (my < 90) key = 'up';
          else if (my > 110) key = 'down';
          else if (m.takeClick()) key = 'enter';
          if (key && key !== 'enter') [mx, my] = [100, 100];
          if (!key) {
            await m.frame();
            const now = m.now();
            const before = timer;
            timer += Math.round(now - tick);
            tick = now;
            if (before < 400 && timer >= 400) s.setColor(cursor + 50, 0, 30, 63);
            if (timer >= 900) {
              s.setColor(cursor + 50, 63, 63, 63);
              timer = 0;
            }
          }
        }
      } while (!key);
      tick = m.now();

      const old = cursor;
      if (key === 'enter') {
        if (cursor === DRVR_C || cursor === DRVR_C + 1) {
          const name = cursor === DRVR_C;
          const text = await gGet(m, 10, name ? 170 : 182, 50 + cursor, 3, name ? st.driverName : st.driverPath, name ? 12 : 17);
          if (text !== null) st = name ? { ...st, driverName: text } : { ...st, driverPath: text };
          else drawAll(); // Esc: the typing is dropped
          continue;
        }
        if (cursor === BUT_C) {
          drawHelpFrame(s);
          m.flushKeys();
          m.pointer.clicks = 0;
          await displayFile(m, 'config.hlp', 7, 32000, s.palette, new TextEncoder().encode(CONFIG_HLP.replaceAll('\n', '\r\n')));
          drawAll();
          m.flushKeys();
          m.pointer.clicks = 0;
          continue;
        }
        if (cursor !== BUT_C + 1) {
          const next = choose(st, cursor);
          moveMark(s, st, next, cursor);
          st = next;
          continue;
        }
        return st; // Done falls into the Esc case
      }
      if (key === 'esc') return st;
      cursor = moveCursor(cursor, key);
      if (cursor !== old) showCursor();
    }
  } finally {
    s.setPaletteTo(0, 0, 0);
    s.clear(0);
    m.flushKeys();
  }
}
