// Game-wide control descriptions and counter names: reading, storing, and moving the older per-character names.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { Project } from './project';
import { gameControls, migrateCounterNames, readControls, setGameControls } from './gameControls';
import { COUNTER_NAMES } from '../editors/character/counterNames';

function project(): Project {
  const files = new GameFiles();
  files.set('a.chr', new Uint8Array(4));
  files.set('b.chr', new Uint8Array(4));
  return new Project('t', 'T', 'g.gam', files);
}

describe('game controls', () => {
  it('keeps clean values and drops the rest', () => {
    const c = readControls({
      keys: { '57': { short: ' Jump ', long: 'x' }, '0': { short: 'no' }, abc: { short: 'no' } },
      joystick: { 1: { short: 'Fire', long: '' } },
      counters: { 4: 'no', 20: ' Gold ' },
    });
    expect(c.keys).toEqual({ '57': { short: 'Jump', long: 'x' } });
    expect(c.joystick[1]?.short).toBe('Fire');
    expect(c.counters).toEqual({ '20': 'Gold' });
  });

  it('round-trips through the companion and stores nothing when empty', () => {
    const p = project();
    setGameControls(p, { keys: { '57': { short: 'Jump', long: '' } }, joystick: { 2: { short: 'Bomb', long: '' } }, counters: { 7: 'Arrows' } });
    expect(gameControls(p)).toEqual({ keys: { '57': { short: 'Jump', long: '' } }, joystick: { 2: { short: 'Bomb', long: '' } }, counters: { '7': 'Arrows' } });
    setGameControls(p, { keys: {}, joystick: {}, counters: {} });
    expect(gameControls(p)).toEqual({ keys: {}, joystick: {}, counters: {} });
    expect(p.extras('g.gam', 'controls', null)).toBeNull();
  });

  it('moves per-character counter names: first wins, game-wide kept, old entries removed', () => {
    const p = project();
    p.setExtras('a.chr', COUNTER_NAMES, { 20: 'Keys', 21: 'Ammo' });
    p.setExtras('b.chr', COUNTER_NAMES, { 20: 'Gems', 22: 'Coins' });
    p.setExtras('g.gam', 'controls', { counters: { 22: 'Kept' } });
    expect(migrateCounterNames(p)).toBe(true);
    expect(gameControls(p).counters).toEqual({ '20': 'Keys', '21': 'Ammo', '22': 'Kept' });
    expect(p.extras('a.chr', COUNTER_NAMES, null)).toBeNull();
    expect(p.extras('b.chr', COUNTER_NAMES, null)).toBeNull();
    expect(migrateCounterNames(p)).toBe(false);
  });
});
