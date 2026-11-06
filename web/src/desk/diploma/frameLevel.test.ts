// The framed certificate on the desk's wall: hidden before any graduation, the level and metal for how many
// honors are earned, the diploma's ribbon, and a drawing for every look.
import { describe, expect, it } from 'vitest';
import { CEREMONIES, DIPLOMA } from '../../project/ceremonies';
import { frameLook } from './frameLevel';
import { diplomaSvg } from './diplomaArt';

const honors = (n: number, diploma = false) => new Set([...CEREMONIES.slice(0, n).map((c) => c.id), ...(diploma ? [DIPLOMA.id] : []), 'snowbound']);

describe('the desk diploma frame', () => {
  it('shows nothing before a graduation is finished, even with Starters done', () => {
    expect(frameLook(new Set(['snowbound', 'starter-basics']))).toBeUndefined();
  });

  it('hangs after the first graduation (Graduation: First Steps)', () => {
    const look = frameLook(new Set(['graduation-basics']))!;
    expect(look).toMatchObject({ level: 'Beginner', metal: 'bronze', ribbon: false, honors: 1 });
    expect(look.name).toBe('Framed certificate: Beginner. Open your honors');
    expect(look.title).toBe('Beginner: 1 of 6 honors');
  });

  it('follows the highest level earned', () => {
    expect(frameLook(honors(3))).toMatchObject({ level: 'Maker', metal: 'silver' });
    expect(frameLook(honors(5))).toMatchObject({ level: 'Designer', metal: 'gold' });
    expect(frameLook(honors(6))).toMatchObject({ level: 'Master', metal: 'gold', ribbon: false });
    const grad = frameLook(honors(6, true))!;
    expect(grad).toMatchObject({ level: 'Graduate', metal: 'gold', ribbon: true });
    expect(grad.title).toBe('Graduate: The Sandbox Diploma');
  });

  it('draws every look as a whole SVG', () => {
    for (const metal of ['bronze', 'silver', 'gold'] as const)
      for (const ribbon of [false, true]) {
        const svg = diplomaSvg({ metal, ribbon });
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).not.toMatch(/NaN|undefined/);
        expect(svg.includes('#1f5fae')).toBe(ribbon);
      }
  });
});
