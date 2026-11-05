// Flashing check for FLASH SAFE: replays walkthrough.json on the real engine and counts, in every
// second, the large light changes (WCAG 2.3.1's general flash and red flash tests, on the 320x200
// frames). Exits 1 above 3 a second. kit/flashCheckCli.ts is the same for any game.
//   cd web && npx vite-node ../games/flash-safe/tools/flash.ts
import { flashOfGame } from '../../kit/flashCheck';

const r = await flashOfGame('flash-safe');
console.log(
  `flash-safe: ${r.seconds}s replayed; most flashes in a second: ${r.general.flashes} (limit 3), red ${r.red.flashes}; the biggest light change moved ${(r.general.area * 100).toFixed(1)}% of the screen`,
);
if (r.fails) {
  console.error('flash-safe flashes more than three times in a second');
  process.exit(1);
}
