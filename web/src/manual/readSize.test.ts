// readSize.ts: a page's width at each size, the zoom steps, and the size a browser keeps.
import { describe, expect, it } from 'vitest';
import { clampPercent, percentOf, sizeFrom, stepFrom, widthAt, type Room } from './readSize';

// a booklet page (5.5 x 8.5 inches) on a phone and on a desktop stage
const PAGE = { natural: 528, ratio: 8.5 / 5.5, most: 860 };
const phone: Room = { viewW: 366, viewH: 560, ...PAGE };
const desk: Room = { viewW: 1186, viewH: 800, ...PAGE };

describe('widthAt', () => {
  it('fits the width, up to a reading width', () => {
    expect(widthAt('width', phone)).toBe(366);
    expect(widthAt('width', desk)).toBe(860);
  });

  it('fits a whole page in the height, and never wider than the view', () => {
    expect(widthAt('page', desk)).toBe(Math.round(800 / PAGE.ratio));
    expect(widthAt('page', { ...phone, viewH: 5000 })).toBe(366);
  });

  it('shows a percent of the printed size, wider than the view if asked', () => {
    expect(widthAt(100, phone)).toBe(528);
    expect(widthAt(50, desk)).toBe(264);
    expect(widthAt(300, phone)).toBe(1584);
  });
});

describe('zoom steps', () => {
  it('step to the next size in or out from any percent', () => {
    expect(stepFrom(100, 1)).toBe(110);
    expect(stepFrom(100, -1)).toBe(90);
    expect(stepFrom(69, 1)).toBe(75);
    expect(stepFrom(69, -1)).toBe(67);
  });

  it('stop at 10% and 300%', () => {
    expect(stepFrom(300, 1)).toBe(300);
    expect(stepFrom(10, -1)).toBe(10);
    expect(clampPercent(512)).toBe(300);
    expect(clampPercent(3)).toBe(10);
  });

  it('read the percent a width is', () => {
    expect(percentOf(366, 528)).toBe(69);
    expect(percentOf(528, 528)).toBe(100);
  });
});

describe('sizeFrom', () => {
  it('reads a kept size, and nothing else', () => {
    expect(sizeFrom('width')).toBe('width');
    expect(sizeFrom('page')).toBe('page');
    expect(sizeFrom('125')).toBe(125);
    expect(sizeFrom('9000')).toBeUndefined();
    expect(sizeFrom('huge')).toBeUndefined();
    expect(sizeFrom(null)).toBeUndefined();
  });
});
