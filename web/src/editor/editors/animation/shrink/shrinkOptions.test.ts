import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, describeSaved, describeVisibility, stepsFor } from './shrinkOptions';

describe('stepsFor', () => {
  it('starts lossless: only the sparse palettes step', () => {
    expect(stepsFor(DEFAULT_OPTIONS)).toEqual([{ step: 'sparsePalettes' }]);
  });
  it('ignores lossy settings while lossy is off', () => {
    expect(stepsFor({ ...DEFAULT_OPTIONS, dropFrames: true, maxColors: 16 })).toEqual([{ step: 'sparsePalettes' }]);
  });
  it('orders the lossy steps and skips those left off', () => {
    const o = {
      lossy: true,
      onePalette: false,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
      maxColors: 32,
      dropFrames: true,
      snapTolerance: 8,
      ditherTolerance: 0,
      holdTolerance: 4,
    };
    expect(stepsFor(o).map((s) => s.step)).toEqual(['sparsePalettes', 'holdStill', 'snapColors', 'maxColors', 'dropFrames']);
  });
  it('one palette replaces the color cap and takes its count', () => {
    const o = { ...DEFAULT_OPTIONS, lossy: true, onePalette: true, maxColors: 48 };
    expect(stepsFor(o)).toEqual([{ step: 'sparsePalettes' }, { step: 'onePalette', colors: 48 }]);
    expect(stepsFor({ ...o, maxColors: 0 })[1]).toEqual({ step: 'onePalette', colors: 256 });
  });
  it('frame it comes first among the lossy steps, only when something is set', () => {
    expect(stepsFor({ ...DEFAULT_OPTIONS, lossy: true }).map((s) => s.step)).toEqual(['sparsePalettes']);
    const o = { ...DEFAULT_OPTIONS, lossy: true, top: 8, zoom: 0.9, holdTolerance: 4 };
    expect(stepsFor(o).map((s) => s.step)).toEqual(['sparsePalettes', 'frame', 'holdStill']);
  });
  it('a 256 color cap is no cap', () => {
    expect(stepsFor({ ...DEFAULT_OPTIONS, lossy: true, maxColors: 256 })).toHaveLength(1);
  });
});

describe('describeVisibility', () => {
  it('says identical when nothing differs', () => {
    expect(describeVisibility({ mean: 0, worst: 0, changedShare: 0 }).level).toBe('identical');
  });
  it('grades by mean and worst', () => {
    expect(describeVisibility({ mean: 0.1, worst: 10, changedShare: 0.02 }).level).toBe('hardly');
    expect(describeVisibility({ mean: 1, worst: 60, changedShare: 0.1 }).level).toBe('slight');
    expect(describeVisibility({ mean: 3, worst: 200, changedShare: 0.3 }).level).toBe('noticeable');
    expect(describeVisibility({ mean: 20, worst: 255, changedShare: 0.9 }).level).toBe('obvious');
  });
  it('gives the share of pixels', () => {
    expect(describeVisibility({ mean: 0.1, worst: 10, changedShare: 0.025 }).words).toContain('2.5%');
  });
});

describe('describeSaved', () => {
  it('reports KB and percent', () => {
    expect(describeSaved(10240, 5120)).toBe('Saves 5.0 KB (50%): 10.0 KB to 5.0 KB.');
  });
  it('says when nothing is saved', () => {
    expect(describeSaved(100, 100)).toBe('The same size.');
    expect(describeSaved(100, 150)).toContain('bigger');
  });
});
