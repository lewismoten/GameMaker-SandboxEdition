// Badge images stay native-sized and distinct; hidden or missing art is never substituted with an emoji.
import { describe, expect, it } from 'vitest';
import { badgeSource } from './badgeArt';
import { achievementById } from './catalog';
import data from './blockArt.json';

describe('achievement block art', () => {
  it('uses distinct native 20x20 PNG blocks with source provenance', () => {
    const images = new Set<string>();
    for (const [id, art] of Object.entries(data.badges)) {
      expect(achievementById(id)).toBeDefined();
      expect(art.game).toBeTruthy();
      expect(art.block).toBeTruthy();
      const png = Buffer.from(art.image.split(',')[1], 'base64');
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([20, 20]);
      images.add(art.image);
    }
    expect(images.size).toBe(Object.keys(data.badges).length);
  });

  it('masks hidden art and gives unassigned badges a neutral question block', () => {
    const known = achievementById('heart-first')!;
    const missing = { ...known, id: 'without-art' };
    const hidden = { ...known, hidden: true };
    expect(badgeSource(hidden, false)).toBe(badgeSource(missing, true));
    expect(badgeSource(hidden, true)).toBe(badgeSource(known, false));
    expect(badgeSource(hidden, false)).not.toBe(badgeSource(hidden, true));
    expect(badgeSource(missing, true)).toMatch(/^data:image\/svg\+xml,/);
  });
});
