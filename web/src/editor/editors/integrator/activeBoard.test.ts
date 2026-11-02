// The Integrator remembers its open board in the companion (editor-only), and the game's
// thumbnail draws that board; a removed board falls back to the first.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../project/storage', () => ({
  saveProject: vi.fn(() => Promise.resolve()),
  newId: () => 'new-id',
  loadSaveData: () => Promise.resolve({}),
  writeSaveFile: () => Promise.resolve(),
}));

import { GameFiles } from '../../../project/files';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { Project } from '../../core/project';
import { BOARDS_SECTION, addBoard, emptyBoards, placeScene } from './boardLayout';
import { ACTIVE_BOARD_SECTION, activeBoardId, activeBoardPositions } from './activeBoard';

function setup() {
  const game = newGame('Boards');
  const p = Project.fromFiles(new GameFiles([['game.gam', serializeGame(game)]]), 'Boards', 'boards');
  const data = emptyBoards();
  data.boards.push({ id: 'all', name: 'All scenes' });
  const act = addBoard(data, 'Act One');
  placeScene(data, 0, act, { x: 40, y: 20 });
  p.setExtras('game.gam', BOARDS_SECTION, JSON.parse(JSON.stringify(data)));
  return { p, data, act, game: p.game() };
}

describe('the remembered board', () => {
  it('is the stored board, and the first when none or a removed one is stored', () => {
    const { data, act } = setup();
    expect(activeBoardId(data, act)).toBe(act);
    expect(activeBoardId(data, undefined)).toBe('all');
    expect(activeBoardId(data, 'gone')).toBe('all');
    expect(activeBoardId({ ...data, boards: [] }, 'x')).toBeUndefined();
  });

  it('is kept in the companion, not the game file', () => {
    const { p, act } = setup();
    p.setExtras('game.gam', ACTIVE_BOARD_SECTION, act);
    expect(p.extras('game.gam', ACTIVE_BOARD_SECTION, undefined)).toBe(act);
    expect(p.files.get('game.gam')).toEqual(serializeGame(newGame('Boards')));
  });

  it('is the board the thumbnail draws', () => {
    const { p, act, game } = setup();
    const first = activeBoardPositions(p, game);
    expect([...(first?.keys() ?? [])]).not.toContain(0);
    p.setExtras('game.gam', ACTIVE_BOARD_SECTION, act);
    expect(activeBoardPositions(p, game)?.get(0)).toEqual({ x: 40, y: 20 });
    p.setExtras('game.gam', ACTIVE_BOARD_SECTION, 'removed');
    expect(activeBoardPositions(p, game)).toEqual(first);
  });
});
