// Read-only Unicode boundaries: assistant text, scene reports and search; DOS remains raw.
import { expect, it } from 'vitest';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GameFiles } from '../src/project/files';
import { SCREEN_TOOLS } from '../src/assistant/tools/screenTools';
import { GAME_TOOLS } from '../src/assistant/tools/gameTools';
import type { GameContext, ToolResult } from '../src/assistant/tools/types';
import { scenesOf } from '../src/editor/check/sceneData';
import { fileEntries } from '../src/editor/shell/searchIndex';
import { extractDeep } from '../src/editor/shell/deepExtract';
import { summarizeChange } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { regionsOf } from '../src/manual/printables/worldMapRegions';
import { graphOf } from '../src/editor/editors/integrator/layoutCells';
import { sceneRefs } from '../src/manual/printables/worldMapGroups';
const result = (r: ToolResult) => JSON.parse((r.content[0] as { text: string }).text);

it('shows changed DOS descriptions as Unicode in disk reports', () => {
  const game = newGame();
  game.scenes[0].desc = '\xb3 JET DRIVER \xb3';
  const before = serializeGame(game);
  game.scenes[0].desc = 'Caf\x82';
  expect(summarizeChange('jet.gam', before, serializeGame(game)).summary.join('\n')).toContain('description "│ JET DRIVER │" -> "Café"');
});

it('decodes DOS scene names and text exactly once without trimming description frames', async () => {
  const game = newGame();
  game.scenes[0].desc = '\xb3 JET DRIVER \xb3';
  const scene = emptyScene(ADVTYPE);
  scene.desc = '\xb3 Caf\x82 \xb3';
  scene.files[1] = 'test.map';
  game.scenes.push(scene);
  expect(sceneRefs(game, '│ Café │')).toEqual([2]);
  expect(regionsOf(game, graphOf(game), { regions: [[2]] }, () => '│ Café ³ │')[0].name).toBe('│ Café ³ │');
  const files = new GameFiles([
    ['jet.gam', serializeGame(game)],
    ['story.txt', Uint8Array.of(0xb3, 0x82, 0x81, 0xab, 0xb3, 13, 10, 26)],
  ]);
  const ctx: GameContext = { files, gam: 'jet.gam', readOnly: true, playerPatches: () => ({}), apply: async () => undefined };
  expect(result(await SCREEN_TOOLS.find((t) => t.name === 'get_text')!.run({ file: 'story.txt' }, ctx))).toEqual({ text: '│éü½│\n', lines: ['│éü½│'] });
  expect(result(await GAME_TOOLS.find((t) => t.name === 'get_scene')!.run({ scene: 2 }, ctx)).name).toBe('│ Café │');
  expect(scenesOf(game, files)[0].name).toBe('│ Café │');
  const entries = await fileEntries({ files }, { stale: false });
  expect(entries.find((e) => e.id === 't:story.txt')?.parts[0].text).toBe('│éü½│');
  const extras = [{ label: 'Custom', text: '│ Café 日本語 ³ │' }];
  const deep = await extractDeep({ files: [...files.entries(), ['readme.nfo', Uint8Array.of(0x82, 0x81, 0xab)]], names: files.names(), extras });
  expect(deep.some((p) => p.text === 'éü½')).toBe(true);
  expect(deep.some((p) => p.text === extras[0].text)).toBe(true);
});

it('encodes Unicode tool edits back to DOS instead of truncating their Unicode code points', async () => {
  const files = new GameFiles([['jet.gam', serializeGame(newGame())]]);
  const ctx: GameContext = {
    files,
    gam: 'jet.gam',
    readOnly: false,
    playerPatches: () => ({}),
    apply: async (change) => {
      for (const [name, bytes] of Object.entries(change.files ?? {})) if (bytes) files.set(name, bytes);
    },
  };
  await SCREEN_TOOLS.find((t) => t.name === 'set_text')!.run({ file: 'story.txt', text: '│éü½│' }, ctx);
  expect([...files.get('story.txt')!]).toEqual([0xb3, 0x82, 0x81, 0xab, 0xb3]);
  await GAME_TOOLS.find((t) => t.name === 'set_scene')!.run({ scene: 0, name: '│ Café │' }, ctx);
  expect(result(await GAME_TOOLS.find((t) => t.name === 'game_summary')!.run({}, ctx)).title).toBe('Café');
});
