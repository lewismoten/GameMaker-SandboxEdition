// Fidelity spike, web side: plays a .REC through the real web engine headless and writes what
// the player would have seen, one frame per game tick, as RGB (raw .rgb frames in one file).
//   [KEYS="tick:scan,..."] [MAXTICKS=n] node ../node_modules/vite-node/vite-node.mjs scripts/fidelityWeb.ts <gameware|shareware> <game-id> <demo.rec|-> <out-prefix> [seed]
// With '-' no recording plays and KEYS (press scan code; scan|0x80 releases) are fed at those game ticks.
// ALL=1 also writes <out>.all.rgb and <out>.all.txt: every screen the machine presents (palette fades, slides,
// menus too), one line per presented frame: index of the stored picture (identical neighbors are stored once), virtual ms, game clock, scene.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadCdGame, runHeadless } from '../../games/kit/cdDemos/headless';

process.on('SIGUSR2', () => console.error(process.getActiveResourcesInfo().join(' ')));
const [kind, id, recPath, out, seed] = process.argv.slice(2);
const files = loadCdGame(kind as 'gameware' | 'shareware', id);
const gam = `${id}.gam`;
const chunks: Buffer[] = [];
const log: string[] = [];
let ticks = 0;
let scene = -1;
let nf = 0;
let lastClock = -1;
const clocks: number[] = [];
const allChunks: Buffer[] = [];
const allLog: string[] = [];
const grab = (m: { screen: { pixels: Uint8Array; palette: Uint8Array } }): Buffer => {
  const px = m.screen.pixels;
  const pal = m.screen.palette;
  const rgb = Buffer.alloc(320 * 200 * 3);
  for (let i = 0; i < 64000; i++) for (let k = 0; k < 3; k++) rgb[i * 3 + k] = (pal[px[i] * 3 + k] << 2) | (pal[px[i] * 3 + k] >> 4);
  return rgb;
};
// KEYS="tick:scan,tick:scan" presses (scan | 0x80 releases) at that game tick
const keys: [number, number][] = (process.env.KEYS ?? '')
  .split(',')
  .filter(Boolean)
  .map((k) => k.split(':').map(Number) as [number, number]);
await runHeadless(files, gam, {
  playback: recPath && recPath !== '-' ? new Uint8Array(readFileSync(recPath)) : undefined,
  seed: Number(seed ?? 1),
  maxTicks: Number(process.env.MAXTICKS ?? 1500),
  onScene: (n) => {
    scene = n;
    log.push(`tick ${ticks} scene ${n}`);
    console.error(`tick ${ticks} scene ${n}`);
  },
  onTick: (_w, s, m) => {
    ticks++;
    for (const [t, sc] of keys) if (t === ticks) m.keyboard.feed(sc);
    if (ticks % 100 === 0) console.error(`.. ${ticks} playing=${s.rec.playing} tick=${s.rec.tick}`);
    if (recPath !== '-' && !s.rec.playing) return true;
  },
  onPresent: process.env.ALL
    ? (m, t) => {
        const g = grab(m);
        if (!allChunks.length || !g.equals(allChunks[allChunks.length - 1])) allChunks.push(g);
        allLog.push(`${allChunks.length - 1} ${t.toFixed(1)} ${lastClock} ${scene}`);
      }
    : undefined,
  onFrame: (w, _s, m) => {
    nf++;
    if (w.clock === lastClock) return;
    lastClock = w.clock;
    clocks.push(w.clock);
    if (nf % 20 === 0) console.error(`frame ${nf} clock=${w.clock} rec.tick=${_s.rec.tick} playing=${_s.rec.playing}`);
    if (process.env.NOFRAMES) return;
    const px = m.screen.pixels;
    const pal = m.screen.palette;
    const rgb = Buffer.alloc(320 * 200 * 3);
    for (let i = 0; i < 64000; i++) for (let k = 0; k < 3; k++) rgb[i * 3 + k] = (pal[px[i] * 3 + k] << 2) | (pal[px[i] * 3 + k] >> 4);
    chunks.push(rgb);
  },
});
writeFileSync(`${out}.rgb`, Buffer.concat(chunks));
if (process.env.ALL) {
  writeFileSync(`${out}.all.rgb`, Buffer.concat(allChunks));
  writeFileSync(`${out}.all.txt`, allLog.join('\n'));
}
writeFileSync(`${out}.clocks`, clocks.join('\n'));
writeFileSync(`${out}.log`, log.join('\n') + `\nframes ${chunks.length} ticks ${ticks} scene ${scene}\n`);
console.log(log.join('\n'), `\nframes ${chunks.length} ticks ${ticks}`);
