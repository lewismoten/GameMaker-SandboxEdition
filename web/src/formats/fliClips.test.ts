// games/kit/fliClips.ts: a long FLI cut into clips plays the same frames, in the same
// colors, as the whole one did when the clips play one after another as a slide list does.
import { describe, expect, it } from 'vitest';
import { clipEntries, clipLists, fliClips, fliSeconds } from '../../../games/kit/fliClips';
import { applyFliFrame, encodeFli, newFliCanvas, parseFli } from './fli';
import { fliFaults } from './fliLimits';
import { parseSlideList, serializeSlideList } from './graphicScripts';

/** What the screen shows after every frame, playing each FLI over the last (as playFli does). */
function play(flis: Uint8Array[]): { px: Uint8Array; pal: Uint8Array }[] {
  const out: { px: Uint8Array; pal: Uint8Array }[] = [];
  let px: Uint8Array = new Uint8Array(320 * 200);
  let pal: Uint8Array = new Uint8Array(768);
  for (const fli of flis) {
    const a = parseFli(fli);
    const c = newFliCanvas(a);
    c.pixels.set(px);
    c.palette.set(pal);
    for (let f = 0; f < a.frameCount; f++) {
      applyFliFrame(a, f, c);
      out.push({ px: Uint8Array.from(c.pixels), pal: Uint8Array.from(c.palette) });
    }
    px = c.pixels;
    pal = c.palette;
  }
  return out;
}

/** A 10-second cartoon: a fade in, a moving bar over noise (frames too big for one chunk), a fade out. */
function cartoon(): Uint8Array {
  const pal = new Uint8Array(768).map((_, i) => (i * 7) % 64);
  const bg = new Uint8Array(320 * 200).map((_, i) => (i * 2654435761) >>> 27);
  const frames: Uint8Array[] = [new Uint8Array(320 * 200)];
  const palettes: Uint8Array[] = [new Uint8Array(768)];
  for (let f = 0; f < 140; f++) {
    const px = Uint8Array.from(bg);
    for (let y = 0; y < 200; y++) for (let x = f * 2; x < f * 2 + 10 && x < 320; x++) px[y * 320 + x] = 200;
    const light = f < 10 ? (f + 1) / 10 : f >= 130 ? (139 - f) / 10 : 1;
    frames.push(px);
    palettes.push(pal.map((v) => Math.round(v * light)));
  }
  return encodeFli(frames, pal, { speed: 5, palettes, runs: true });
}

describe('fliClips', () => {
  it('cuts a long FLI into clips of 4 seconds or less that play exactly as the whole one', () => {
    const whole = cartoon();
    expect(fliSeconds(whole)).toBeGreaterThan(10);
    const clips = fliClips('intro.fli', whole);
    const names = Object.keys(clips);
    expect(names).toEqual(['intro.fli', 'intro2.fli', 'intro3.fli']);
    for (const c of Object.values(clips)) {
      expect(fliSeconds(c)).toBeLessThanOrEqual(4);
      expect(fliFaults(c)).toEqual([]);
    }
    const a = play([whole]);
    const b = play(Object.values(clips));
    expect(b.length).toBe(a.length);
    const differ = b.filter((s, i) => !Buffer.from(s.pal).equals(a[i].pal) || !Buffer.from(s.px).equals(a[i].px));
    expect(differ.length).toBe(0);
  });

  it('cuts where the palette holds, never inside a fade', () => {
    const clips = Object.values(fliClips('intro.fli', cartoon()));
    let at = 0;
    const shown = play(clips);
    for (const c of clips.slice(0, -1)) {
      at += parseFli(c).frameCount;
      expect(Buffer.from(shown[at].pal).equals(shown[at - 1].pal)).toBe(true);
    }
  });

  it('leaves a short FLI whole and pauses only after the last clip', () => {
    const short = encodeFli([new Uint8Array(64000), new Uint8Array(64000)], new Uint8Array(768), { speed: 6 });
    expect(Object.keys(fliClips('logo.fli', short))).toEqual(['logo.fli']);
    expect(clipEntries(fliClips('birthday.fli', cartoon()), 2)).toEqual([
      { name: 'birthday.fli', pause: 0 },
      { name: 'birthda2.fli', pause: 0 },
      { name: 'birthda3.fli', pause: 2 },
    ]);
  });

  it('cuts the long FLIs a disk’s lists play, in every list that plays them', () => {
    const short = encodeFli([new Uint8Array(64000)], new Uint8Array(768), { speed: 6 });
    const files = new Map<string, Uint8Array>([
      ['intro.fli', cartoon()],
      ['logo.fli', short],
      [
        'title.lst',
        serializeSlideList([
          { name: 'logo.fli', pause: 0 },
          { name: 'INTRO.FLI', pause: 0 },
          { name: 'title.gif', pause: 10 },
        ]),
      ],
      ['won.lst', serializeSlideList([{ name: 'intro.fli', pause: 4 }, { name: 'won.txt' }])],
    ]);
    clipLists(files, ['title.lst']);
    const names = (l: string) => parseSlideList(files.get(l)!).map((e) => `${e.name} ${e.pause}`);
    expect(names('title.lst')).toEqual(['logo.fli 0', 'intro.fli 0', 'intro2.fli 0', 'intro3.fli 0', 'title.gif 10']);
    expect(names('won.lst')).toEqual(['intro.fli 0', 'intro2.fli 0', 'intro3.fli 4', 'won.txt undefined']);
    expect(files.get('logo.fli')).toBe(short);
  });
});
