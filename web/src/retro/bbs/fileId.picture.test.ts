import { describe, expect, it } from 'vitest';
import { DIZ_LINES, DIZ_WIDTH, pictureDiz } from './fileId';
import { GALLERY, SOFA_GIFS } from './gallery';

describe("The Sofa's GIF area", () => {
  it('has THE CHEZ and the Bard logo, 8.3 names, 640x480, a plausible size for a modem', () => {
    expect(SOFA_GIFS.map((f) => f.name)).toEqual(['THECHEZ1.GIF', 'THECHEZ2.GIF', 'THECHEZ3.GIF', 'BARDLOGO.GIF']);
    for (const f of SOFA_GIFS) {
      expect(f.name).toMatch(/^[A-Z0-9]{1,8}\.GIF$/);
      expect([f.width, f.height]).toEqual([640, 480]);
      expect(f.bytes).toBeGreaterThan(30_000);
      expect(f.bytes).toBeLessThan(150_000);
      expect(f.desc).not.toBe('');
    }
    expect(GALLERY.some((f) => f.board)).toBe(false);
  });

  it('writes a FILE_ID.DIZ within the limits, crediting the logo to DeepAI', () => {
    for (const f of SOFA_GIFS) {
      const diz = pictureDiz(f);
      expect(diz.length).toBeLessThanOrEqual(DIZ_LINES);
      for (const l of diz) expect(l.length).toBeLessThanOrEqual(DIZ_WIDTH);
      expect(diz.at(-1)).toBe('Uploaded by DOC LEO to THE SOFA BBS');
    }
    expect(pictureDiz(SOFA_GIFS[0]).join(' ')).toContain('THE CHEZ - 1976 1/2 CitiCar, tomato red, electric');
    expect(pictureDiz(SOFA_GIFS[3]).join(' ')).toContain('DeepAI');
  });
});
