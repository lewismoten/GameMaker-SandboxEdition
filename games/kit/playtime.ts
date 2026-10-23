// Sets every game's "Over N hours of gameplay!" claim (about.json box.hours, the one field the
// box cover's burst is drawn from) from its walkthrough, so the games' claims keep their play
// times relative to one another. Rerun after any walkthrough changes:
//
//   cd web && npx vite-node ../games/kit/playtime.ts
//
// Play time is the walkthrough's level chapters only (not the Opening, Story, Ending or
// Credits). hours = max(1, round(play minutes × 25 / 60)): 25 claimed minutes per minute of
// the bot's perfect run (PLAY_SCALE, web/src/desk/boxes/playtime.ts), which lands the median
// game on 3 hours. Games without a walkthrough keep their claim and are listed at the end.
// about.json is edited as text (one line), keeping its formatting.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claimedHours, playMinutes, PLAY_SCALE, type Timeline } from '../../web/src/desk/boxes/playtime';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Sets box.hours in about.json's text: replaces the line, or adds it as the box's first key. */
export function setHours(text: string, hours: number): string {
  if (/^ {4}"hours": \d+,?$/m.test(text)) return text.replace(/^( {4}"hours": )\d+/m, `$1${hours}`);
  return text.replace(/^( {2}"box": \{\n)/m, `$1    "hours": ${hours},\n`);
}

const rows: string[] = [];
const notes: string[] = [];
for (const id of readdirSync(gamesDir).sort()) {
  const aboutPath = join(gamesDir, id, 'about.json');
  if (!existsSync(aboutPath)) continue;
  const text = readFileSync(aboutPath, 'utf8');
  const about = JSON.parse(text) as { box?: { hours?: number } };
  const walkPath = join(gamesDir, id, 'walkthrough.json');
  if (!existsSync(walkPath)) {
    notes.push(`${id}: no walkthrough; keeps ${about.box?.hours ?? 'its estimated'} hours`);
    continue;
  }
  const minutes = playMinutes((JSON.parse(readFileSync(walkPath, 'utf8')) as { timeline: Timeline }).timeline);
  const hours = claimedHours(minutes);
  if (!about.box) {
    notes.push(`${id}: no box, so no claim (${minutes.toFixed(1)} play minutes would be ${hours} h)`);
    continue;
  }
  const before = about.box.hours;
  if (before !== hours) {
    const next = setHours(text, hours);
    if ((JSON.parse(next) as { box: { hours: number } }).box.hours !== hours) throw new Error(`${id}: could not set box.hours`);
    writeFileSync(aboutPath, next);
  }
  rows.push(`${id.padEnd(10)} ${minutes.toFixed(1).padStart(6)} min  ${String(before ?? '-').padStart(3)} -> ${hours} h`);
}
console.log(`Play time x ${PLAY_SCALE} = claimed time (hours = max(1, round(minutes * ${PLAY_SCALE} / 60)))`);
for (const r of rows) console.log(r);
for (const n of notes) console.log(`note: ${n}`);
