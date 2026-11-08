import { describe, expect, it } from 'vitest';
import { feelieList, sizeText, stillThumb } from './feelies';
import { kitOf } from './laserKits';
import type { TrinketItem } from './trinketData';

const item = { id: 'sparky', title: 'Sparky 3000' } as TrinketItem;
const nickel = kitOf({ key: 'laser-nickel', mm: { coin: 38.1, wood: 3 } }, './laser/year2000/')!;
const box = kitOf(
  {
    id: 'stage-box',
    material: { thickness: 3 },
    sheets: [{ preview: 's1.png', w: 480, h: 236, parts: [{ name: 'P', x: 6, y: 6, w: 126, h: 120 }] }],
    kit: { title: 'Stage Box', summary: 'A box.', previews: [{ file: 's1.png', alt: 'one' }], downloads: [] },
  },
  './laser/sleuth/stage-box/',
)!;

describe('feelieList', () => {
  it('lists trinkets, then laser kits, then the phone, each with a name', () => {
    const list = feelieList('./trinkets/year2000/', [item], true, [nickel, box]);
    expect(list.map((f) => f.kind)).toEqual(['trinket', 'nickel', 'box', 'phone']);
    expect(list.every((f) => f.title.length > 0)).toBe(true);
    expect(new Set(list.map((f) => f.key)).size).toBe(4);
  });
  it('is empty for a game with nothing (a secret game has no files)', () => {
    expect(feelieList('./trinkets/x/', [], false, [])).toEqual([]);
  });
  it('knows the nickel’s picture and the box’s thickness and parts', () => {
    const [n, b] = feelieList('./t/', [], false, [nickel, box]);
    expect(stillThumb(n)).toBe('./laser/year2000/front.png');
    expect(stillThumb(b)).toBeUndefined();
    expect(box.thickness).toBe(3);
    expect(box.sheets?.[0].parts[0].name).toBe('P');
    expect(nickel.coin).toBe(38.1);
  });
});

describe('sizeText', () => {
  it('says KB under a megabyte and MB over', () => {
    expect(sizeText(2400)).toBe('2 KB');
    expect(sizeText(1_094_388)).toBe('1.1 MB');
  });
});
