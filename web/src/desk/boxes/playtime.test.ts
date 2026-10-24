import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hoursLine, playHours } from './boxFacts';
import { claimedHours, playMinutes, PLAY_SCALE, type Timeline } from './playtime';

const gamesDir = join(__dirname, '../../../../games');
const read = (id: string, file: string) => JSON.parse(readFileSync(join(gamesDir, id, file), 'utf8'));

/** Every game with a box and a walkthrough: its claim and its walkthrough's play minutes. */
const games = readdirSync(gamesDir)
  .filter((id) => existsSync(join(gamesDir, id, 'about.json')) && existsSync(join(gamesDir, id, 'walkthrough.json')))
  .map((id) => ({
    id,
    box: read(id, 'about.json').box as { hours?: number } | undefined,
    minutes: playMinutes(read(id, 'walkthrough.json').timeline as Timeline),
  }))
  .filter((g) => g.box);

describe('hours of gameplay', () => {
  it('counts only the level chapters of a walkthrough', () => {
    const t = {
      fps: 60,
      frames: 60 * 60 * 10,
      chapters: [
        { title: 'Opening', frame: 0 },
        { title: 'Story', frame: 3600 },
        { title: 'Level 1', frame: 7200 },
        { title: 'Level 2', frame: 10800 },
        { title: 'Ending', frame: 18000 },
        { title: 'Credits', frame: 32400 },
      ],
    };
    expect(playMinutes(t)).toBe(3);
    expect(claimedHours(0.1)).toBe(1);
    expect(claimedHours(12)).toBe(5);
  });

  it('has every box claim what its walkthrough says (rerun games/kit/playtime.ts)', () => {
    expect(games.length).toBeGreaterThan(5);
    for (const g of games) {
      expect(g.box!.hours, g.id).toBe(claimedHours(g.minutes));
      // the cover draws the box's own figure
      expect(playHours(1, g.box!.hours), g.id).toBe(g.box!.hours);
      if (g.box!.hours! > 1) expect(hoursLine(playHours(1, g.box!.hours))).toBe(`Over ${g.box!.hours} hours of gameplay!`);
    }
  });

  it('keeps the claims in proportion to play time, within rounding', () => {
    for (const g of games) {
      const exact = (g.minutes * PLAY_SCALE) / 60;
      if (exact >= 1) expect(Math.abs(g.box!.hours! - exact), g.id).toBeLessThanOrEqual(0.5);
    }
    for (const a of games)
      for (const b of games) {
        if (a.minutes <= b.minutes) expect(a.box!.hours!, `${a.id} vs ${b.id}`).toBeLessThanOrEqual(b.box!.hours!);
      }
  });
});
