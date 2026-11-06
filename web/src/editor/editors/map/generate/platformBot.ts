// A bot that plays one generated side view on the real engine (no DOM). The generator's reach model (the hero's
// jump arcs, platformReach.ts) plans a route from the proposed entry to the exit, through the key first when there is
// a locked door; this bot presses the hero's own keys for it, tick by tick, on the level check's scene sim (the real
// engine, the real blocks, the real character) and looks at where he really ends up after every move. It wins when the
// exit link is taken. So "the bot won" tests the jump math against the engine, with a route the model chose: it is
// not the walkthrough bot's own search, and it says nothing about fun, fairness or monsters (they are not played).
import { ADVTYPE, emptyScene, newGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LADDER_CELL, heroPhysics, reachFrom, type GenResult, type HeroPhysics, type Step } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { SceneSim, startCharInfo, type FileSource } from '../../../check/sim';

export interface BotJob {
  /** The project's files (the block set, monster blocks, character and its blocks). */
  files: FileSource;
  /** Their names; a blank one is left out. */
  names: { bbl: string; mbl?: string; chr: string; cbl?: string };
  /** The whole map's blocks as they would be, with the result placed in it. */
  blocks: Uint8Array;
  result: GenResult;
}

export interface BotRun {
  won: boolean;
  /** When not won: what went wrong, in plain words. */
  why?: string;
  ticks: number;
}

const MAX_TICKS = 6000;

class Lost extends Error {}

/** Plays the layout from its entry and says whether the hero took the exit. */
export async function botPlays(job: BotJob): Promise<BotRun> {
  const { result: r } = job;
  const chrBytes = job.files.get(job.names.chr);
  if (!chrBytes) return { won: false, why: 'The character file is missing.', ticks: 0 };
  const hp = heroPhysics(parseCharacter(chrBytes));
  if (!hp.ok) return { won: false, why: hp.message, ticks: 0 };
  const p: HeroPhysics = hp.physics;
  const area = { w: r.rect.w, h: r.rect.h, cells: r.kinds };
  // the route: to the key first (the door shut), then on to the exit
  const legs: { steps: Step[]; to: number; open: boolean }[] = [];
  const key = r.locks[0]?.key;
  let from = r.entry;
  if (key !== undefined) {
    const k = reachFrom(area, p, from, false, { goal: key, route: true });
    const steps = k.routeTo(key);
    if (!steps) return { won: false, why: 'The model found no way to the key.', ticks: 0 };
    legs.push({ steps, to: key, open: false });
    from = key;
  }
  const e = reachFrom(area, p, from, true, { goal: r.exit, route: true });
  const steps = e.routeTo(r.exit);
  if (!steps) return { won: false, why: 'The model found no way to the exit.', ticks: 0 };
  legs.push({ steps, to: r.exit, open: true });

  const map = newMap();
  map.blocks.set(job.blocks);
  const at = (i: number) => ({ x: r.rect.x + (i % r.rect.w), y: r.rect.y + Math.floor(i / r.rect.w) });
  const entry = at(r.entry),
    exit = at(r.exit);
  const game = newGame('Layout');
  const scene = emptyScene(ADVTYPE);
  scene.desc = 'Layout';
  const n = job.names;
  scene.files = ['', 'layout.map', n.bbl, '', n.mbl ?? '', n.chr, n.cbl ?? '', ...new Array(13).fill('')];
  scene.links[0] = { toScene: 1, from: exit, to: { x: 0, y: 0 } };
  game.scenes.push(scene);
  game.scenes[0].links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: entry };
  const mapBytes = serializeMap(map);
  const files: FileSource = { get: (name) => (name.toLowerCase() === 'layout.map' ? mapBytes : job.files.get(name)) };
  const sim = new SceneSim(game, 2, files, entry, startCharInfo(), 1);
  let ticks = 0;
  let won = false;
  const tick = async () => {
    if (++ticks > MAX_TICKS) throw new Lost('The route took too long.');
    const res = await sim.tick();
    if (res === 'dead' || sim.w.chr.cseq === 1) throw new Lost('The hero died on the way.');
    if (res && typeof res === 'object') won = true;
  };
  const px = () => ({ X: sim.w.chr.x[0] * BLEN + sim.w.chr.x[1] - r.rect.x * BLEN, Y: sim.w.chr.y[0] * BLEN + sim.w.chr.y[1] - r.rect.y * BLEN });
  const keyFor = (dir: -1 | 1) => (dir === 1 ? p.keys.right : p.keys.left);
  /** Lets go of everything and waits until he stops moving. */
  const rest = async () => {
    sim.hold([]);
    let still = 0,
      last = px();
    for (let i = 0; i < 60 && still < 3; i++) {
      await tick();
      const now = px();
      still = now.X === last.X && now.Y === last.Y ? still + 1 : 0;
      last = now;
    }
  };
  /** Walks to X (within a few pixels), as the hero would, letting go the moment he is there. */
  const walkTo = async (X: number, tolerance = 2) => {
    for (let i = 0; i < 400; i++) {
      const d = X - px().X;
      if (Math.abs(d) <= tolerance) break;
      const dir = d > 0 ? 1 : -1;
      const k = keyFor(dir);
      if (k === undefined) throw new Lost('He has no key to walk that way.');
      sim.hold([k]);
      await tick();
    }
    await rest();
    if (Math.abs(px().X - X) > 12) throw new Lost(`He could not be stopped at ${X} px (at ${px().X}).`);
  };
  try {
    for (let i = 0; i < 6; i++) await tick();
    for (const leg of legs) {
      for (let s = 0; s < leg.steps.length && !won; s++) {
        const st = leg.steps[s];
        if (st.kind === 'walk') {
          await walkTo(st.to.X, 0);
        } else if (st.kind === 'climb') {
          const up = st.to.row < st.from.row;
          const k = up ? p.keys.up : p.keys.down;
          if (k === undefined) throw new Lost('He has no key to climb.');
          for (let i = 0; i < 200 && Math.round(px().Y / BLEN) !== st.to.row; i++) {
            sim.hold([k]);
            await tick();
          }
          await rest();
        } else {
          await walkTo(st.kind === 'jump' ? st.from.X : st.startX, 0);
          const k = st.dir ? keyFor(st.dir) : undefined;
          if (st.dir && k === undefined) throw new Lost('He has no key to steer that way.');
          if (st.kind === 'jump') sim.hold(k === undefined ? [p.keys.jump] : [k, p.keys.jump]);
          else sim.hold(k === undefined ? [] : [k]);
          let last = px(),
            still = 0;
          for (let t = 0; t < 90; t++) {
            await tick();
            if (won) break;
            sim.hold(k !== undefined && t + 1 <= st.steerTicks ? [k] : []);
            const now = px();
            if (t > 3 && now.Y === st.to.row * BLEN && sim.w.ci.gravy === 0) break;
            still = now.Y === last.Y && now.X === last.X && sim.w.ci.gravy === 0 ? still + 1 : 0;
            if (t > 3 && still >= 3) break;
            last = now;
          }
          await rest();
          const at2 = px();
          const onLadder = area.cells[st.to.row * area.w + Math.floor((st.to.X + BLEN / 2) / BLEN)] === LADDER_CELL;
          if (Math.abs(at2.X - st.to.X) > 12 || Math.abs(at2.Y - st.to.row * BLEN) > (onLadder ? BLEN / 2 : 2))
            throw new Lost(
              `A ${st.kind} from ${st.from.X} px did not land where the model said (${at2.X} px, row ${Math.round(at2.Y / BLEN)} instead of ${st.to.X} px, row ${st.to.row}).`,
            );
        }
      }
      if (!won) {
        // standing on the leg's goal cell: the key is picked up by touching it; walk the last bit if needed
        await rest();
      }
    }
    for (let i = 0; i < 20 && !won; i++) await tick();
    return won ? { won, ticks } : { won, why: 'He followed the route but did not take the exit.', ticks };
  } catch (e) {
    if (e instanceof Lost) return won ? { won, ticks } : { won, why: e.message, ticks };
    throw e;
  }
}
