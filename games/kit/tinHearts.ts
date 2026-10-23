// The tin heart hunt's manifest and checks (see TIN-HEARTS.md). Run from web/:
//
//   npx vite-node ../games/kit/tinHearts.ts           rewrite web/src/tinHearts/hearts.json from
//                                                      every game's about.json "tinHeart"
//   npx vite-node ../games/kit/tinHearts.ts find <id>  where the tin heart blocks are on <id>'s disk
//                                                      (what to put in about.json)
//   npx vite-node ../games/kit/tinHearts.ts check [<id>...]
//                                                      each declared heart: its block is on the disk
//                                                      at that place, and the real engine's touch,
//                                                      run headless, reports it as the heart
//
// hearts.json is generated: never edit it by hand (a test fails when it is out of date).
import { readFileSync, writeFileSync } from 'node:fs';
import { findHearts, heartProblems, manifestPath, readAbouts, touchHeadless } from './tinHeartDisk';
import { buildManifest, heartPlace, manifestText } from '../../web/src/tinHearts/manifest';

const [cmd, ...ids] = process.argv.slice(2);
const abouts = readAbouts();
if (cmd === 'find') {
  for (const id of ids) {
    const found = findHearts(id);
    if (!found.length) console.log(`${id}: no tin heart on any map (draw it with kit/tinHeart.ts drawTinHeart)`);
    for (const f of found) console.log(`${id}: scene ${f.scene}, block ${f.block}:  "tinHeart": { "map": "${f.place.map}", "at": [${f.place.at.join(', ')}] },`);
  }
} else if (cmd === 'check') {
  const m = buildManifest(abouts);
  let bad = 0;
  for (const id of ids.length ? ids : Object.keys(m.hearts)) {
    const place = heartPlace(abouts[id] ?? {});
    if (!place || typeof place === 'string') {
      console.log(`${id}: ${place ?? 'no tinHeart in about.json'}`);
      bad++;
      continue;
    }
    const problems = heartProblems(id, place);
    const touched = !problems.length && touchHeadless(id, place);
    if (!problems.length && touched) console.log(`${id}: ok, ${place.map} at ${place.at.join(',')}, found when touched`);
    else {
      bad++;
      console.log(`${id}: ${problems.length ? problems.join('; ') : 'the touch was not reported as the heart'}`);
    }
  }
  if (JSON.stringify(m) !== JSON.stringify(JSON.parse(readFileSync(manifestPath, 'utf8')))) {
    console.log('hearts.json is out of date: run npx vite-node ../games/kit/tinHearts.ts');
    bad++;
  }
  process.exit(bad ? 1 : 0);
} else {
  const text = manifestText(buildManifest(abouts));
  writeFileSync(manifestPath, text);
  const m = JSON.parse(text);
  console.log(`hearts.json: ${Object.keys(m.hearts).length} games with a heart, ${m.pending.length} without one yet`);
}
