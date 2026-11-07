// A letter's date is the PC's day (December 1994, as DATE shows) and both faces show it the same:
// SCOOT.EXE's screen and Scoot's card both format it with letterDate.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { letterDate, mailDay, stampRows } from './courierText';
import { addStamp, deliver } from './courierStore';
import { STAMP_WORDS } from './tables';
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

describe('stamps in SCOOT.EXE', () => {
  it('two to a row, a catalog game by its title, a long name cut to fit', () => {
    const p = { world: 0, stamps: [{ kind: 'sample-cd' as const }, { kind: 'game' as const, game: 'g' }, { kind: 'mystery' as const }] };
    const rows = stampRows(p, (id) => (id === 'g' ? 'A Very Long Title That Goes On And On Past The Column' : undefined), 72);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatch(/^ {2}Sample CD +A Very Long Title.*\.$/);
    expect(rows[1].trim()).toBe(STAMP_WORDS.mystery);
    for (const r of rows) expect(r.length).toBeLessThanOrEqual(72);
    expect(stampRows(p, () => undefined, 72)[0]).toContain('A game');
  });

  it('the Postcards section lists them, and a long rack scrolls with the arrows', async () => {
    addStamp({ kind: 'sample-cd' }, () => 0);
    addStamp({ kind: 'graduation' }, () => 0);
    addStamp({ kind: 'mystery' }, () => 0);
    const shown = await exeText(['ArrowRight']);
    for (const w of Object.values(STAMP_WORDS)) expect(shown).toContain(w);
    expect(shown).not.toContain('Scroll');
    for (let i = 0; i < 40; i++) addStamp({ kind: 'game', game: `g${i}` }, () => 0);
    expect(await exeText(['ArrowRight'])).toContain('Scroll');
  });
});
