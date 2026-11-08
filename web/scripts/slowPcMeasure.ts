// Measures "Run like a..." in a real headless browser: plays the three levels of Slow Computers on a dev
// server (hold Right, tap Enter for signs, round and round) at each speed. For each level it prints the
// game ticks actually run per second (18.2 is full speed; a skipped tick is not counted), over all the
// one-second windows and over the windows with 10 or more monsters on screen (level 2's crowd), the longest
// time the game ran no tick, the longest frame gap, and each voice: its size, how long after the game asked
// for it the audio started, and how many ms later the game's next tick ran. Then the level changes: for
// each room the game entered, the scene-load pause the preset charged (Session.sceneLoad: files opened,
// bytes read, ms) and the measured wall time from the last tick of the room before to the first frame of
// play in this one (fade-out, the black screen and the fade-in; Today's gap is the baseline, so the
// difference from Today's is the measured pause).
//   cd web && npx vite-node scripts/slowPcMeasure.ts [port=5191] [speeds=today,286] [seconds per run=75]
//   (SHOT=<path prefix> saves a PNG at the end of each run)
import { launch } from './perfLib';

const port = process.argv[2] ?? '5191';
const speeds = (process.argv[3] ?? 'today,286').split(',');
const seconds = Number(process.argv[4] ?? 75);

interface Voc {
  bytes: number;
  askedAt: number;
  audioAt: number;
  nextTickAt: number;
}
interface Win {
  ticks: number;
  shown: number;
}
interface Room {
  t0: number;
  t1: number;
  stall: number;
  frameGap: number;
  wins: Win[];
  voc: Voc[];
  /** The scene-load charge for this room (Session.sceneLoad), absent when nothing was charged. */
  load?: { files: number; bytes: number; ms: number };
  /** Wall ms from the room before's last tick to this room's first frame of play; absent for the first room. */
  gap?: number;
}

const changes: string[] = [];

const b = await launch();
try {
  console.log('speed | room | wall s | ticks/s all | ticks/s with 10+ monsters shown (windows) | longest no-tick ms | longest frame ms | voices');
  for (const speed of speeds) {
    const page = await b.newPage({ viewport: { width: 900, height: 700 } });
    page.on('pageerror', (e) => console.log('pageerror', e.message));
    await page.goto(`http://localhost:${port}/play.html?game=slow-computers`);
    await page.waitForSelector('.gm-start', { timeout: 180000 });
    await page.click('.gm-start');
    await page.selectOption('.gm-speed select', speed);
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const rooms: Room[] = [];
      let cur: Room | undefined;
      let lastWorld: unknown;
      let lastClock = -1;
      let lastTickAt = 0;
      let lastFrame = 0;
      let winStart = 0;
      let winTicks = 0;
      let winShown = 0;
      const pending: Voc[] = [];
      let asked = 0;
      const hooked = new WeakSet<object>();
      const frame = (t: number) => {
        // the page's dev hook (engine/scene.ts): the live session and world, loosely typed on purpose
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (globalThis as unknown as { __gm?: { session: any; world: any } }).__gm;
        if (g) {
          const a = g.session.m.audio;
          if (!hooked.has(a)) {
            hooked.add(a);
            const pv = a.playVoc.bind(a);
            a.playVoc = (bytes: Uint8Array | undefined) => {
              const rec = { bytes: bytes?.length ?? 0, askedAt: asked, audioAt: performance.now(), nextTickAt: 0 };
              cur?.voc.push(rec);
              pending.push(rec);
              return pv(bytes);
            };
          }
          if (g.world !== lastWorld) {
            lastWorld = g.world;
            const sp = g.world.sound.play.bind(g.world.sound);
            g.world.sound.play = (n: number) => {
              asked = performance.now();
              return sp(n);
            };
            cur = { t0: t, t1: t, stall: 0, frameGap: 0, wins: [], voc: [] };
            const load = g.session.sceneLoad as Room['load'];
            if (load) cur.load = { ...load };
            if (lastTickAt) cur.gap = t - lastTickAt;
            rooms.push(cur);
            lastClock = -1;
            winStart = t;
            winTicks = 0;
            winShown = 0;
          }
          const clock = g.world.clock;
          if (clock !== lastClock && cur) {
            if (lastClock >= 0) {
              cur.stall = Math.max(cur.stall, t - lastTickAt);
              winTicks++;
              for (const v of pending.splice(0)) v.nextTickAt = t;
            }
            lastClock = clock;
            lastTickAt = t;
          }
          if (cur) {
            let shown = 0;
            for (let i = 0; i < g.world.mm.length; i++) if (g.world.mm[i].monnum <= 2 && g.world.mi[i].scrPos.x !== -100) shown++;
            winShown = Math.max(winShown, shown);
            cur.t1 = t;
            if (lastFrame) cur.frameGap = Math.max(cur.frameGap, t - lastFrame);
            if (t - winStart >= 1000) {
              cur.wins.push({ ticks: winTicks / ((t - winStart) / 1000), shown: winShown });
              winStart = t;
              winTicks = 0;
              winShown = 0;
            }
          }
        }
        lastFrame = t;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      (globalThis as unknown as { __rooms: Room[] }).__rooms = rooms;
    });
    for (let k = 0; k < 10; k++) {
      await page.waitForTimeout(1500);
      await page.keyboard.press('Enter');
    }
    await page.keyboard.down('ArrowRight');
    const t0 = Date.now();
    let i = 0;
    while (Date.now() - t0 < seconds * 1000) {
      await page.waitForTimeout(700);
      i++;
      if (i % 2 === 0) await page.keyboard.press('Enter');
      if (i % 5 === 0) {
        await page.keyboard.up('ArrowRight');
        await page.keyboard.down('ArrowRight');
      }
    }
    await page.keyboard.up('ArrowRight');
    if (process.env.SHOT) await page.screenshot({ path: `${process.env.SHOT}-${speed}.png` });
    const rooms = await page.evaluate(() => (globalThis as unknown as { __rooms: Room[] }).__rooms);
    const avg = (w: Win[]) => (w.length ? (w.reduce((s, x) => s + x.ticks, 0) / w.length).toFixed(1) : '-');
    // a room is told apart by what it has: voices (level 1), a crowd (level 2), else level 3 / the menus
    rooms.forEach((r, n) => {
      if (r.t1 - r.t0 < 4000) return;
      const crowd = r.wins.filter((w) => w.shown >= 10);
      const kind = r.voc.length ? '1 pads' : r.wins.some((w) => w.shown > 0) ? '2 crowd' : 'other';
      const v = r.voc.map((x) => `${x.bytes}B audio+${(x.audioAt - x.askedAt).toFixed(0)}ms tick+${(x.nextTickAt - x.askedAt).toFixed(0)}ms`).join('; ');
      console.log(
        `${speed} | #${n} ${kind} | ${((r.t1 - r.t0) / 1000).toFixed(1)} | ${avg(r.wins)} | ${avg(crowd)} (${crowd.length}) | ${r.stall.toFixed(0)} | ${r.frameGap.toFixed(0)} | ${v}`,
      );
    });
    rooms.forEach((r, n) => {
      const kind = r.voc.length ? '1 pads' : r.wins.some((w) => w.shown > 0) ? '2 crowd' : 'other';
      const load = r.load ? `${r.load.files} | ${r.load.bytes} | ${r.load.ms.toFixed(1)}` : '0 | 0 | 0';
      changes.push(`${speed} | #${n} ${kind} | ${load} | ${r.gap === undefined ? '-' : r.gap.toFixed(0)}`);
    });
    await page.close();
  }
  console.log('\nlevel changes');
  console.log('speed | room | files read | bytes | charged pause ms | wall ms from the last tick before to the first frame of play');
  for (const line of changes) console.log(line);
} finally {
  await b.close();
}
