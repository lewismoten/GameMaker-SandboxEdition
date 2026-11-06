// Repair only a provable old derived title, not a person's chosen Unicode name.
import { expect, it } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { repairedTitle } from './importedTitle';

it('repairs old decoded/framed titles once and leaves every other field alone', () => {
  const game = newGame();
  game.scenes[0].desc = '\xb3 JET DRIVER \xb3';
  const record = { name: '³ JET DRIVER ³', gam: 'jet.gam', files: { 'jet.gam': serializeGame(game) } };
  expect(repairedTitle(record)).toBe('JET DRIVER');
  expect(repairedTitle({ ...record, name: '│ JET DRIVER │' })).toBe('JET DRIVER');
  expect(repairedTitle({ ...record, name: 'JET DRIVER' })).toBeUndefined();
  for (const name of ['My edition', 'Café 日本語 ³', '│ My own title │']) expect(repairedTitle({ ...record, name })).toBeUndefined();
  expect(repairedTitle({ ...record, files: {} })).toBeUndefined();
  expect(repairedTitle({ ...record, files: { 'jet.gam': new Uint8Array(2) } })).toBeUndefined();
});
