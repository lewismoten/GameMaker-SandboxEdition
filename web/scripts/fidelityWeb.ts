// Fidelity spike, web side: plays a .REC through the real web engine headless and writes what
// the player would have seen, one frame per game tick, as RGB (raw .rgb frames in one file).
//   [KEYS="tick:scan,..."] [MAXTICKS=n] node ../node_modules/vite-node/vite-node.mjs scripts/fidelityWeb.ts <gameware|shareware> <game-id> <demo.rec|-> <out-prefix> [seed]
// With '-' the game starts playing at once (record mode, no menu, so the demo never runs; the web's idle menu would
// play demo.rec) and KEYS (press scan code; scan|0x80 releases) are fed at those game ticks, counted from the first
// tick of scene KEYSCENE (default 2, the first level) so the title and slides do not shift them.
// ALL=1 also writes <out>.all.rgb and <out>.all.txt: every screen the machine presents (palette fades, slides,
// menus too), one line per presented frame: index of the stored picture (identical neighbors are stored once), virtual ms, game clock, scene.
import { closeSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { loadCdGame, runHeadless } from '../../games/kit/cdDemos/headless';

process.on('SIGUSR2', () => console.error(process.getActiveResourcesInfo().join(' ')));
const [kind, id, recPath, out, seed] = process.argv.slice(2);
const files = loadCdGame(kind as 'gameware' | 'shareware', id);
const gam = `${id}.gam`;
let frameCount = 0;
let ticks = 0;
let scene = -1;
let nf = 0;
let lastClock = -1;
let baseTick = -1;
let previous: Buffer | undefined;
let picture = -1;
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
const descriptors: number[] = [];
const openOutput = (suffix: string) => {
  const fd = openSync(out + suffix, 'w');
  descriptors.push(fd);
  return fd;
};
const lines = (fd: number) => {
  let separator = '';
  return (line: string) => {
    writeFileSync(fd, separator + line);
    separator = '\n';
  };
};
try {
  const rgb = openOutput('.rgb');
  const clockLine = lines(openOutput('.clocks'));
  const logLine = lines(openOutput('.log'));
  const all = process.env.ALL ? { rgb: openOutput('.all.rgb'), line: lines(openOutput('.all.txt')) } : undefined;
  await runHeadless(files, gam, {
    record: recPath === '-',
    playback: recPath && recPath !== '-' ? new Uint8Array(readFileSync(recPath)) : undefined,
    seed: Number(seed ?? 1),
    maxTicks: Number(process.env.MAXTICKS ?? 1500),
    onScene: (n) => {
      scene = n;
      if (baseTick < 0 && n === Number(process.env.KEYSCENE ?? 2)) baseTick = ticks;
      logLine(`tick ${ticks} scene ${n}`);
      console.log(`tick ${ticks} scene ${n}`);
      console.error(`tick ${ticks} scene ${n}`);
    },
    onTick: (_w, s, m) => {
      ticks++;
      for (const [t, sc] of keys) if (baseTick >= 0 && baseTick + t === ticks) m.keyboard.feed(sc);
      if (ticks % 100 === 0) console.error(`.. ${ticks} playing=${s.rec.playing} tick=${s.rec.tick}`);
      if (recPath !== '-' && !s.rec.playing) return true;
    },
    onPresent: all
      ? (m, t) => {
          const g = grab(m);
          if (!previous || !g.equals(previous)) {
            writeFileSync(all.rgb, g);
            previous = g;
            picture++;
          }
          all.line(`${picture} ${t.toFixed(1)} ${lastClock} ${scene}`);
        }
      : undefined,
    onFrame: (w, _s, m) => {
      nf++;
      if (w.clock === lastClock) return;
      lastClock = w.clock;
      clockLine(String(w.clock));
      if (nf % 20 === 0) console.error(`frame ${nf} clock=${w.clock} rec.tick=${_s.rec.tick} playing=${_s.rec.playing}`);
      if (process.env.NOFRAMES) return;
      writeFileSync(rgb, grab(m));
      frameCount++;
    },
  });
  logLine(`frames ${frameCount} ticks ${ticks} scene ${scene}\n`);
  console.log(`frames ${frameCount} ticks ${ticks}`);
} finally {
  for (const fd of descriptors) closeSync(fd);
}

process.exit(0); // the headless machine can keep the process alive after its last tick
