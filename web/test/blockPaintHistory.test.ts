// One Undo restores every painted tile and group geometry without rewriting game behavior.
import { describe, expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { BlockPaintHistory } from '../src/editor/editors/blocks/blockPaintHistory';

describe('block painting history', () => {
  it('can commit a live stroke using its original pixels after the thumbnails have updated', () => {
    const blocks = [emptyBlock(0)];
    const history = new BlockPaintHistory(blocks);
    const before = new Map([[0, blocks[0].pixels.slice()]]);
    blocks[0].pixels.fill(6);
    history.record('block', [0], undefined, before);
    before.get(0)!.fill(9);
    history.step('block', true);
    expect(blocks[0].pixels.some(Boolean)).toBe(false);
    history.step('block', false);
    expect(blocks[0].pixels.every((value) => value === 6)).toBe(true);
  });
  it('undoes and redoes a group stroke as one action, leaving behavior fields alone', () => {
    const blocks = [emptyBlock(0), emptyBlock(1), emptyBlock(2)];
    const history = new BlockPaintHistory(blocks);
    history.record('group', [0, 1]);
    blocks[0].pixels.fill(4);
    blocks[1].pixels.fill(8);
    blocks[0].scorePts = 300;
    expect(history.available('group')).toEqual({ undo: true, redo: false });
    history.step('group', true);
    expect(blocks[0].pixels.some(Boolean)).toBe(false);
    expect(blocks[1].pixels.some(Boolean)).toBe(false);
    expect(blocks[0].scorePts).toBe(300);
    history.step('group', false);
    expect(blocks[0].pixels.every((v) => v === 4)).toBe(true);
    expect(blocks[1].pixels.every((v) => v === 8)).toBe(true);
    expect(blocks[2].pixels.some(Boolean)).toBe(false);
  });
  it('keeps independent histories and invalidates an overlapping scope on a later edit', () => {
    const blocks = [emptyBlock(0), emptyBlock(1), emptyBlock(2)];
    const history = new BlockPaintHistory(blocks);
    history.record('single2', [2]);
    blocks[2].pixels[0] = 9;
    history.record('group', [0, 1]);
    blocks[0].pixels[0] = 5;
    history.record('single0', [0]);
    blocks[0].pixels[0] = 6;
    expect(history.available('group')).toEqual({ undo: false, redo: false });
    expect(history.available('single2').undo).toBe(true);
    history.step('single0', true);
    expect(blocks[0].pixels[0]).toBe(5);
    history.step('single2', true);
    expect(blocks[2].pixels[0]).toBe(0);
  });
  it('returns the matching group layout for undo and redo of a rectangular turn', () => {
    const blocks = [emptyBlock(0), emptyBlock(1)];
    const history = new BlockPaintHistory(blocks);
    const before = { name: 'Sign', cols: 2, rows: 1, cells: [0, 1] },
      after = { name: 'Sign', cols: 1, rows: 2, cells: [0, 1] };
    history.record('group', [0, 1], before);
    blocks[0].pixels[19] = 3;
    const undo = history.step('group', true, after);
    expect(undo?.group).toEqual(before);
    expect(blocks[0].pixels[19]).toBe(0);
    const redo = history.step('group', false, before);
    expect(redo?.group).toEqual(after);
    expect(blocks[0].pixels[19]).toBe(3);
    expect(before.cols).toBe(2);
  });
});
