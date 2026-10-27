// The editor tab's GameContext: shared tools change the open project through it, each change
// can be taken back, and the open file's editor is opened again to show it.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { testGame } from '../../editor/check/testGame';
import { parseMap } from '../../formats/map';
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import { EditorContext } from './editorContext';
import type { AssistantHost } from '../hostSlot';

function fakeHost() {
  const files = new GameFiles(testGame(['#####', '#S.E#', '#####']).files);
  const extras: Record<string, unknown> = {};
  const opened: string[] = [];
  const project = {
    id: 'p1',
    gam: 'test.gam',
    files,
    readOnly: undefined,
    companion: undefined as unknown,
    setExtras: (file: string, section: string, value: unknown) => (extras[`${file}:${section}`] = value),
  };
  const host = { project, currentFile: 'test.map', playing: false, open: (f: string) => opened.push(f) } as unknown as AssistantHost;
  return { host, files, extras, opened };
}

describe('the editor tab’s context', () => {
  it('applies a change, shows it, and takes it back', async () => {
    const { host, files, opened } = fakeHost();
    const toasts: string[] = [];
    let undo = () => undefined as unknown;
    const ctx = new EditorContext(() => host, { readOnly: () => false, changed: (s, u) => (toasts.push(s), (undo = u)) });
    const set = GAME_TOOL_DEFS.find((d) => d.name === 'set_map')!;
    const before = files.get('test.map');
    await runTool(set, { file: 'test.map', x: 2, y: 1, rows: [[3]] }, ctx);
    expect(parseMap(files.get('test.map')!).blocks[102]).toBe(3);
    expect(toasts).toEqual(['Map test.map: 1 cells, 0 monsters placed']);
    expect(opened).toEqual(['test.map']);
    undo();
    expect(files.get('test.map')).toBe(before);
    await runTool(
      GAME_TOOL_DEFS.find((d) => d.name === 'set_text')!,
      { file: 'new.txt', text: 'Hi' },
      ctx,
    );
    expect(files.has('new.txt')).toBe(true);
    expect(ctx.undo()).toBe(true);
    expect(files.has('new.txt')).toBe(false);
    expect(ctx.undo()).toBe(false);
  });

  it('keeps DOS player patches in the companion, and refuses writes while read-only', async () => {
    const { host, extras } = fakeHost();
    let readOnly = false;
    const ctx = new EditorContext(() => host, { readOnly: () => readOnly, changed: () => undefined });
    const patch = GAME_TOOL_DEFS.find((d) => d.name === 'set_player_patches')!;
    await runTool(patch, { patches: [{ id: 'str.menu.play', text: 'Go' }] }, ctx);
    expect(extras['test.gam:dosPlayer']).toMatchObject({ patches: { 'str.menu.play': 'Go' } });
    readOnly = true;
    expect((await runTool(patch, { patches: [{ id: 'str.menu.play', reset: true }] }, ctx)).isError).toBe(true);
  });

  it('says so when no game is open', async () => {
    const ctx = new EditorContext(() => undefined, { readOnly: () => false, changed: () => undefined });
    expect(ctx.readOnly).toBe(true);
    const r = await runTool(
      GAME_TOOL_DEFS.find((d) => d.name === 'game_summary')!,
      {},
      ctx,
    );
    expect(r.isError).toBe(true);
  });
});
