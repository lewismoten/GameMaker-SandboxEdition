// The color cues check on the command line (colorCues.ts has the measuring): a table over every Starter, or the ids given.
//   cd web && npx vite-node ../games/kit/colorCuesCli.ts [id ...] [--pairs] [--json]
import { pairsOfGame, type Pair } from './colorCues';
import { STARTER_ORDER } from '../../web/src/project/starter';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ids = args.length ? args : STARTER_ORDER;
const all: Pair[] = ids.flatMap((id) => {
  try {
    return pairsOfGame(id);
  } catch (e) {
    console.error(`${id}: ${(e as Error).message}`);
    return [];
  }
});
if (process.argv.includes('--json')) console.log(JSON.stringify(all));
else {
  console.log('game                 pairs  hue-alone  look-alike under              kinds');
  for (const id of ids) {
    const ps = all.filter((p) => p.game === id);
    const bad = ps.filter((p) => p.hueOnly);
    const la = new Set(bad.flatMap((p) => p.lookAlike));
    const kinds = [...new Set(bad.map((p) => p.kind))];
    console.log(`${id.padEnd(20)} ${String(ps.length).padStart(5)}  ${String(bad.length).padStart(9)}  ${[...la].join(',').padEnd(28)}  ${kinds.join(',')}`);
  }
  if (process.argv.includes('--pairs'))
    for (const p of all.filter((x) => x.hueOnly))
      console.log(
        `${p.game} s${p.scene} ${p.kind} ${p.a}/${p.b}: light ${Math.round(p.light.normal)}/${Math.round(p.light.deutan)}, shape ${(p.shape * 100).toFixed(0)}%, pattern ${p.pattern.normal.toFixed(1)}, dE ${Math.round(p.delta.normal)}/${Math.round(p.delta.protan)}/${Math.round(p.delta.deutan)}/${Math.round(p.delta.tritan)}`,
      );
  const withPairs = ids.filter((id) => all.some((p) => p.game === id));
  console.log(`\n${ids.length} games, ${withPairs.length} with pairs to tell apart, ${all.length} pairs, ${all.filter((p) => p.hueOnly).length} hue-alone`);
}
