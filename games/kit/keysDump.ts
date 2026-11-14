// Lists what a game's disk binds: every key (with the actions, characters and levels that use it), joystick
// button, counter and sound, as plain lines. Used to write a game's controls.json.
//   cd web && npm run keys:dump -- <id> [id ...]      (reads games/<id>/disk; build the game first)
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { GameFiles } from '../../web/src/project/files';
import { gameKeyMap } from '../../web/src/editor/keymap/keyMap';
import { counterUses } from '../../web/src/editor/shell/counterUse';
import { soundUses } from '../../web/src/editor/shell/soundUse';

const games = join(dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!ids.length) throw new Error('Give one or more game ids, e.g. npm run keys:dump -- lucky-cat');
let failed = 0;
for (const id of ids) {
  const disk = join(games, id, 'disk');
  if (!existsSync(disk)) {
    console.log(`== ${id}: no disk (build the game first)`);
    failed = 1;
    continue;
  }
  const files = new GameFiles(readDisk(disk));
  const m = gameKeyMap(files);
  console.log('==', id);
  for (const k of m.keys)
    for (const u of k.uses)
      console.log(`key ${k.scan} ${k.name} | ${u.action.title} | ${u.action.details.join('; ')} | chr ${u.chrs.join(',')} | ${u.levels.length} levels`);
  for (const j of m.joystick) console.log(`joy ${j.label} | ${j.action.title}`);
  for (const [n, u] of counterUses({ files })) console.log(`counter ${n} ${JSON.stringify(u).slice(0, 200)}`);
  for (const [n, u] of soundUses({ files })) console.log(`sound ${n} ${JSON.stringify(u).slice(0, 160)}`);
}
process.exit(failed);
