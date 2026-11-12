// Stick Man Stars' DOS-native polish contracts, including the first visible lighting frame.
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { buildLevels, L2 } from '../src/levels';
import { monsterPictures, monsterSet, CONF_COT, CONF_TOW, CONF_SHED, LIT_COT, LIT_TOW, LIT_SHED } from '../src/monsters';
import { throwSounds } from '../src/sounds';
import * as cartoons from '../src/skyFli';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { heroPicture } from '../../kit/starter/hero';
import { buildStickBlocks } from '../src/stick';

describe('house lighting cue', () => {
  it('uses a synthesized digital cue on the native weapon-impact sound slot', () => {
    const snd = throwSounds();
    expect(snd.digital[1]).toBe('HOUSELIT');
    expect([...snd.freqs[1]].some((hz) => hz > 0)).toBe(true);
  });

  it('already shows the lit house under confetti when the impact cue starts', () => {
    const { pal } = buildLevels();
    const mb = monsterPictures(pal);
    const mons = monsterSet(mb);
    for (const [party, lit] of [
      [CONF_COT, LIT_COT],
      [CONF_TOW, LIT_TOW],
      [CONF_SHED, LIT_SHED],
    ]) {
      const first = mb.finish()[mons[party].pic[0][0]].pixels;
      const settled = mb.finish()[mons[lit].pic[0][0]].pixels;
      // The flag's dark star is surrounded by gold immediately, not only after PARTY ticks.
      const gold = new Set(pal.r('gold'));
      const flag = [...settled].flatMap((c, i) => (gold.has(c) && Math.floor(i / 20) < 7 ? [i] : []));
      expect(flag.length).toBeGreaterThan(0);
      expect(flag.filter((i) => gold.has(first[i])).length).toBeGreaterThan(flag.length / 2);
      expect(mons[party].newmon).toBe(lit);
    }
  });
});

describe('quiet stretch before Spam Row', () => {
  it('leaves a full easy pocket after Shy Street’s last gate, without adding a level', () => {
    const { levels } = buildLevels();
    expect(levels.map((l) => l.title)).toEqual(['Stargazing Hill', 'Main Street', 'Shy Street', 'Spam Row']);
    expect(L2.exit - L2.tunnel[1]).toBeGreaterThanOrEqual(16);
    expect(L2.width + 10).toBeLessThanOrEqual(100);
  });
});

describe('ending cartoon', () => {
  it('plays a finite palette animation of the won street and holds its final colors', () => {
    expect(typeof cartoons.endingFli).toBe('function');
    const { pal, book } = buildLevels();
    const hero = heroPicture(buildStickBlocks(pal), 'cheer.top', 'jump');
    const bytes = cartoons.endingFli(pal, book, monsterPictures(pal), hero);
    const anim = parseFli(bytes);
    expect([anim.width, anim.height]).toEqual([320, 200]);
    expect(anim.frameCount).toBe(48);
    expect(anim.frames.length).toBe(anim.frameCount);
    expect(anim.speed).toBe(4);
    const canvas = newFliCanvas(anim);
    applyFliFrame(anim, 0, canvas);
    const first = canvas.palette.slice();
    const picture = canvas.pixels.slice();
    let hold: Uint8Array | undefined;
    for (let i = 1; i < anim.frameCount; i++) {
      applyFliFrame(anim, i, canvas);
      expect(Buffer.compare(canvas.pixels, picture)).toBe(0);
      expect([...canvas.palette].every((c) => c <= 63)).toBe(true);
      if (i === 36) hold = canvas.palette.slice();
    }
    expect(canvas.palette).not.toEqual(first);
    expect(canvas.palette).toEqual(hold);
    expect(Buffer.compare(cartoons.endingFli(pal, book, monsterPictures(pal), hero), bytes)).toBe(0);
  });
});
