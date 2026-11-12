import { describe, expect, it } from 'vitest';
import { sizeWords, svgSizeMm } from './svgSize';

describe('svgSize', () => {
  it('reads millimeters and gives inches in brackets', () => {
    expect(sizeWords('<svg xmlns="x" width="450mm" height="232mm" viewBox="0 0 450 232">')).toBe('450 × 232 mm (17.7 × 9.1 in)');
  });
  it('leads with inches when the drawing is in inches', () => {
    expect(sizeWords('<svg width="12in" height="12in">')).toBe('12 × 12 in (305 × 305 mm)');
  });
  it('has no words for pixels or a missing size', () => {
    expect(sizeWords('<svg width="900" height="2062" viewBox="0 0 900 2062">')).toBe('');
    expect(svgSizeMm('not an svg')).toBeUndefined();
  });
});
