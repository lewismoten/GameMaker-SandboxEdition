// The scene sim's fast path for blocks that give birth to no monster plays exactly as the
// engine's BlocBirthMon does, on the CD's Sample game (every block of its set has one).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseGame } from '../../formats/game';
import { SceneSim } from './sim';

const dir = join(__dirname, '../../../../cd/gameware/sample');

describe('the scene sim’s birth fast path', () => {
  it.skipIf(!existsSync(dir))('matches the engine tick for tick', async () => {
    const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n)))]));
    const src = { get: (n: string) => files.get(n.toLowerCase()) };
    const game = parseGame(files.get('sample.gam')!);
    const start = game.scenes[0].links[0].to;
    const sims = [true, false].map((fast) => {
      const s = new SceneSim(game, 2, src, start);
      s.fastBirths = fast;
      return s;
    });
    for (let t = 0; t < 600; t++) {
      for (const s of sims) {
        if (t % 40 === 0) s.hold([t % 80 ? 0x4b : 0x4d]);
        await s.tick();
      }
    }
    const [a, b] = sims.map((s) => s.snapshot());
    expect(a.num).toEqual(b.num);
    expect(a.firstEmptyMM).toBe(b.firstEmptyMM);
    expect(a.mons).toEqual(b.mons);
    expect(a.monDiff).toEqual(b.monDiff);
  });
});
