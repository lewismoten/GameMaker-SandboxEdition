// Stick Man Stars' DOS-native polish contracts, including the first visible lighting frame.
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { paletteFor } from '../src/moods';
import { buildLevels, L2 } from '../src/levels';
import { monsterPictures, monsterSet, CONF_BIG, CONF_COT, CONF_TOW, CONF_SHED, LIT_BIG, LIT_COT, LIT_TOW, LIT_SHED } from '../src/monsters';
import { houseLitVoc, throwSounds } from '../src/sounds';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import * as cartoons from '../src/skyFli';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { heroPicture } from '../../kit/starter/hero';
import { buildStickBlocks } from '../src/stick';

describe('house lighting cue', () => {
  it('releases the first note before the next attack instead of clicking at the join', () => {
    const bytes = houseLitVoc();
    const { samples, sampleRate } = decodeVoc(bytes);
    const join = Math.round((samples.length * 0.09) / 0.24);
    expect(Math.max(...samples.slice(join - 4, join).map(Math.abs))).toBeLessThan(0.05);
    expect(samples.length / sampleRate).toBeLessThan(0.3);
    expect(Buffer.compare(houseLitVoc(), bytes)).toBe(0);
  });
  it('uses a synthesized digital cue on the native weapon-impact sound slot', () => {
    const snd = throwSounds();
    expect(snd.digital[1]).toBe('HOUSELIT');
    expect([...snd.freqs[1]].some((hz) => hz > 0)).toBe(true);
  });

  it('keeps the three lanterns on the Big Repo and clear of its window glow', () => {
    const { pal } = buildLevels();
    const pictures = monsterPictures(pal);
    const set = monsterSet(pictures);
    const blocks = pictures.finish();
    for (const f of [0, 1]) {
      const pixels = (mon: number) => blocks[set[mon].pic[f][0]].pixels;
      for (const x of [2, 8, 15]) {
        expect(pixels(LIT_SHED)[12 * 20 + x]).not.toBe(pal.c('gold', 4));
        expect(pixels(LIT_BIG)[12 * 20 + x]).toBe(pal.c('gold', 4));
      }
      expect(pixels(CONF_BIG)[12 * 20 + 15]).toBe(pal.c('gold', 4));
      for (const x of [3, 16]) expect(pixels(LIT_BIG)[14 * 20 + x]).toBe(pal.c('gold', 3));
      expect(pixels(LIT_SHED)[14 * 20 + 3]).toBe(pal.c('white', 3));
    }
  });

  it('already shows the lit house under confetti when the impact cue starts', () => {
    const { pal } = buildLevels();
    const mb = monsterPictures(pal);
    const mons = monsterSet(mb);
    for (const [party, lit] of [
      [CONF_COT, LIT_COT],
      [CONF_TOW, LIT_TOW],
      [CONF_SHED, LIT_SHED],
      [CONF_BIG, LIT_BIG],
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
    // Clouds must not compete with the large white ending heading.
    expect([...picture.subarray(12 * 320 + 60, 12 * 320 + 260)].every((c) => c === pal.c('sky', 0))).toBe(true);
    let hold: Uint8Array | undefined;
    for (let i = 1; i < anim.frameCount; i++) {
      applyFliFrame(anim, i, canvas);
      expect(Buffer.compare(canvas.pixels, picture)).toBe(0);
      expect([...canvas.palette].every((c) => c <= 63)).toBe(true);
      if (i === 36) hold = canvas.palette.slice();
      if (i >= 36) expect(canvas.palette, `frame ${i}`).toEqual(hold);
    }
    expect(canvas.palette).not.toEqual(first);
    expect(Buffer.compare(cartoons.endingFli(pal, book, monsterPictures(pal), hero), bytes)).toBe(0);
  });
});

// Decode the shipped animation format, including every title and its final reading hold.
describe('paper level openings', () => {
  it('finishes every notebook card in about two seconds and holds the complete name and hint', () => {
    const { pal, levels } = buildLevels();
    const hero = heroPicture(buildStickBlocks(pal), 'stand.top', 'stand');
    levels.forEach((level, i) => {
      const cardPal = paletteFor(pal, level.mood, 'notebook');
      const anim = parseFli(cartoons.paperOpening(cardPal, hero, i + 1, levels.length, level.title, level.hint));
      expect(anim.frames.length).toBe(anim.frameCount);
      expect((anim.frameCount * anim.speed) / 70).toBeLessThan(2.1);
      const canvas = newFliCanvas(anim);
      let first: Uint8Array | undefined;
      let hold: Uint8Array | undefined;
      for (let f = 0; f < anim.frameCount; f++) {
        applyFliFrame(anim, f, canvas);
        if (f === 0) first = canvas.pixels.slice();
        if (f === 29) hold = canvas.pixels.slice();
        if (f >= 29) expect(canvas.pixels).toEqual(hold);
      }
      expect(canvas.pixels).not.toEqual(first);
      expect(canvas.pixels).toEqual(Uint8Array.from(cartoons.paperCard(cardPal, hero, i + 1, levels.length, level.title, level.hint).px));
      expect(canvas.palette).toEqual(cardPal.pal);
    });
  });
});

it('tints the same sheet differently at dawn, day and dusk', () => {
  const { pal } = buildLevels();
  const offset = pal.c('sky', 3) * 3;
  const colors = ['dawn', 'day', 'dusk'].map((m) =>
    paletteFor(pal, m as 'dawn' | 'day' | 'dusk', 'graph')
      .pal.slice(offset, offset + 3)
      .join(','),
  );
  expect(new Set(colors).size).toBe(3);
});
it('marks the walkable edge across the fork handle and neck', () => {
  const { book, pal } = buildLevels();
  for (const name of ['forkEnd', 'forkShaft']) expect([...book.pics.get(name)!.px.slice(0, 20)]).toEqual(Array(20).fill(pal.c('stone', 2)));
});
