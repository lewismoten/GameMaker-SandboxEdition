// The board the author last had open in the Integrator, remembered per project. It lives in the
// project's companion (editor-only: the .gam and every export never include it), in its own
// section so Undo/Redo of board arrangements never rewinds which board is showing. The overview
// and assets thumbnails of the game draw that board, not always the first.
import type { Game, Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { BOARDS_SECTION, layNodes, readBoards, type BoardsData } from './boardLayout';
import { usedScenes } from './board';

export const ACTIVE_BOARD_SECTION = 'integratorActiveBoard';

/** The remembered board id if that board still exists, else the first board's (undefined without boards). */
export function activeBoardId(data: BoardsData, raw: unknown): string | undefined {
  return typeof raw === 'string' && data.boards.some((b) => b.id === raw) ? raw : data.boards[0]?.id;
}

interface Store {
  gam: string;
  extras<T>(file: string, section: string, fallback: T): T;
}

/** Where each scene sits on the remembered board, for a thumbnail; undefined when the game has no boards (DOS positions then). */
export function activeBoardPositions(project: Store, game: Game): Map<number, Point> | undefined {
  const data = readBoards(project.extras(project.gam, BOARDS_SECTION, undefined));
  const id = activeBoardId(data, project.extras(project.gam, ACTIVE_BOARD_SECTION, undefined));
  if (!id) return undefined;
  const { nodes } = layNodes(data, usedScenes(game), (i) => game.scenes[i].pos);
  const at = new Map<number, Point>();
  for (const n of nodes) if (n.board === id) for (const m of n.scenes) at.set(m, n.pos);
  return at;
}
