// Advisory check: can a hero start another jump before landing? Game-Maker 3.0 has no "on the ground"
// test for a sequence (PLAYGAME.C: a key press starts its sequence whenever the current one is not
// uninterruptible, line ~4455, and GetTouchbl sees the block under the feet only while the hero
// overlaps it), so the default jump (a momentum push, norepeat, interruptible) can be tapped again in
// the air. This reads every .chr on a game's disk/ and lists each keyed momentum push upward:
//   REJUMP   unlimited taps, and the sequence is not uninterruptible for the whole flight
//   counted  the sequence has a finite counter (meter), so taps run out until a block refills them
//   locked   uninterruptible (ground flag) for at least the flight (the hero cannot steer meanwhile)
//   bounded  a held-rise jump (not momentum): it moves the hero straight up each tick the key is held while
//            gravity's momentum (already pixels a tick) keeps growing, so after push * gravity ticks in the air a new press
//            cannot lift him (heroChar heldRise, Loaf, Mustard). Only if the push a tick is not above gravity's cap, 44
//            (midairRule.ts has the reasoning with engine line numbers; heldRiseProof.ts sweeps it against the engine)
//   allowed  games/kit/midairJump.allow.json says it is on purpose
//   npx vite-node ../games/kit/midairJump.ts [--md] [--strict] [<id>...]
// --md prints a markdown table. Exit is 0 unless --strict and a REJUMP is not allowed. A finding is a
// suggestion: it cannot see a jetpack's story, only a push upward that can repeat in the air.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INF_REPEAT } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { jumpsIn, type Jump } from './midairRule';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function allJumps(ids: string[]): Jump[] {
  const allow = JSON.parse(readFileSync(join(gamesDir, 'kit', 'midairJump.allow.json'), 'utf8')) as Record<string, string>;
  const out: Jump[] = [];
  for (const id of ids) {
    const dir = join(gamesDir, id, 'disk');
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((n) => /\.chr$/i.test(n))
      .sort())
      out.push(...jumpsIn(id, f.toLowerCase(), new Uint8Array(readFileSync(join(dir, f))), allow));
  }
  return out;
}

{
  const args = process.argv.slice(2);
  const ids = args.filter((a) => !a.startsWith('--'));
  const games = ids.length
    ? ids
    : readdirSync(gamesDir)
        .filter((id) => existsSync(join(gamesDir, id, 'about.json')))
        .sort();
  const jumps = allJumps(games);
  const md = args.includes('--md');
  const keyName = (k: number) => ({ 0x39: 'Space', 0x48: 'Up', 0x11: 'W', 0x10: 'Q', 0x12: 'E', 0x1c: 'Enter', 0x21: 'F' })[k] ?? `0x${k.toString(16)}`;
  if (md) console.log('| game | hero file | key | push | air ticks | locked ticks | counter | result | note |\n|---|---|---|---|---|---|---|---|---|');
  for (const j of jumps) {
    const cells = [j.game, j.file, keyName(j.key), j.push, j.air, j.lock, j.meter < INF_REPEAT ? j.meter : 'unlimited', j.verdict, j.reason];
    console.log(md ? `| ${cells.join(' | ')} |` : cells.join('\t'));
  }
  const bad = jumps.filter((j) => j.verdict === 'REJUMP');
  console.log(
    `${bad.length} hero sequences can jump again in the air (${new Set(bad.map((j) => j.game)).size} games); ${jumps.length - bad.length} counted, locked or allowed`,
  );
  process.exit(args.includes('--strict') && bad.length ? 1 : 0);
}
