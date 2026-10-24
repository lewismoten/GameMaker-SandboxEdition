// Replays a game's committed walkthrough.json on the real engine and checks it still holds:
// the run reaches the ending, its length and chapter marks match the timeline it was recorded
// with (so the video and the box hours are current), and no level's end or start clip is cut
// off (what clipCheck.ts checks, from the same replay). checkGames.ts runs it for each game.
//
//   cd web && npx vite-node ../games/kit/walkCheck.ts <id>
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Walkthrough } from '../../web/src/walkthrough/format';
import { describeCut } from './clips';
import { replay } from './walkthrough';

const id = process.argv[2];
if (!id) {
  console.log('usage: walkCheck.ts <id>');
  process.exit(2);
}
const path = join(dirname(fileURLToPath(import.meta.url)), '..', id, 'walkthrough.json');
const walk = JSON.parse(readFileSync(path, 'utf8')) as Walkthrough;
const r = await replay(id, walk, { clips: true });
const problems: string[] = [];
if (r.error) problems.push(`the engine stopped: ${String(r.error)}`);
if (!r.won) problems.push(`the run did not reach the ending (scenes ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed)`);
if (r.frames !== walk.timeline.frames) problems.push(`it ran ${r.frames} frames; walkthrough.json says ${walk.timeline.frames} (re-record it)`);
const marks = (cs: { title: string; frame: number }[]) => cs.map((c) => `${c.frame} ${c.title}`).join('\n');
if (marks(r.chapters) !== marks(walk.timeline.chapters)) problems.push('its chapter marks moved from those in walkthrough.json (re-record it)');
for (const c of r.clipCuts ?? []) problems.push(describeCut(c));
for (const p of problems) console.log(`${id}: ${p}`);
const sec = Math.round(r.frames / walk.timeline.fps);
console.log(
  `${id}: ${problems.length ? `${problems.length} problems` : `walkthrough replays to the ending, ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}, clips whole`}`,
);
process.exit(problems.length ? 1 : 0);
