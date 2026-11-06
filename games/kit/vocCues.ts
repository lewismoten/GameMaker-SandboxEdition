// VOC stutter cues (advisory): the Level check's `voc-stutter` suggestions for a built game, so
// `check:games` can say which games have a sound that may stall play on a slow PC (PLAYGAME reads
// the whole .VOC from disk on the game's thread) or a score/healing block that replays a long
// sound every tick. A suggestion an author can dismiss: sizes are estimates (audio/vocLimit.ts)
// and it can't see the player's disk or how long anyone stands on a block.
// Run it with vocCuesCli.ts.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFiles } from '../../web/src/project/files';
import { gameOf } from '../../web/src/editor/check/playtest';
import { scenesOf } from '../../web/src/editor/check/sceneData';
import { stutterVocs } from '../../web/src/editor/check/checks/missingParts';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';

const games = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The distinct titles of a game's voc-stutter suggestions. */
export function vocCuesOfGame(id: string): string[] {
  const disk = join(games, id, 'disk');
  if (!existsSync(disk)) return [];
  const files = new GameFiles(readDisk(disk));
  const game = gameOf(files);
  return [...new Set(scenesOf(game, files).flatMap((d) => stutterVocs(d, files).map((f) => f.title)))];
}
