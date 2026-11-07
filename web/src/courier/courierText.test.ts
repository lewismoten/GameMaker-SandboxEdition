// A letter's date is the PC's day (December 1994, as DATE shows) and both faces show it the same:
// SCOOT.EXE's screen and Scoot's card both format it with letterDate.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { letterDate, mailDay } from './courierText';
import { deliver } from './courierStore';
import { runScootExe } from './scootExe';
import type { Ui } from '../retro/text/textUi';

const stored = new Map<string, string>();
beforeEach(() => {
  stored.clear();
  vi.stubGlobal('localStorage', { getItem: (k: string) => stored.get(k) ?? null, setItem: (k: string, v: string) => stored.set(k, v) });
});
afterEach(() => vi.unstubAllGlobals());

/** SCOOT.EXE's screen as text, after the keys given (then Esc). */
async function exeText(keys: string[]): Promise<string> {
  const rows: string[] = [];
  const screen = {
    cursorVisible: true,
    gameMakerColors: () => {},
    resetPalette: () => {},
    clear: () => {},
    fill: () => {},
    window: () => {},
    write: (_x: number, _y: number, _a: number, text: string | Uint8Array) => rows.push(typeof text === 'string' ? text : String.fromCharCode(...text)),
  };
  const queue = [...keys, 'Escape'];
  let shown = '';
  const ui = {
    screen,
    keys: {
      next: async () => {
        shown += rows.join('\n') + '\n';
        rows.length = 0;
        return { key: queue.shift() ?? 'Escape' };
      },
    },
  } as unknown as Ui;
  await runScootExe(ui);
  return shown;
}

describe('a letter’s date', () => {
  it('is the PC’s December 1994 day, not the real year', () => {
    expect(mailDay(new Date(2026, 10, 7, 12))).toBe('1994-12-07');
    expect(mailDay()).toMatch(/^1994-12-\d\d$/);
    expect(letterDate('1994-12-07')).toBe('12-07-94');
  });

  it('SCOOT.EXE shows it as letterDate does, in the list and the open letter', async () => {
    deliver('bbs-sofa', '1994-12-07');
    expect(await exeText([])).toContain('12-07-94');
    expect(await exeText(['Enter'])).toContain('Date: 12-07-94');
  });

  it('the card formats it with the same letterDate (and no other date code)', () => {
    const card = readFileSync(resolve(__dirname, '../desk/buddy/courierCard.ts'), 'utf8');
    expect(card).toContain('letterDate(item.day)');
    expect(card).toContain('letterDate(m.day)');
    for (const src of [card, readFileSync(resolve(__dirname, 'scootExe.ts'), 'utf8')]) expect(src).not.toMatch(/toLocaleDateString|getFullYear|new Date\(/);
  });
});
