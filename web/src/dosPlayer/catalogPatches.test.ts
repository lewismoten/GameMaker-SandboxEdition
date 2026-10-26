import { describe, expect, it } from 'vitest';
import { catalogCompanion, catalogPatches } from './catalogPatches';
import { companionPatches } from './playerRecord';

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
