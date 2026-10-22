// Tests: The song maker's composer (editor/tools/songMaker.ts).
import { describe, expect, it } from 'vitest';
import { compose } from '../src/editor/tools/songMaker';
import { INSTRUMENTS, song } from '../src/audio/compose';
import { parseCmf } from '../src/formats/cmf';
import { CmfPlayer } from '../src/audio/cmfPlayer';
import { Opl2 } from '../src/audio/opl';

describe('song maker', () => {
  it('composes songs the CMF player plays to the end', () => {
    for (const mood of ['Adventure', 'Spooky', 'Chase', 'Victory'] as const) {
      const t = compose(mood, 2, 8, 12345);
      const bytes = song(120, [
        { channel: 0, instrument: INSTRUMENTS.lead, notes: t.lead },
        { channel: 1, instrument: INSTRUMENTS.pluck, notes: t.chords },
        { channel: 2, instrument: INSTRUMENTS.bass, notes: t.bass },
      ]);
      const cmf = parseCmf(bytes);
      expect(cmf.clockTicks).toBe(146);
      const p = new CmfPlayer(new Opl2(49716));
      p.load(cmf.music, cmf.instruments);
      let ticks = 0;
      // 8 bars at 120 bpm is 16 s: under 3000 ticks at 146 Hz
      while (p.playing && ticks < 4000) {
        p.tick();
        ticks++;
      }
      expect(ticks).toBeGreaterThan(1500);
    }
  });
});
