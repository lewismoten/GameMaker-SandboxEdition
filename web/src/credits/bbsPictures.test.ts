// Every picture the BBSes offer has alt text, a credit and a thumbnail on the Credits page.
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PICTURES } from '../retro/bbs/gallery';
import { PICTURE_CREDITS, thumbOf } from './bbsPictureCredits';

const pub = join(import.meta.dirname, '../../public');

describe('credits: pictures on the BBS', () => {
  it('credits every picture, and only those', () => {
    expect(Object.keys(PICTURE_CREDITS).sort()).toEqual(PICTURES.map((f) => f.name).sort());
    for (const f of PICTURES) {
      const c = PICTURE_CREDITS[f.name];
      expect(c.alt.length, f.name).toBeGreaterThan(20);
      expect(c.credit, f.name).toMatch(/^(Photo: (Lewis Moten|Nicky Foster|Todd Jones)|Logo made with DeepAI)/);
      expect(existsSync(join(pub, thumbOf(f.name))), f.name).toBe(true);
    }
  });

  it('names Nicky Foster for the shot of Lewis and Teddy, in both sizes', () => {
    const fosters = Object.entries(PICTURE_CREDITS)
      .filter(([, c]) => c.credit.includes('Nicky Foster'))
      .map(([n]) => n);
    expect(fosters.sort()).toEqual(['CHEZTED.GIF', 'THECHEZ2.GIF']);
    expect(PICTURES.find((f) => f.name === 'CHEZTED.GIF')!.desc).toContain('Nicky Foster');
  });

  it('names Todd Jones for the shot of Lewis beside George Washington', () => {
    expect(PICTURE_CREDITS['COLONIAL.GIF'].credit).toContain('Todd Jones');
    expect(PICTURES.find((f) => f.name === 'COLONIAL.GIF')!.desc).toContain('Todd Jones');
  });
});
