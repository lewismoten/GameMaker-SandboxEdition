// No locked door or gate can be jumped over. For every lock in every scene of a built game (a solid block
// that takes a key: its counter is 20 or more and it takes one away), the hero is put, without the key,
// on each spot he can stand within 9 blocks of it and leaps at it over and over (a run-up, then Space, the
// arrow held). The check fails when he gets past the lock's column above the lock (higher than its top).
// A spot no one can reach (inside a wall) can give a false alarm; an author can dismiss it.
// Started from your-first-game's wallCheck. A Starter's tall wall is StarterMap.wallToSky.
//   npx vite-node ../games/kit/leapCheck.ts [<id>...]   (every game with an about.json when none; checkGames runs it)
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { initScroll } from '@lewismoten/gamemaker-sandbox-engine/engine/scroll';
import { startSceneInits } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { gamesDir } from './tinHeartDisk';

const SCAN = { left: 75, right: 77, space: 57 };
const REACH = 9;

interface Lock {
  x: number;
  y: number;
}

/** The scene's lock blocks, as the engine shows them now. */
function locksIn(sim: GameSim): Lock[] {
  const out: Lock[] = [];
  for (let y = 0; y < MLEN; y++)
    for (let x = 0; x < MLEN; x++) {
      const b = sim.shown(x, y);
      if (b.solid && b.effect >= 20 && b.effect <= 29 && b.eamt < 0 && b.eamt > -100) out.push({ x, y });
    }
  return out;
}

/** Leaps from the current spot toward `dir`; true when the hero ends up past `lock.x` higher than the lock. */
async function leapsOver(sim: GameSim, lock: Lock, dir: 'left' | 'right'): Promise<boolean> {
  const tick = async () => (await sim.tick()) !== undefined;
  const keys = () => sim.ci.meter.slice(20, 30).join();
  const before = keys();
  for (let t = 0; t < 12; t++) if (await tick()) return false;
  // a spot with a key on it is not keyless
  if (keys() !== before) return false;
  for (let k = 0; k < 4; k++) {
    sim.press(SCAN[dir]);
    for (let t = 0; t < 5; t++) if (await tick()) return false;
    sim.press(SCAN.space);
    for (let t = 0; t < 34; t++) {
      if ((await tick()) || keys() !== before) return false;
      const p = sim.pos;
      const x = p.x * 20 + p.sx;
      const y = p.y + p.sy / 20;
      const past = dir === 'right' ? x >= (lock.x + 0.5) * 20 : x <= (lock.x - 0.5) * 20;
      if (past && y < lock.y) return true;
    }
    sim.releaseAll();
    for (let t = 0; t < 30; t++) if (await tick()) return false;
  }
  return false;
}

/** Problems found in one game's disk, one string each. */
async function leapProblems(dir: string): Promise<{ locks: number; problems: string[] }> {
  const files = readDisk(dir);
  const problems: string[] = [];
  let locks = 0;
  const { scenes } = new GameSim(files).game;
  for (let scene = 0; scene < scenes.length; scene++) {
    if (!scenes[scene].files[1] || !files.has(scenes[scene].files[1])) continue;
    const sim = new GameSim(files);
    try {
      (sim as unknown as { enter(s: number, p: number, l: number): void }).enter(scene, 0, 0);
    } catch {
      continue;
    }
    const found = locksIn(sim);
    if (!found.length) continue;
    locks += found.length;
    const base = sim.snapshot();
    for (const lock of found) {
      const spots: [number, number][] = [];
      for (let x = Math.max(1, lock.x - REACH); x <= lock.x + REACH; x++)
        for (let y = Math.max(2, lock.y - 14); y <= lock.y + 1; y++)
          if (x !== lock.x && !sim.solidAt(x, y) && !sim.solidAt(x, y - 1) && sim.solidAt(x, y + 1)) spots.push([x, y]);
      let hit: string | undefined;
      for (const [x, y] of spots) {
        if (hit) break;
        const dir = x < lock.x ? 'right' : 'left';
        sim.restore(base);
        // placed as a link into the scene would place him: the view is set round him, too
        startSceneInits(sim.w, { x, y });
        initScroll(sim.w, scenes[scene].scroll);
        if (await leapsOver(sim, lock, dir)) hit ??= `from (${x - 10}, ${y - 10})`;
      }
      if (hit) problems.push(`scene ${scene}: the lock at (${lock.x - 10}, ${lock.y - 10}) can be jumped over ${hit}`);
    }
  }
  return { locks, problems };
}

{
  const args = process.argv.slice(2);
  const ids = args.length ? args : readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'about.json')));
  let bad = 0;
  for (const id of ids) {
    const dir = join(gamesDir, id, 'disk');
    if (!existsSync(dir)) continue;
    const { locks, problems } = await leapProblems(dir);
    for (const p of problems) console.log(`${id}: ${p}`);
    bad += problems.length;
    if (locks && !problems.length) console.log(`${id}: ${locks} lock${locks === 1 ? '' : 's'}, none can be jumped over`);
  }
  console.log(bad ? `${bad} problem${bad === 1 ? '' : 's'}` : 'ok');
  process.exit(bad ? 1 : 0);
}
