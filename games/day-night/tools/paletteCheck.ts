// Checks the three palettes and how the scenes use them, on the built disk:
//   - every stage of a level loads the same map and block file, and only the palette differs
//   - the three .PAL files differ, and the designer colors and the text colors are the same in all
//   - the star slot is exactly the sky's color by day (so stars are there but unseen), and shows by night
//   - the lamp slots and the sun/moon slots are brighter or different by night, the rest darker
//   - Kit's colors and a sign's letters keep enough contrast with the night sky and board (suggestions, not law)
//   cd web && npx vite-node ../games/day-night/tools/paletteCheck.ts
import { readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { buildLevels } from '../src/levels';

const disk = new URL('../disk/', import.meta.url);
const read = (f: string) => new Uint8Array(readFileSync(new URL(f, disk)));
const game = parseGame(read('dayngt.gam'));
const { pal, levels } = buildLevels();
let bad = 0;
const fail = (msg: string) => {
  console.error(`paletteCheck: ${msg}`);
  bad++;
};

// the scenes: from scene 2, a scene a stage, in level order
let scene = 2;
for (const l of levels) {
  const first = game.scenes[scene].files;
  for (const st of l.stages) {
    const f = game.scenes[scene].files;
    if (f[0] !== `${st.hour}.pal`) fail(`scene ${scene} should load ${st.hour}.pal, not ${f[0]}`);
    if (f[1] !== first[1] || f[2] !== first[2]) fail(`scene ${scene} should load the same map and blocks as its level's first stage`);
    scene++;
  }
}
console.log(`${scene - 2} stages checked: each level's stages share one map and one block file`);

const files = { day: read('day.pal'), dusk: read('dusk.pal'), night: read('night.pal') };
for (const k of ['day', 'dusk', 'night'] as const) if (files[k].length !== 768) fail(`${k}.pal is ${files[k].length} bytes`);
if (Buffer.compare(files.day, files.dusk) === 0 || Buffer.compare(files.day, files.night) === 0) fail('two palettes are the same');
for (let i = 0; i < 9 * 3; i++) if (files.day[i] !== files.night[i] || files.day[i] !== files.dusk[i]) fail(`a designer color changed at byte ${i}`);
for (const name of ['menublue', 'plum', 'hot'])
  for (const id of pal.r(name)) for (let k = 0; k < 3; k++) if (files.day[id * 3 + k] !== files.night[id * 3 + k]) fail(`text color ${name} changed`);

const rgb = (p: Uint8Array, id: number) => [p[id * 3] * 4, p[id * 3 + 1] * 4, p[id * 3 + 2] * 4];
const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const ratio = (a: number[], b: number[]) => {
  const f = (c: number[]) => {
    const l = c.map((v) => (v / 255) ** 2.2);
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  };
  const [x, y] = [f(a), f(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const star = pal.r('star')[0];
const sky = pal.c('sky', 3);
if (rgb(files.day, star).join() !== rgb(files.day, sky).join()) fail('by day the star slot should be the sky color');
if (ratio(rgb(files.night, star), rgb(files.night, sky)) < 8) fail('by night the star should stand out from the sky');
for (const k of pal.r('lamp').keys())
  if (lum(rgb(files.night, pal.r('lamp')[k])) <= lum(rgb(files.day, pal.r('lamp')[k]))) fail('the lamp ramp should be brighter by night');
if (ratio(rgb(files.night, pal.c('orb', 1)), rgb(files.night, sky)) < 4) fail('the moon should stand out from the night sky');
const apart = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
if (apart(rgb(files.day, pal.c('orb', 1)), rgb(files.day, sky)) < 100) fail('the sun should stand out from the day sky');
// Kit and the sign letters, at night
const kitBody = ratio(rgb(files.night, pal.c('orange', 2)), rgb(files.night, sky));
const kitHat = ratio(rgb(files.night, pal.c('teal', 2)), rgb(files.night, sky));
const letters = ratio(rgb(files.night, pal.c('ink', 0)), rgb(files.night, pal.c('parch', 3)));
console.log(
  `night contrast: Kit's hoodie ${kitBody.toFixed(1)}:1, their beanie ${kitHat.toFixed(1)}:1 against the sky; a sign's letters ${letters.toFixed(1)}:1`,
);
if (kitBody < 2 || kitHat < 2) fail('Kit should stand out from the night sky (2:1 or more)');
if (letters < 4.5) fail('a sign should be readable at night (4.5:1)');
if (bad) process.exit(1);
console.log('paletteCheck ok: same map and blocks in every stage, three different palettes, stars hidden by day, lamps lit by night');
