// The Ultimate Owner's Guide's three-token gate (Chapter 4, chaptersPlay.ts) built as a tiny
// game and played on the engine: the settings the exercise gives, and what it says happens.
import { describe, expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '../../formats/blocks';
import { parseCharacter, serializeCharacter } from '../../formats/character';
import { MLEN, parseMap, serializeMap } from '../../formats/map';
import { SceneSim } from '../../editor/check/sim';
import { RIGHT, testGame } from '../../editor/check/testGame';

const FLOOR = 0;
const TOKEN = 4;
const GATE = 5;
const SPECIAL_1 = 20; // "Special counter 1" in the block editor's Changes counter list

// the hero starts at S and walks right over three tokens to the gate and the exit past it
const ROWS = ['############', '#..........#', '#S.t.t.t.gE#', '############'];
// the same corridor with the first token taken away
const ROWS_TWO = ['############', '#..........#', '#S...t.t.gE#', '############'];

/** The exercise's game; `start` is special counter 1 at the start (the Character Maker's #1). */
function gateGame(start: number, take: number, rows: string[]) {
  const t = testGame(rows.map((r) => r.replace(/[tg]/g, '.')));
  const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
  // the token: not solid; Changes counter Special counter 1 by 1; Becomes block 0 (the floor)
  Object.assign(bbl[TOKEN], { grav: 4, effect: SPECIAL_1, eamt: 1, touchBl: FLOOR });
  // the gate: Solid sides all four; Changes counter Special counter 1 by -3; Becomes block 0
  Object.assign(bbl[GATE], { solid: 15, effect: SPECIAL_1, eamt: -take, touchBl: FLOOR });
  const map = parseMap(t.files.get('test.map')!);
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === 't' && (map.blocks[y * MLEN + x] = TOKEN)));
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === 'g' && (map.blocks[y * MLEN + x] = GATE)));
  const chr = parseCharacter(t.files.get('test.chr')!);
  chr.meter[SPECIAL_1] = start + 1; // the Character Maker stores a counter's start plus one
  t.files.set('test.bbl', serializeBlocks(bbl));
  t.files.set('test.map', serializeMap(map));
  t.files.set('test.chr', serializeCharacter(chr));
  return t;
}

/** Walks right for up to `ticks` over `rows`; the tokens taken, whether the gate opened and the exit was reached. */
async function walk(start: number, take = 3, rows = ROWS, ticks = 400) {
  const t = gateGame(start, take, rows);
  const gate = rows[2].indexOf('g') + 2 * MLEN;
  const sim = new SceneSim(t.game, 2, t, { x: 1, y: 1 });
  sim.hold([RIGHT]);
  let exit = false;
  for (let i = 0; i < ticks && !exit; i++) exit = !!(await sim.tick());
  const tokens = [...rows[2]].filter((c, x) => c === 't' && sim.w.map[2 * MLEN + x] === FLOOR).length;
  return { tokens, open: sim.w.map[gate] === FLOOR, exit, counter: sim.w.ci.meter[SPECIAL_1] - 1 };
}

describe('the three-token gate exercise', () => {
  it('opens once three tokens are collected, and spends them', async () => {
    expect(await walk(0)).toEqual({ tokens: 3, open: true, exit: true, counter: 0 });
  });

  it('stays shut with only two tokens (the counter would go below zero)', async () => {
    expect(await walk(0, 3, ROWS_TWO)).toEqual({ tokens: 2, open: false, exit: false, counter: 2 });
  });

  it('follow-up: starting the counter at 1, two tokens open it', async () => {
    expect(await walk(1, 3, ROWS_TWO)).toEqual({ tokens: 2, open: true, exit: true, counter: 0 });
  });

  it('follow-up: a gate that takes 4 stays shut after three tokens', async () => {
    expect(await walk(0, 4)).toEqual({ tokens: 3, open: false, exit: false, counter: 3 });
  });
});
