import { describe, expect, it } from 'vitest';
import { catalogCompanion, catalogPatches } from './catalogPatches';
import { companionPatches } from './playerRecord';
import { controlsFromCompanion, putControls } from '../editor/core/gameControls';
import { emptyCompanion, setSection } from '../project/companion';

const record = { base: 'xferplay-3.00', patches: { 'str.invent.money': 'Sugar:     %d', 'str.hiscore.title': 'Top Ten Flies' } };

describe('catalogPatches', () => {
  it('is empty for a game without a player.json', () => {
    expect(catalogPatches({ id: 'nebula' })).toEqual({});
    expect(catalogPatches(undefined)).toEqual({});
  });

  it('reads the record a player.json holds', () => {
    expect(catalogPatches({ id: 'carl', player: record })).toEqual(record.patches);
  });

  it('drops what breaks the rules, and a record for another player', () => {
    const bad = { base: 'xferplay-3.00', patches: { 'str.invent.money': 'Sugar: no code', 'str.menu.play': 'Play', 'nope.patch': 1 } };
    expect(catalogPatches({ id: 'x', player: bad })).toEqual({});
    expect(catalogPatches({ id: 'x', player: { ...record, base: 'playgame' } })).toEqual({});
  });
});

describe('catalogCompanion', () => {
  it('holds the patches under the .gam, as the editor keeps them', () => {
    const c = catalogCompanion({ id: 'carl', player: record }, 'carl.gam');
    expect(companionPatches(c, 'carl.gam')).toEqual(record.patches);
  });

  it('is undefined when there is nothing to keep', () => {
    expect(catalogCompanion({ id: 'nebula' }, 'nebula.gam')).toBeUndefined();
    expect(catalogCompanion({ id: 'carl', player: record }, null)).toBeUndefined();
  });
});

describe('shipped controls.json', () => {
  const controls = {
    keys: { '57': { short: 'Jump', long: 'Hold to jump higher' } },
    joystick: { '1': { short: 'Fire', long: '' } },
    counters: { '20': 'Gold keys' },
    sounds: { '9': 'Zap' },
  };

  it('reaches the companion as the game-wide controls, with no player.json needed', () => {
    const c = catalogCompanion({ id: 'x', controls }, 'x.gam');
    const got = controlsFromCompanion(c, 'x.gam');
    expect(got.keys['57']?.short).toBe('Jump');
    expect(got.counters[20]).toBe('Gold keys');
    expect(got.sounds['9']).toBe('Zap');
    expect(got.joystick[1]?.short).toBe('Fire');
  });

  it('is undefined for junk, and keeps what the author already saved', () => {
    expect(catalogCompanion({ id: 'x', controls: { keys: 5 } }, 'x.gam')).toBeUndefined();
    const own = emptyCompanion();
    setSection(own, 'x.gam', 'controls', { keys: { '1': { short: 'Mine', long: '' } } });
    putControls(own, 'x.gam', controls);
    expect(controlsFromCompanion(own, 'x.gam').keys['57']).toBeUndefined();
    expect(controlsFromCompanion(own, 'x.gam').keys['1']?.short).toBe('Mine');
  });
});
