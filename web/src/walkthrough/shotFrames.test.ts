// Screenshots that are moments of play (gfx/shotFrame.ts): the forms box shots and manual
// pages write them in, and every frame the site ships (public/frames/) matching the screen a
// replay of the game's walkthrough on the real engine shows at that tick (else rerun
// scripts/shotFrames.ts).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { asFrame, framePath, shotFrame, wantedFrames } from '../gfx/shotFrame';
import { drawFrames, frameGames } from '../../scripts/shotFramesDraw';

const publicDir = resolve(__dirname, '../../public');

describe('shot frames', () => {
  it('reads a box shot’s frame, and none from a plain map view', () => {
    expect(shotFrame(['clouds.map', 0, 0])).toBeUndefined();
    expect(shotFrame(['clouds.map', 0, 0, { tick: 840 }])).toEqual({ tick: 840 });
    expect(shotFrame(['clouds.map', 0, 0, { tick: 12, scene: 3 }])).toEqual({ tick: 12, scene: 3 });
    for (const bad of [{}, { tick: -1 }, { tick: 1.5 }, { tick: '840' }, { tick: 1, scene: 'x' }, null, 840]) expect(asFrame(bad)).toBeUndefined();
  });

  it('lists the frames a box and a manual ask for, each once', () => {
    const wants = wantedFrames(
      {
        shots: [
          ['dome.map', 0, 9],
          ['Clouds.MAP', 0, 0, { tick: 840 }],
          ['mall.map', 0, 0],
        ],
      },
      [
        '<p><shot map="clouds.map" x="0" y="0" w="16" h="10" tick="840" caption="Nine miles"></p>',
        '<shot map="moon.map" x="0" y="1" tick="30" scene="9"><shot map="mall.map" x="0" y="0">',
      ],
    );
    expect(wants).toEqual([
      { map: 'clouds.map', tick: 840 },
      { map: 'moon.map', tick: 30, scene: 9 },
    ]);
    expect(framePath('year2000', wants[0])).toBe('frames/year2000-clouds-840.png');
    expect(framePath('year2000', wants[1])).toBe('frames/year2000-moon-s9-30.png');
  });

  it('ships only frames a game’s pictures ask for', () => {
    const dir = join(publicDir, 'frames');
    const wanted = new Set(frameGames().flatMap((g) => g.wants.map((f) => framePath(g.id, f))));
    const shipped = existsSync(dir) ? readdirSync(dir).map((f) => `frames/${f}`) : [];
    expect(shipped.filter((f) => !wanted.has(f))).toEqual([]);
  });

  for (const g of frameGames())
    it(`${g.id}: each frame is the screen its walkthrough's replay shows then`, { timeout: 300_000 }, async () => {
      for (const [path, png] of await drawFrames(g)) {
        expect(png, `${path} never shows in the walkthrough`).toBeDefined();
        const file = join(publicDir, path);
        expect(existsSync(file), `${path} missing: run npx vite-node scripts/shotFrames.ts ${g.id}`).toBe(true);
        expect(Buffer.from(png!).equals(readFileSync(file)), `${path} is out of date: run npx vite-node scripts/shotFrames.ts ${g.id}`).toBe(true);
      }
    });
});
