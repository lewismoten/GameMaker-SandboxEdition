import { describe, expect, it } from 'vitest';
import { boxClaims, boxDisks, boxReviews, disksLine, hoursLine, planBack, playHours, ratingMark, seeded } from '../src/desk/boxFacts';

describe('box facts', () => {
  it('counts 1.44 MB disks with the DOS player added', () => {
    expect(boxDisks(416_449)).toBe(1);
    expect(boxDisks(1_400_000)).toBe(2); // the player pushes it onto a second disk
    expect(boxDisks(5_283_220)).toBe(4);
    expect(boxDisks(undefined)).toBe(1);
    expect(disksLine(1)).toMatch(/One/);
    expect(disksLine(4)).toMatch(/^4 ×/);
  });

  it('uses the stated hours, or estimates from levels', () => {
    expect(playHours(98, 20)).toBe(20);
    expect(playHours(7)).toBe(5);
    expect(playHours(4)).toBe(3);
    expect(playHours(1)).toBe(1);
    expect(playHours(200)).toBe(50);
    expect(hoursLine(20)).toBe('Over 20 hours of gameplay!');
    expect(hoursLine(1)).toBe('Hours of gameplay!');
  });

  it('only claims what the game has', () => {
    const speaker = boxClaims({ files: ['a.gam', 'a.fli', 'a.rec'], original: { sound: 'speaker' } }, 7);
    expect(speaker.join()).not.toMatch(/Sound Blaster|Digitized/);
    expect(speaker).toContain('PC speaker sound: no sound card needed');
    expect(speaker).toContain('Animated cut-scenes');
    const sb = boxClaims({ files: ['a.gam', 'x.cmf', 'y.cmf', 'z.voc'], original: { sound: 'sb' } }, 4);
    expect(sb).toContain('2 original Sound Blaster FM songs');
    expect(sb).toContain('Digitized sound effects');
    expect(sb.join()).not.toMatch(/cut-scenes|demo/);
  });

  it('reads an age off the rating', () => {
    expect(ratingMark('Ages 8 and up')).toEqual({ mark: '8+', label: 'AGES 8 & UP' });
    expect(ratingMark(undefined).mark).toBe('E');
  });

  it('is stable', () => {
    const a = seeded('x');
    const b = seeded('x');
    expect([a(), a()]).toEqual([b(), b()]);
    expect(boxReviews('maximus', {})).toEqual(boxReviews('maximus', {}));
    expect(boxReviews('m', { reviews: [{ quote: 'q', source: 's' }] })[0].quote).toBe('q');
  });

  it('fits the back by shrinking type, then dropping features, reviews and shots', () => {
    const h = (p: { bodyPx: number; features: number; reviews: number; shots: number }) => p.bodyPx * 20 + p.features * 30 + p.reviews * 40 + p.shots * 200;
    expect(planBack(10_000, 7, 2, h)).toMatchObject({ bodyPx: 19, features: 7, reviews: 2, shots: 1 });
    expect(planBack(19 * 20 + 7 * 30 + 80 + 200 - 1, 7, 2, h).bodyPx).toBe(18);
    const tight = planBack(14 * 20 + 3 * 30 + 0 + 140, 7, 2, h);
    expect(tight).toMatchObject({ features: 3, reviews: 0, shots: 0.7 });
    expect(planBack(14 * 20, 7, 2, h)).toMatchObject({ features: 0, shots: 0 });
  });
});
