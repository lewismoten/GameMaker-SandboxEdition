// The experimental gameplay patches (patchTable.ts's `play` group) against the CD's XFERPLAY.EXE:
// each writes exactly the immediates it lists and nothing else, none is written with no patch, a
// patched player reads back, and the web engine plays by the patched values.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyPlayerPatches, readPlayerPatches } from '@lewismoten/gamemaker-sandbox-archives/player/applyPatches';
import { PATCHES, type NumberPatch } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';
import { patchProblem, readPatch } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { playerLook, playTuning, STOCK_LOOK } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import { createWorld, STOCK_TUNING, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { moveCharGrav } from '@lewismoten/gamemaker-sandbox-engine/engine/character';
import { changeScroll, initScroll } from '@lewismoten/gamemaker-sandbox-engine/engine/scroll';
import { loadScene } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

const exe = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
const PLAY = PATCHES.filter((e): e is NumberPatch => e.group === 'play');

/** Every byte offset a number patch's fields cover. */
const bytesOf = (e: NumberPatch) => e.fields.flatMap((f) => Array.from({ length: f.size }, (_, i) => f.offset + i));
const diff = (a: Uint8Array, b: Uint8Array) => a.reduce<number[]>((out, v, i) => (v !== b[i] ? [...out, i] : out), []);
/** A value inside the range that differs from stock in every field's low byte. */
const other = (e: NumberPatch) => (e.stock === e.max ? e.max - 1 : e.stock + 1);

describe('the gameplay patches', () => {
  it('are the nine experimental constants, each marked experimental and shown on the web too', () => {
    expect(PLAY.map((e) => e.id)).toEqual([
      'play.maxSpeed',
      'play.gravityCap',
      'play.gravityTicks',
      'play.attackX',
      'play.attackY',
      'play.scrollSpeedX',
      'play.scrollSpeedY',
      'play.scrollSteps',
      'play.fadeSteps',
    ]);
    for (const e of PLAY) expect([e.safety, e.screen, e.web], e.id).toEqual(['experimental', 'gameplay', true]);
    expect(Object.keys(STOCK_TUNING).map((k) => `play.${k}`)).toEqual(PLAY.map((e) => e.id));
  });

  it('read the CD player’s own value at every immediate (a negated one holds minus it)', () => {
    for (const e of PLAY) {
      expect(readPatch(exe, e), e.id).toBe(e.stock);
      for (const f of e.fields) {
        const raw = f.size === 2 ? ((exe[f.offset] | (exe[f.offset + 1] << 8)) << 16) >> 16 : (exe[f.offset] << 24) >> 24;
        expect(raw, `${e.id} ${f.offset.toString(16)}`).toBe(f.negate ? -e.stock : e.stock);
      }
    }
  });

  it('keep each immediate within its encoding: a one-byte one is sign-extended, so -128..127 either way', () => {
    for (const e of PLAY) {
      for (const f of e.fields) {
        const lo = f.size === 1 ? -128 : f.negate ? -32768 : 0;
        const hi = f.size === 1 ? 127 : f.negate ? 32767 : 65535;
        for (const v of [e.min, e.max]) {
          const w = f.negate ? -v : v;
          expect(w >= lo && w <= hi, `${e.id} ${v}`).toBe(true);
        }
      }
      expect(patchProblem(e, e.min - 1), e.id).toBeDefined();
      expect(patchProblem(e, e.max + 1), e.id).toBeDefined();
      expect(patchProblem(e, e.min), e.id).toBeUndefined();
    }
  });

  it('write exactly their listed bytes and only those', () => {
    for (const e of PLAY) {
      for (const v of [e.min, e.max, other(e)]) {
        if (v === e.stock) continue;
        const out = applyPlayerPatches(exe, { [e.id]: v });
        const changed = diff(out, exe);
        const mine = new Set(bytesOf(e));
        expect(
          changed.filter((o) => !mine.has(o)),
          `${e.id} = ${v}`,
        ).toEqual([]);
        // every field's low byte changes (no listed immediate is skipped)
        for (const f of e.fields) expect(changed, `${e.id} = ${v} at ${f.offset.toString(16)}`).toContain(f.offset);
        expect(readPatch(out, e), e.id).toBe(v);
      }
    }
  });

  it('share no byte with each other or with any other setting', () => {
    const owner = new Map<number, string>();
    for (const e of PATCHES) {
      const offs = e.kind === 'number' || e.kind === 'frame' ? e.fields.flatMap((f) => Array.from({ length: f.size }, (_, i) => f.offset + i)) : [];
      for (const o of offs) {
        expect(owner.get(o), `${e.id} and ${owner.get(o)} at ${o.toString(16)}`).toBeUndefined();
        owner.set(o, e.id);
      }
    }
  });

  it('leave the player byte for byte as it came when none is set, and read back when all are', () => {
    expect(diff(applyPlayerPatches(exe, {}), exe)).toEqual([]);
    const all = Object.fromEntries(PLAY.map((e) => [e.id, other(e)]));
    const out = applyPlayerPatches(exe, all);
    expect(readPlayerPatches(out)).toEqual({ patches: all, explained: true, unreadable: [] });
    const zero = applyPlayerPatches(exe, { 'play.gravityCap': 0, 'play.fadeSteps': 0 });
    expect(readPlayerPatches(zero)?.patches).toEqual({ 'play.gravityCap': 0, 'play.fadeSteps': 0 });
  });
});

describe('the web engine with gameplay patches', () => {
  const world = (patches: Record<string, number> = {}): World => {
    const w = createWorld(newMap(), { play: () => false }, () => 0);
    w.tune = playTuning(playerLook(patches));
    w.chr = { ...newCharacter(), x: [0, 0], y: [0, 0] };
    return w;
  };

  it('plays by PLAYGAME.C’s own numbers with no patch', () => {
    expect(playTuning(STOCK_LOOK)).toEqual({ ...STOCK_TUNING });
    expect(STOCK_TUNING).toEqual({
      maxSpeed: 11,
      gravityCap: 44,
      gravityTicks: 1,
      attackX: 8,
      attackY: 5,
      scrollSpeedX: 40,
      scrollSpeedY: 40,
      scrollSteps: 6,
      fadeSteps: 65,
    });
    expect(createWorld(newMap(), { play: () => false }).tune).toEqual(STOCK_TUNING);
  });

  it('reads each patched value', () => {
    const all = Object.fromEntries(PLAY.map((e) => [e.id, other(e)]));
    const t = playTuning(playerLook(all));
    for (const e of PLAY) expect(t[e.id.slice(5) as keyof typeof t], e.id).toBe(other(e));
  });

  it('caps gravity at the patched pull and pulls on the patched step', () => {
    const w = world({ 'play.gravityCap': 20, 'play.gravityTicks': 3 });
    w.ci.gravx = 100;
    w.ci.gravy = -100;
    w.clock = 3;
    expect(moveCharGrav(w)).toBe(false); // 3 < gclk 1 + 3
    w.clock = 4;
    moveCharGrav(w);
    expect([w.ci.gravx, w.ci.gravy]).toEqual([20, -20]);
    const stock = world();
    stock.ci.gravx = 100;
    stock.clock = 2;
    moveCharGrav(stock);
    expect(stock.ci.gravx).toBe(44);
  });

  it('spreads a scroll over the patched steps at the patched speed', () => {
    const run = (patches: Record<string, number>) => {
      const w = world(patches);
      initScroll(w, { up: 0xff, down: 0xff, left: 0xff, right: 0xff });
      w.ci.nextx = 300;
      changeScroll(w);
      return w.scroll;
    };
    const stock = run({});
    const slow = run({ 'play.scrollSpeedX': 5, 'play.scrollSteps': 12 });
    expect([stock.bx.iters, slow.bx.iters]).toEqual([6, 12]);
    expect(slow.totalx).not.toBe(0);
    expect(Math.abs(slow.totalx)).toBeLessThan(Math.abs(stock.totalx));
  });

  it('sets a scene’s tuning from the session’s player look', () => {
    const files = new Map([
      ['a.map', serializeMap(newMap())],
      ['a.chr', serializeCharacter(newCharacter())],
    ]);
    const game = { scenes: [{ files: [] }, { files: ['', 'a.map', '', '', '', 'a.chr'] }] } as unknown as Game;
    const load = (look = STOCK_LOOK) => loadScene({ game, look, m: { files } }, 1);
    const patched = load(playerLook({ 'play.maxSpeed': 15, 'play.attackX': 3 }));
    const stock = load();
    expect(Array.isArray(patched) || Array.isArray(stock)).toBe(false);
    if (Array.isArray(patched) || Array.isArray(stock)) return;
    expect([patched.world.tune.maxSpeed, patched.world.tune.attackX, patched.world.tune.fadeSteps]).toEqual([15, 3, 65]);
    expect(stock.world.tune).toEqual(STOCK_TUNING);
  });
});
