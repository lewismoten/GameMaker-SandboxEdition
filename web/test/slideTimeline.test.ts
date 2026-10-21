// Tests: Slide show timing as ShowGraphic plays it (editors/slideShow/slideTimeline.ts).
import { describe, expect, it } from 'vitest';
import {
  clipKind,
  clipTiming,
  clipWidth,
  FADE_SECONDS,
  formatSeconds,
  moveEntry,
  secondsForWidth,
  showLength,
  thenOf,
} from '../src/editor/editors/slideShow/slideTimeline';
import { parseSlideList, serializeSlideList } from '../src/formats/graphicScripts';
import { textBytes } from '../src/formats/binary';

describe('slide show timing', () => {
  it('reads the three ways a slide can end', () => {
    const list = parseSlideList(textBytes('CFADEOUT.FLI  0\r\nBCUDAc.TXT   20\r\nTITLE.GIF\r\n\x1a'));
    expect(list.map(thenOf)).toEqual(['none', 'seconds', 'key']);
    expect(list.map((e) => clipKind(e.name))).toEqual(['fli', 'txt', 'gif']);
    expect(serializeSlideList(list)).toEqual(textBytes('cfadeout.fli 0\r\nbcudac.txt 20\r\ntitle.gif\r\n'));
  });

  it('times pictures, animations, text pages and nested shows', () => {
    const gif = clipTiming({ name: 'a.gif', pause: 5 }, { kind: 'gif', exists: true });
    expect(gif.total).toBeCloseTo(5 + FADE_SECONDS);
    const fli = clipTiming({ name: 'a.fli', pause: 0 }, { kind: 'fli', exists: true, playSeconds: 2 });
    expect(fli).toMatchObject({ then: 'none', total: 2 });
    const txt = clipTiming({ name: 'a.txt', pause: 20 }, { kind: 'txt', exists: true, pages: 3 });
    expect(txt.total).toBe(60);
    const lst = clipTiming({ name: 'b.lst', pause: 9 }, { kind: 'lst', exists: true });
    expect(lst).toMatchObject({ ignored: true, total: 0 });
    const missing = clipTiming({ name: 'x.gif', pause: 9 }, { kind: 'gif', exists: false });
    expect(missing.total).toBe(0);
  });

  it('maps widths to seconds and back', () => {
    const t = clipTiming({ name: 'a.txt', pause: 10 }, { kind: 'txt', exists: true, pages: 2 });
    const w = clipWidth(t, 8, 112);
    expect(w).toBe(160);
    expect(secondsForWidth(w, t, 8)).toBe(10);
    expect(secondsForWidth(1, t, 8)).toBe(1);
    const key = clipTiming({ name: 'a.gif' }, { kind: 'gif', exists: true });
    expect(clipWidth(key, 8, 112)).toBe(112);
  });

  it('moves clips', () => {
    expect(moveEntry(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveEntry(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(moveEntry(['a', 'b', 'c', 'd'], 1, 4)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('describes how long a show takes', () => {
    expect(formatSeconds(65)).toBe('1:05');
    const ts = [
      clipTiming({ name: 'a.gif' }, { kind: 'gif', exists: true }),
      clipTiming({ name: 'b.txt', pause: 30 }, { kind: 'txt', exists: true, pages: 2 }),
    ];
    expect(showLength(ts)).toBe('about 1:01 + 1 key press');
  });
});
