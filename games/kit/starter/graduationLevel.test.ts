// The real hall camera must leave room over the cheering crowd, including tall Cast guests.
import { describe, expect, it } from 'vitest';
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { GameSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { shownBlock } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { cfg as basics } from '../../graduation-basics/src/config';
import { cfg as moving } from '../../graduation-moving/src/config';
import { cfg as heroes } from '../../graduation-heroes/src/config';
import { cfg as story } from '../../graduation-story/src/config';
import { cfg as wiring } from '../../graduation-wiring/src/config';
import { cfg as blocks } from '../../graduation-blocks/src/config';
import { buildLevels as diploma } from '../../graduation-diploma/src/levels';
import { buildLevels, type Level } from './graduationLevel';
import { buildGame } from './graduationGame';
import { finishBlocks } from './graduationHall';
import { buildHeroBlocks } from './hero';
import { buildHero } from './heroChar';
import { graduationMonsters } from './graduationConfetti';
import type { Pal } from './palette';

function hallSim(hall: Level, pal: Pal): GameSim {
  const hero = buildHeroBlocks(pal);
  const { monsterBlocks, monsters } = graduationMonsters(pal, hall.book);
  return new GameSim(
    new Map([
      ['grad.gam', serializeGame(buildGame([hall]))],
      ['hall.map', serializeMap(hall.map.done())],
      ['grad.bbl', serializeBlocks(finishBlocks(hall))],
      ['grad.mbl', serializeBlocks(monsterBlocks.finish())],
      ['grad.mon', serializeMonsters(monsters)],
      ['hero.cbl', serializeBlocks(hero.finish())],
      ['hero.chr', serializeCharacter(buildHero(hero))],
    ]),
  );
}

const halls = [
  ...[basics, moving, heroes, story, wiring, blocks].map((cfg) => ({ id: cfg.id, build: () => buildLevels(cfg) })),
  { id: 'graduation-diploma', build: diploma },
];

describe('graduation hall framing', () => {
  it('places falling confetti along the diploma balcony', async () => {
    const built = diploma();
    const falling = built.levels[1].map.done().monsters.filter((m) => m.monnum === 3 || m.monnum === 4);
    expect(falling.length).toBeGreaterThan(0);
    expect(new Set(falling.map((m) => m.monnum)).size).toBe(2);
    expect(Math.max(...falling.map((m) => m.curx))).toBeGreaterThanOrEqual(84);
    const sim = hallSim(built.levels[1], built.pal);
    const observed: number[][] = [[], []];
    for (let t = 0; t < 180; t++) {
      await sim.tick();
      for (const [kind, id] of [3, 4].entries()) {
        const mm = sim.w.mm.findIndex((m) => m.monnum === id);
        const mi = sim.w.mi[mm];
        observed[kind].push(mi.cury[0] * 20 + mi.cury[1]);
      }
    }
    for (const ys of observed) {
      expect(Math.min(...ys)).toBe(14 * 20);
      expect(Math.max(...ys)).toBe(18 * 20);
      expect(ys.some((y, i) => i > 0 && y > ys[i - 1])).toBe(true);
      expect(ys.some((y, i) => i > 0 && y < ys[i - 1])).toBe(true);
    }
    expect(sim.deaths).toBe(0);
    expect(sim.ci.hitpts).toBe(100);
  });

  it('shows the diploma confetti changing frames inside the standing viewport', async () => {
    const built = diploma();
    const hall = built.levels[1];
    const sim = hallSim(hall, built.pal);
    const confetti = new Set([...hall.book.index].filter(([n]) => n.startsWith('confetti.')).map(([, n]) => n));
    const visible = [...hall.map.done().blocks].flatMap((n, i) => {
      const x = ((i % MLEN) - sim.w.mx) * 20 - sim.w.scroll.nx - sim.w.scroll.littleShiftx;
      const y = (Math.floor(i / MLEN) - sim.w.my) * 20 - sim.w.scroll.ny - sim.w.scroll.littleShifty;
      return confetti.has(n) && x >= 0 && x + 20 <= 312 && y >= 0 && y + 20 <= 196 ? [n] : [];
    });
    expect(visible.length).toBeGreaterThan(0);
    const frames = new Set<string>();
    for (let i = 0; i < 32; i++) {
      frames.add(visible.map((n) => Array.from(shownBlock(sim.w, n).pixels).join(',')).join('|'));
      await sim.tick();
    }
    expect(frames.size).toBeGreaterThan(1);
  });

  it.each(halls)('$id leaves a full block of headroom above every audience frame', async ({ build }) => {
    const built = build();
    const hall = built.levels[1];
    const sim = hallSim(hall, built.pal);
    for (let i = 0; i < 60; i++) await sim.tick();
    const cameraY = sim.w.my * 20 + sim.w.scroll.ny + sim.w.scroll.littleShifty;
    const audience = new Set([...hall.book.index].filter(([n]) => n.startsWith('hall.') || n.startsWith('cameo.')).map(([, n]) => n));
    const placed = [...hall.map.done().blocks].flatMap((n, i) => (audience.has(n) ? [{ n, y: Math.floor(i / MLEN) * 20 - cameraY }] : []));
    expect(placed.length).toBeGreaterThan(0);
    for (const p of placed) {
      expect(p.y, `audience block ${p.n}`).toBeGreaterThanOrEqual(20);
      expect(p.y + 20).toBeLessThanOrEqual(196);
    }
    // Preserve the existing nearest-pixel, one-block correction for the camel and other tall guests.
    expect([...hall.book.index.keys()].filter((n) => n.startsWith('cameo.') && !n.endsWith('.0'))).toEqual([]);
  });
});
