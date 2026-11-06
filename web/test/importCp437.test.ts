// Imported DOS titles cross the binary parser, archive discovery and linked import boundaries.
import { expect, it } from 'vitest';
import { gameTitle, newGame, parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { cString } from '@lewismoten/gamemaker-sandbox-engine/formats/binary';
import { unpackGame as unpackArchive } from '@lewismoten/gamemaker-sandbox-archives';
import { unpackGame } from '../src/linkIn/unpack';
import { Project } from '../src/editor/core/project';

it('decodes parsed CP437 accents as well as the JET DRIVER frame without changing DOS bytes', async () => {
  for (const [raw, title] of [
    ['\xb3 JET DRIVER \xb3', 'JET DRIVER'],
    ['Caf\x82 \x81 \xab', 'Café ü ½'],
    ['Plain game', 'Plain game'],
  ]) {
    const game = newGame();
    game.scenes[0].desc = raw;
    const bytes = serializeGame(game);
    expect(gameTitle(parseGame(bytes))).toBe(title);
    expect(serializeGame(parseGame(bytes))).toEqual(bytes);
    const input: [string, Uint8Array][] = [['jet.gam', bytes]];
    expect((await unpackArchive(input.map(([path, data]) => ({ path, size: data.length, read: async () => data })))).name).toBe(title);
    const linked = await unpackGame(input);
    expect(linked.title).toBe(title);
    expect(Project.fromFiles(linked.files).name).toBe(title);
    expect((await unpackGame(input, { name: '│ Café 日本語 ³ │' })).title).toBe('│ Café 日本語 ³ │');
  }
});

it('decodes the parser’s Latin-1 byte strings and stops C strings at NUL', () => {
  expect(fromCp437(cString(Uint8Array.of(0xb3, 0x82, 0x81, 0xab, 0, 65)))).toBe('│éü½');
});
