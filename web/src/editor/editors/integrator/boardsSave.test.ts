// Board arrangements are editor-only: they autosave into the project's companion (never the
// .gam) and come back the same through readBoards.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../project/storage', () => ({
  saveProject: vi.fn(() => Promise.resolve()),
  newId: () => 'new-id',
  loadSaveData: () => Promise.resolve({}),
  writeSaveFile: () => Promise.resolve(),
}));

import { saveProject } from '../../../project/storage';
import { GameFiles } from '../../../project/files';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { Project } from '../../core/project';
import { BOARDS_SECTION, addBoard, emptyBoards, placeScene, readBoards } from './boardLayout';

describe('saving boards', () => {
  it('autosaves the arrangement in the companion and leaves the game file alone', async () => {
    vi.useFakeTimers();
    vi.mocked(saveProject).mockClear();
    const gam = serializeGame(newGame('Boards'));
    const p = Project.fromFiles(new GameFiles([['game.gam', gam]]), 'Boards', 'boards');
    const data = emptyBoards();
    const id = addBoard(data, 'Act One');
    placeScene(data, 3, id, { x: 40, y: 8 });
    p.setExtras('game.gam', BOARDS_SECTION, JSON.parse(JSON.stringify(data)));
    await vi.runAllTimersAsync();
    expect(saveProject).toHaveBeenCalledTimes(1);
    const saved = vi.mocked(saveProject).mock.calls[0];
    expect(saved[4]?.files['game.gam']?.[BOARDS_SECTION]).toBeDefined();
    expect(saved[3].get('game.gam')).toEqual(gam);
    expect(readBoards(p.extras('game.gam', BOARDS_SECTION, undefined)).place[3]).toEqual({ board: id, x: 40, y: 8 });
    vi.useRealTimers();
  });
});
