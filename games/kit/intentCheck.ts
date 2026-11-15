// What a game's levels mean to teach, checked against what a bot does (design: games/kit/README.md "intentCheck").
// games/<id>/intent.json declares, per level (scene), rules over the bot's play; nothing is guessed from text:
//   before  event A happens before event B in that level (key:Enter, score:25, scene:3, leave, death)
//   uses    the game's route (tools/play.ts) presses a key at least n times there (the route's own play, logged by kit/eventLog)
//   needs   the level is NOT won by the explorer bot (the editor's walkthrough bot) with that key banned: if it is, the level
//           may not teach the key. Only a bot that WINS says anything; a bot that fails with the ban is silence, since it may
//           just be weak.
// Findings are suggestions an author can dismiss: it exits 1 only for a rule marked "strict": true.
//   npx vite-node ../games/kit/intentCheck.ts <id>... | --all   [--no-needs] [--budget ms]   (a game without intent.json is skipped)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { recordEvents, scanOf } from '@lewismoten/gamemaker-sandbox-tools/kit/eventLog';
import { GameFiles } from '../../web/src/project/files';
import { autoWalk } from '../../web/src/editor/check/walk/autoWalk';
import { withKeys } from '../../web/src/editor/check/keyLimit';
import { checkLog, parseIntent, winnableWithout, type Finding, type Intent, type Rule } from './intentRules';
import { gamesDir } from './tinHeartDisk';

/** The explorer bot (the editor's walkthrough maker) over the built disk with `banned` scan codes unpressable: the scenes it got through. */
async function scenesWonWithout(id: string, banned: number, budgetMs: number): Promise<Set<number>> {
  const dir = join(gamesDir, id, 'disk');
  const files = new GameFiles();
  for (const f of readdirSync(dir)) files.set(f, new Uint8Array(readFileSync(join(dir, f))));
  const gam = files.names().find((n) => /\.gam$/i.test(n))!;
  const allowed = new Set<number>();
  for (let k = 1; k < 0x80; k++) if (k !== banned) allowed.add(k);
  const r = await withKeys(allowed, () => autoWalk(parseGame(files.get(gam)!), files, gam.replace(/\.gam$/i, ''), { budgetMs }));
  return new Set(r.scenes.filter((s) => s.strategy !== undefined).map((s) => s.scene));
}

async function intentFindings(id: string, intent: Intent, opt: { needs?: boolean; budgetMs?: number } = {}): Promise<Finding[]> {
  const out: Finding[] = [];
  if (intent.levels.some((l) => l.rules.some((r) => r.rule !== 'needs'))) {
    const { GameSim } = await import(`../${id}/tools/sim.ts`);
    const { play } = await import(`../${id}/tools/play.ts`);
    const { logs } = await recordEvents(GameSim, () => play());
    for (const l of intent.levels) for (const f of checkLog(l, logs[0])) out.push(f);
  }
  if (opt.needs !== false) {
    const moves = new Set(intent.levels.flatMap((l) => l.rules.flatMap((r) => (r.rule === 'needs' ? [r.move] : []))));
    for (const move of moves) {
      const won = await scenesWonWithout(id, scanOf(move)!, opt.budgetMs ?? 15_000);
      for (const l of intent.levels)
        for (const r of l.rules) if (r.rule === 'needs' && r.move === move && won.has(l.scene)) out.push(winnableWithout(l, r as Rule & { rule: 'needs' }));
    }
  }
  return out;
}

{
  const args = process.argv.slice(2);
  const bAt = args.indexOf('--budget');
  const budgetMs = bAt >= 0 ? Number(args[bAt + 1]) : undefined;
  const ids = args.includes('--all')
    ? readdirSync(gamesDir)
        .filter((d) => existsSync(join(gamesDir, d, 'intent.json')))
        .sort()
    : args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--budget');
  if (!ids.length) {
    console.error('usage: intentCheck.ts <id>... | --all [--no-needs] [--budget ms]');
    process.exit(2);
  }
  let strictFail = false;
  for (const id of ids) {
    const file = join(gamesDir, id, 'intent.json');
    if (!existsSync(file)) {
      console.log(`${id}: no intent.json, skipped`);
      continue;
    }
    let intent: Intent;
    try {
      intent = parseIntent(JSON.parse(readFileSync(file, 'utf8')), `${id}/intent.json`);
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }
    const found = await intentFindings(id, intent, { needs: !args.includes('--no-needs'), budgetMs });
    const rules = intent.levels.reduce((n, l) => n + l.rules.length, 0);
    console.log(
      `${id}: ${rules} intent rules over ${intent.levels.length} levels, ${found.length} finding${found.length === 1 ? '' : 's'} (suggestions; a bot is one way of playing)`,
    );
    for (const f of found) {
      console.log(`  ${f.strict ? 'STRICT ' : ''}${f.text}`);
      if (f.strict) strictFail = true;
    }
  }
  process.exit(strictFail ? 1 : 0);
}
