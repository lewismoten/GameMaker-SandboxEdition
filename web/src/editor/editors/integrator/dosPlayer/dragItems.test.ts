import { describe, expect, it } from 'vitest';
import { playerLook } from '../../../../engine/playerLook';
import { patchEntry, patchProblem, type PatchValue, type PlayerPatches } from '../../../../dosPlayer/patchRules';
import { describeItem, dragBy, grab, hitItem, itemFor, screenItems, toScreen } from './dragItems';

const drawn = { title: 'My Game', heading: true };
const valueOf =
  (patches: PlayerPatches) =>
  (id: string): PatchValue =>
    patches[id] ?? patchEntry(id)!.stock;
const item = (which: Parameters<typeof screenItems>[0], key: string, patches: PlayerPatches = {}) =>
  screenItems(which, playerLook(patches), drawn).find((i) => i.key === key)!;

describe('canvas pixels to the player screen', () => {
  it('scales a canvas of any size to 320 x 200', () => {
    expect(toScreen(0, 0, 640, 400)).toEqual([0, 0]);
    expect(toScreen(208, 1, 640, 400)).toEqual([104, 0]);
    expect(toScreen(420 / 2, 262.5 / 2, 420, 262.5)).toEqual([160, 100]);
  });

  it('clamps points off the canvas to its edges', () => {
    expect(toScreen(-5, -9, 320, 200)).toEqual([0, 0]);
    expect(toScreen(640, 400, 320, 200)).toEqual([319, 199]);
    expect(toScreen(319.9, 199.9, 320, 200)).toEqual([319, 199]);
  });
});

describe('what a press takes hold of', () => {
  it('finds the words under the pointer', () => {
    const items = screenItems('hiscores', playerLook(), drawn);
    // "Top Ten Scores" at 104, 0
    expect(hitItem(items, 110, 4)?.item.key).toBe('hiscore.title');
    expect(hitItem(items, 300, 100)).toBeUndefined();
  });

  it('takes a frame by its line, nearest first, and resizes it by a corner', () => {
    const items = screenItems('status', playerLook(), drawn);
    expect(hitItem(items, 160, 10)).toMatchObject({ item: { key: 'border.invent.outer' }, grip: 'move' });
    expect(hitItem(items, 160, 16)).toMatchObject({ item: { key: 'border.invent.inner' }, grip: 'move' });
    expect(hitItem(items, 309, 189)).toMatchObject({ item: { key: 'border.invent.outer' }, grip: 'br' });
    expect(hitItem(items, 160, 100)).toBeUndefined();
  });

  it('skips the load and save headings when their own picture covers them', () => {
    expect(screenItems('save', playerLook(), { ...drawn, heading: false })).toEqual([]);
    expect(screenItems('save', playerLook(), drawn).map((i) => i.key)).toEqual(['save.title']);
  });
});

describe('a drag sets x and y within each patch’s range', () => {
  it('moves a heading by the drag', () => {
    const held = grab(item('hiscores', 'hiscore.title'), 'move', valueOf({}));
    expect(dragBy(held, -4, 6)).toEqual([
      ['layout.hiscore.title.x', 100],
      ['layout.hiscore.title.y', 6],
    ]);
  });

  it('clamps to the entry’s range', () => {
    const held = grab(item('hiscores', 'hiscore.title'), 'move', valueOf({}));
    // x is a push imm8: 0-127
    expect(dragBy(held, 500, -50)).toEqual([
      ['layout.hiscore.title.x', 127],
      ['layout.hiscore.title.y', 0],
    ]);
  });

  it('moves only y where the player fixes x', () => {
    const rows = item('hiscores', 'hiscore.rows');
    expect(dragBy(grab(rows, 'move', valueOf({})), 30, 3)).toEqual([['layout.hiscore.firstRowY', 30]]);
  });

  it('moves the menu words and marker together, stopping when any one reaches its end', () => {
    const patches: PlayerPatches = { 'layout.menu.credits.x': 90 };
    const block = item('menu', 'menu.block', patches);
    const out = new Map(dragBy(grab(block, 'move', valueOf(patches)), 100, 2));
    // the credits line is 10 further right, so it stops everything at 127
    expect(out.get('layout.menu.credits.x')).toBe(127);
    expect(out.get('layout.menu.play.x')).toBe(117);
    expect(out.get('layout.menu.markerX')).toBe(107);
    expect(out.get('layout.menu.play.y')).toBe(122);
    expect(out.get('layout.menu.firstY')).toBe(123);
    for (const [id, v] of out) expect(patchProblem(patchEntry(id)!, v)).toBeUndefined();
  });

  it('moves a frame whole, inside the screen', () => {
    const held = grab(item('drop', 'border.drop.outer'), 'move', valueOf({}));
    expect(dragBy(held, -20, 3)).toEqual([['border.drop.outer', [0, 13, 300, 193]]]);
    expect(dragBy(held, 50, 50)).toEqual([['border.drop.outer', [19, 19, 319, 199]]]);
  });

  it('resizes a frame by a corner, keeping its sides apart', () => {
    const held = grab(item('about', 'border.about.inner'), 'br', valueOf({}));
    expect(dragBy(held, -100, -20)).toEqual([['border.about.inner', [15, 15, 205, 165]]]);
    expect(dragBy(held, -400, -400)).toEqual([['border.about.inner', [15, 15, 19, 19]]]);
    const tl = grab(item('about', 'border.about.inner'), 'tl', valueOf({}));
    expect(dragBy(tl, 5, -30)).toEqual([['border.about.inner', [20, 0, 305, 185]]]);
  });

  it('finds the item a field moves, and says where it is', () => {
    const items = screenItems('menu', playerLook(), drawn);
    expect(itemFor(items, 'layout.menu.quit.y')?.key).toBe('menu.block');
    expect(itemFor(items, 'layout.menu.titleX')?.key).toBe('menu.title');
    expect(describeItem(item('hiscores', 'hiscore.title'))).toBe('Heading: x 104, y 0');
    expect(describeItem(item('hiscores', 'hiscore.rows'))).toBe('Score rows: y 27');
    expect(describeItem(item('status', 'border.invent.outer'))).toBe('Outer frame: 10, 10 to 310, 190');
  });
});
