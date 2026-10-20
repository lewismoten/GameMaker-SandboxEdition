// DEMO.REC: the attract-mode recording the menu plays when nobody touches the keys. It
// is made by playing in the headless engine with a little autopilot - across the training
// deck, out of the airlock and over the galaxy chart in the pod - writing down every key
// press and release with its game tick, Game-Maker style.
import { serializeRecording, type RecordedKey } from '../../web/src/formats/recording';
import { SCAN } from './common';
import type { Built } from './game';
import { navigate, simFor } from './verify';

export async function buildDemo(b: Built): Promise<{ rec: Uint8Array; ticks: number; reached: boolean }> {
  const home = b.scenes.find((s) => s.file === 'home')!;
  const sim = simFor(b, home, 1);
  const keys: RecordedKey[] = [];
  let last = 0;
  let t = 0;
  const held = new Set<number>();
  const ev = (scan: number, down: boolean) => {
    if (down === held.has(scan)) return;
    if (down) {
      held.add(scan);
      sim.press(scan);
    } else {
      held.delete(scan);
      sim.release(scan);
    }
    // keys pressed now reach the engine on the next tick
    keys.push({ delta: t + 1 - last, key: down ? scan : scan | 0x80 });
    last = t + 1;
  };
  const step = async (n = 1) => {
    for (let i = 0; i < n; i++) {
      await sim.tick();
      t++;
    }
  };
  // stand a moment, wave hello, then head right, hopping when stuck and firing at the range
  await step(18);
  ev(SCAN.t, true);
  await step(2);
  ev(SCAN.t, false);
  await step(30);
  ev(SCAN.right, true);
  let lastX = sim.pos.x;
  let stuck = 0;
  while (t < 900 && sim.link < 0 && !sim.dead) {
    await step();
    stuck = sim.pos.x === lastX ? stuck + 1 : 0;
    lastX = sim.pos.x;
    const bx = sim.pos.bx;
    if (stuck > 2) {
      ev(SCAN.up, true);
      await step();
      ev(SCAN.up, false);
      stuck = 0;
    }
    // the practice range: blast the drones
    if (bx >= 36 && bx <= 50 && t % 12 === 0) {
      ev(SCAN.space, true);
      await step(2);
      ev(SCAN.space, false);
    }
  }
  const reached = sim.link >= 0;
  ev(SCAN.right, false);
  // then the pod: out across the galaxy chart to the warp ring of The Cradle
  const galaxy = b.scenes.find((s) => s.file === 'galaxy')!;
  const pod = simFor(b, galaxy, 2, sim.w.ci);
  const before = pod.ticks;
  const tBase = t;
  pod.onKey = (k) => {
    const now = tBase + (pod.ticks - before) + 1;
    keys.push({ delta: now - last, key: k });
    last = now;
  };
  const warp = b.game.scenes[galaxy.scene].links[1].from;
  await navigate(pod, { x: warp.x, y: warp.y + 2 }, 700);
  t += pod.ticks - before;
  // hold still a moment in front of the ring, then Esc ends the demo
  pod.onKey = undefined;
  ev(SCAN.esc, true);
  t += 1;
  ev(SCAN.esc, false);
  return { rec: serializeRecording(keys), ticks: t, reached };
}
