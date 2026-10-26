// Where the hidden things are: each new game's about.json says which map its Easter egg and its
// tin heart are on ("easterEgg" / "tinHeart": { "map": "park.map", "at": [x, y] }). This lists
// them for the cast page's "Seen in" (src/cast/hidden.json: member id → [game id, map]), leaving
// out the secret games. A test (castData.test.ts) fails when a game's about.json and this list
// disagree: rerun it.
//
//   cd web && npx vite-node scripts/castHidden.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hiddenPlacements } from './castHiddenScan';

const out = hiddenPlacements(join(__dirname, '../../games'));
/** One game a line, so a new placement is a one-line diff. */
const hiddenJson = (h: typeof out) =>
  `{\n${Object.entries(h)
    .map(([k, list]) => `  ${JSON.stringify(k)}: [\n${list.map((g) => `    ${JSON.stringify(g)}`).join(',\n')}\n  ]`)
    .join(',\n')}\n}\n`;
writeFileSync(join(__dirname, '../src/cast/hidden.json'), hiddenJson(out));
for (const [id, list] of Object.entries(out)) console.log(`${id}: ${list.length} games`);
