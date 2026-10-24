// The maze generator set up for a map: its blocks chosen from what the map already uses (the
// commonest solid block for walls, its plain air for floor, unused-in-the-area harmless blocks as
// landmarks, a pickup the map has as the prize in dead ends).
import { BACKBL, parseBlocks } from '../../../formats/blocks';
import { parseMap } from '../../../formats/map';
import type { Project } from '../../core/project';
import { blockUse } from '../sceneData';
import { airBlock, landmarkBlocks, makeMaze } from './mapFixes';

export function mazeFor(project: Project, mapFile: string, rect: { x: number; y: number; w: number; h: number }): [number, number][] | undefined {
  const game = project.game();
  const scene = game.scenes.find((s) => s.files[1] && project.files.resolve(s.files[1]) === project.files.resolve(mapFile));
  const bblName = scene?.files[2] || project.files.byExtension('bbl')[0];
  const mapBytes = project.files.get(mapFile);
  const bblBytes = bblName ? project.files.get(bblName) : undefined;
  if (!mapBytes || !bblBytes) return undefined;
  const map = parseMap(mapBytes);
  const bg = parseBlocks(bblBytes, BACKBL);
  const use = blockUse(map);
  let wall = -1;
  for (let n = 0; n < BACKBL; n++) if (bg[n].solid === 15 && !bg[n].chHitPt && (wall < 0 || use[n] > use[wall])) wall = n;
  const floor = airBlock(bg, use);
  if (wall < 0 || bg[floor].solid === 15) return undefined;
  const marks = landmarkBlocks(map.blocks, bg, new Set([wall, floor])).slice(0, 4);
  let prize: number | undefined;
  for (let n = 0; n < BACKBL; n++) if (use[n] && !bg[n].solid && (bg[n].scorePts > 0 || bg[n].obj) && (prize === undefined || use[n] > use[prize])) prize = n;
  return makeMaze(rect, wall, floor, marks, prize, Date.now() & 0xffff);
}
