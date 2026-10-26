// The BBSes' pictures: who uploaded them where, their 8.3 names and sizes, and their FILE_ID.DIZ.
import { describe, expect, it } from 'vitest';
import { DIZ_LINES, DIZ_WIDTH, pictureDiz } from './fileId';
import { GALLERY, SOFA_GIFS } from './gallery';

describe("The Sofa's GIF area", () => {
  it("has Doc Leo's uploads (the Bard logo and the hobo clown), 8.3 names, a plausible size for a modem", () => {
    expect(SOFA_GIFS.map((f) => f.name)).toEqual([
      'BARDLOGO.GIF',
      'LEOCHICK.GIF',
      'NEWNOSE.GIF',
      'LEOWALK.GIF',
      'LEONOSE.GIF',
      'HOBO1.GIF',
      'HOBO2.GIF',
      'HOBO3.JPG',
    ]);
    for (const f of SOFA_GIFS) {
      expect(f.name).toMatch(/^[A-Z0-9]{1,8}\.(GIF|JPG)$/);
      expect(f.bytes).toBeGreaterThan(5_000);
      expect(f.bytes).toBeLessThan(150_000);
      expect(f.desc).not.toBe('');
    }
    expect(GALLERY.some((f) => f.board)).toBe(false);
  });

  it('keeps every picture of THE CHEZ on the Sandbox BBS, and the clown on The Sofa', () => {
    expect(SOFA_GIFS.some((f) => /CHEZ/.test(f.name))).toBe(false);
    expect(GALLERY.filter((f) => /CHEZ/.test(f.name)).length).toBe(7);
    expect(GALLERY.some((f) => /^(HOBO|LEO)/.test(f.name))).toBe(false);
  });

  it('writes a FILE_ID.DIZ within the limits, crediting the logo to DeepAI', () => {
    for (const f of SOFA_GIFS) {
      const diz = pictureDiz(f);
      expect(diz.length).toBeLessThanOrEqual(DIZ_LINES);
      for (const l of diz) expect(l.length).toBeLessThanOrEqual(DIZ_WIDTH);
      expect(diz.at(-1)).toBe('Uploaded by DOC LEO to THE SOFA BBS');
    }
    expect(pictureDiz(SOFA_GIFS[0]).join(' ')).toContain('DeepAI');
    expect(pictureDiz(SOFA_GIFS.find((f) => f.format === 'JPEG')!).join(' ')).not.toContain('interlaced');
  });
});
