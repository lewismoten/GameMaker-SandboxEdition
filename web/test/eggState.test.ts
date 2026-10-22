// Tests: telling whether a saved game holds a Sandbox game's felt egg (eggs/eggState.ts).
import { describe, expect, it } from 'vitest';
import { saveHolds, savesHold, statusOf } from '../src/eggs/eggState';
import { EGGS } from '../src/eggs/eggs';

const save = (inv: number[], meter: number[] = []) => new TextEncoder().encode(JSON.stringify({ version: 1, world: { ci: { inv, meter } } }));

describe('finding an egg in a save', () => {
  it('sees an inventory block or a counter', () => {
    expect(saveHolds(save([3, 87, 255]), { block: 87 })).toBe(true);
    expect(saveHolds(save([3, 255]), { block: 87 })).toBe(false);
    const m = new Array(30).fill(0);
    m[24] = 2;
    expect(saveHolds(save([], m), { counter: 24 })).toBe(true);
    expect(saveHolds(save([], m), { counter: 24, atLeast: 3 })).toBe(false);
  });
  it('shrugs off damaged saves and only reads game<n>.sav', () => {
    expect(saveHolds(new Uint8Array([1, 2, 3]), { block: 1 })).toBe(false);
    expect(savesHold({ 'game3.sav': save([87]) }, { block: 87 })).toBe(true);
    expect(savesHold({ 'data1.rec': save([87]) }, { block: 87 })).toBe(false);
    expect(savesHold({ 'game3.sav': save([87]) }, undefined)).toBe(false);
  });
  it('lets EGG.EXE add and break eggs', () => {
    expect(statusOf(true, undefined)).toEqual({ status: 'saved', found: true });
    expect(statusOf(false, 'added')).toEqual({ status: 'added', found: true });
    expect(statusOf(true, 'broken')).toEqual({ status: 'broken', found: false });
    expect(statusOf(false, undefined)).toEqual({ status: 'none', found: false });
  });
  it('has one egg for each Sandbox game', () => {
    expect(EGGS.map((e) => e.game)).toEqual(['blaster', 'brief', 'depth', 'logic', 'maximus', 'realm', 'sandcast', 'sleuth', 'snowbound', 'teddy', 'teddy2', 'year2000']);
  });
  it('is a dozen, never naming the thirteenth game', () => {
    expect(EGGS).toHaveLength(12);
    expect(JSON.stringify(EGGS)).not.toMatch(/bakers/i);
  });
});
