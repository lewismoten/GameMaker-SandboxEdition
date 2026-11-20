// Native weapon-impact timing and fresh-game reset on the actual generated disk and play loop.
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { StarterBot } from '../../kit/starter/bot';
import { GameSim } from './sim';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { ORIGIN } from '../../kit/starter/map';
import { L2, STAND } from '../src/levels';
import { SCAN_JUMP } from '../src/hero';
import { shiftY } from '../src/pack';
import { stargazingHill, mainStreet, shyStreet, spamRow } from './route';
import { BIG1, COTTAGE, TOWER, SHED, CONF_BIG, CONF_COT, CONF_TOW, CONF_SHED, LIT_BIG, LIT_COT, LIT_TOW, LIT_SHED } from '../src/monsters';

describe('built Stick Man Stars polish', () => {
  it.each([2, 3, 4])('keeps the camera from scrolling above its standing position during a held jump on level %i', async (level) => {
    const files = new Map(new GameSim().files);
    const name = [...files.keys()].find((n) => n.endsWith('.gam'))!;
    const game = parseGame(files.get(name)!);
    // Start at the ordinary entrance from the preceding level.
    game.scenes[0].links[0] = game.scenes[level].links[0];
    files.set(name, serializeGame(game));
    const sim = new GameSim(files);
    const bot = new StarterBot(sim);
    expect(await bot.land()).toBeUndefined();
    const cameraTop = () => sim.w.my * 20 + sim.w.scroll.ny + sim.w.scroll.littleShifty;
    const standingTop = cameraTop();
    const standingY = sim.pos.y;
    let peakY = standingY;
    sim.press(SCAN_JUMP);
    for (let tick = 0; tick < 40; tick++) {
      expect(await sim.tick()).toBeUndefined();
      expect(cameraTop()).toBeGreaterThanOrEqual(standingTop);
      peakY = Math.min(peakY, sim.pos.y);
    }
    expect(peakY).toBeLessThan(standingY);
  });

  it('allows an untimed rest and a direct walk onward without a pickup, hit or lighting cue', async () => {
    const files = new Map(new GameSim(undefined, 1).files);
    const name = [...files.keys()].find((n) => n.endsWith('.gam'))!;
    const game = parseGame(files.get(name)!);
    game.scenes[0].links[0] = { toScene: 4, from: { x: 0, y: 0 }, to: { x: ORIGIN + 76, y: ORIGIN + STAND + shiftY(2) } };
    files.set(name, serializeGame(game));
    const sim = new GameSim(files, 1);
    const bot = new StarterBot(sim);
    bot.jumpHold = 8;
    await bot.land();
    const pos = { ...bot.px };
    const hp = sim.ci.hitpts;
    const score = sim.ci.score;
    const sounds: number[] = [];
    const play = sim.w.sound.play;
    sim.w.sound.play = (n) => {
      sounds.push(n);
      return play(n);
    };
    expect(await bot.wait(600)).toBeUndefined();
    expect(bot.px).toEqual(pos);
    expect(sim.scene).toBe(4);
    expect(sim.ci.hitpts).toBe(hp);
    expect(sim.ci.score).toBe(score);
    expect(sounds.filter((n) => n === 1)).toHaveLength(0);
    expect(await bot.walk(L2.exit + 1)).toBe('link');
    expect(sim.scene).toBe(5);
  });

  it('sounds on every first lit frame, never repeats during confetti, and resets on a fresh game', async () => {
    const traces: string[][] = [];
    let initialMap: Uint8Array | undefined;
    let initialBlocks: Uint8Array | undefined;
    for (let run = 0; run < 2; run++) {
      const sim = new GameSim(undefined, 1);
      const bot = new StarterBot(sim);
      bot.jumpHold = 8;
      if (!initialMap) {
        initialMap = Uint8Array.from(sim.w.map);
        initialBlocks = Uint8Array.from(sim.w.blkmap);
      } else {
        expect(Buffer.compare(Uint8Array.from(sim.w.map), initialMap)).toBe(0);
        expect(Buffer.compare(Uint8Array.from(sim.w.blkmap), initialBlocks!)).toBe(0);
        expect(sim.ci.score).toBe(0);
        expect(sim.clip).toBeUndefined();
      }
      const events: { scene: number; clock: number; n: number }[] = [];
      const lighting: string[] = [];
      const watched = new WeakSet<object>();
      const tick = sim.tick.bind(sim);
      sim.tick = async () => {
        const w = sim.w;
        const scene = sim.scene;
        if (!watched.has(w)) {
          watched.add(w);
          const play = w.sound.play;
          w.sound.play = (n) => {
            events.push({ scene, clock: w.clock, n });
            return play(n);
          };
        }
        const before = w.mm.map((m) => m.monnum);
        const out = await tick();
        if (sim.w === w) {
          w.mm.forEach((m, i) => {
            if (
              ![
                [COTTAGE, CONF_COT],
                [TOWER, CONF_TOW],
                [SHED, CONF_SHED],
                [BIG1, CONF_BIG],
              ].some(([a, b]) => before[i] === a && m.monnum === b)
            )
              return;
            const sameTick = events.filter((e) => e.scene === scene && e.clock === w.clock && e.n === 1);
            expect(sameTick).toHaveLength(1);
            expect(sim.clip?.name).toBe('HOUSELIT');
            lighting.push(`${scene}:${w.clock}:${before[i]}:${m.monnum}`);
          });
          // Becoming a settled lit house must not play the cue again.
          if (w.mm.some((m, i) => [CONF_COT, CONF_TOW, CONF_SHED, CONF_BIG].includes(before[i]) && [LIT_COT, LIT_TOW, LIT_SHED, LIT_BIG].includes(m.monnum)))
            expect(events.filter((e) => e.scene === scene && e.clock === w.clock && e.n === 1)).toHaveLength(0);
        }
        return out;
      };
      for (const route of [stargazingHill, mainStreet, shyStreet, spamRow]) await route(bot);
      expect(sim.ended).toBe('won');
      expect(sim.deaths).toBe(0);
      expect(sim.ci.score).toBe(1420); // the signs stand on one post now, so three coins a second post covered are back
      expect(lighting.length).toBeGreaterThan(0);
      expect(new Set(lighting.map((s) => Number(s.split(':')[2])))).toEqual(new Set([COTTAGE, TOWER, SHED, BIG1]));
      traces.push(lighting);
    }
    expect(traces[1]).toEqual(traces[0]);
  }, 30000);
});
