// The level check still finds the real bugs it found in the Sandbox games, on their disks from
// before each fix (read with git: gitDisk.ts), and not on the fixed ones. Skipped where git or
// those commits aren't there (CI's shallow clone).
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { landings } from './checks/landings';
import { playFindings } from './checks/playChecks';
import { sealed } from './checks/sealed';
import { explore } from './explore';
import { diskAt } from './gitDisk';
import { gameOf } from './playtest';
import { linksInto } from './sceneLinks';
import { scenesOf } from './sceneData';
import { SceneSim, startCharInfo } from './sim';

const has = !!diskAt('reckoning', '98bb901b');

/** A game's files, parsed game and level scenes at a commit. */
function at(id: string, rev: string) {
  const files = new GameFiles(diskAt(id, rev));
  const game = gameOf(files);
  return { files, game, scenes: scenesOf(game, files) };
}

/** Lets the test worker answer vitest between long probes (they never wait on a timer). */
const breathe = () => new Promise((r) => setTimeout(r, 0));

const SINK = 'Landing on';
const PUSH = 'pushes the hero inside';

/** The landings probe's findings of a kind in one scene (by default, sinks and pushes): their monsters. */
async function sinks(id: string, rev: string, scene: number, kind?: string): Promise<number[]> {
  const g = at(id, rev);
  const d = g.scenes.find((s) => s.scene === scene)!;
  const f = await landings(d, g.game, g.files);
  await breathe();
  return f.filter((x) => (kind ? x.title.includes(kind) : !x.title.includes('holds'))).map((x) => x.where.monster!.n);
}

/** The landings probe's sinks and pushes over every scene of a game: "scene:monster" pairs. */
async function allSinks(id: string, rev: string): Promise<string[]> {
  const g = at(id, rev);
  const out: string[] = [];
  for (const d of g.scenes) {
    for (const f of await landings(d, g.game, g.files)) if (!f.title.includes('holds')) out.push(`${d.scene}:${f.where.monster!.n}`);
    await breathe();
  }
  return out;
}

/** Explores a scene from where the hero is put down (a cell), until the first link he takes. */
async function exploreFrom(id: string, rev: string, scene: number, x: number, y: number, budgetMs: number) {
  const g = at(id, rev);
  const into = linksInto(g.game, scene);
  const from = into.find((l) => l.scene !== scene) ?? into[0];
  const sim = new SceneSim(g.game, scene, g.files, from.to);
  sim.place(x, y);
  const entry = { start: from.to, ci: startCharInfo(), clock: 1 };
  const ex = await explore(g.game, scene, g.files, entry, { start: sim.snapshot(), budgetMs, stopAt: () => true });
  return { g, ex };
}

describe.skipIf(!has)('the level check on the Sandbox games’ old bugs', () => {
  it('finds Teddy 2’s Midway softlock behind THE BIG DROP (d3701bd9), gone at 128c0619', async () => {
    // a dog who dropped off the deck past the entry card lands beyond the tower's far wall
    const old = await exploreFrom('teddy2', 'd3701bd9', 8, 58, 39, 20_000);
    expect(old.ex.complete).toBe(true);
    expect(old.ex.exits).toHaveLength(0);
    const run = {
      scene: 8,
      name: 'Midway',
      from: { scene: -1, link: -1 },
      ex: old.ex,
      stuck: [],
      hpIn: 100,
      entry: { start: { x: 58, y: 39 }, ci: startCharInfo(), clock: 1 },
    };
    expect(
      playFindings(
        run,
        old.g.scenes.find((s) => s.scene === 8),
      ).some((f) => f.severity === 'error' && f.check === 'link-unreached'),
    ).toBe(true);
    const fixed = await exploreFrom('teddy2', '128c0619', 8, 58, 39, 20_000);
    expect(fixed.ex.exits.length).toBeGreaterThan(0);
  }, 60_000);

  it('finds Loaf’s brook that held the loaf while it bit (before 298c8e05), gone after', async () => {
    const brook = async (rev: string) => {
      // a loaf that slipped into the water between the stepping stones
      const { ex } = await exploreFrom('loaf', rev, 5, 25, 13, 6_000);
      return ex.incidents.filter((i) => i.kind === 'hurt-lock' && /^block (63|64)$/.test(i.source ?? ''));
    };
    expect((await brook('298c8e05^')).length).toBeGreaterThan(0);
    expect(await brook('298c8e05')).toHaveLength(0);
  }, 60_000);

  it('finds Loaf’s walkers that sank the loaf into the ground (before cbed1c34), and no sinks after', async () => {
    // (cbed1c34 left them solid at the sides, and where they walk up to a wall that still
    // pushes the loaf inside it: a push, not a sink)
    expect(await sinks('loaf', 'cbed1c34^', 3)).toContain(9);
    expect(await sinks('loaf', 'cbed1c34', 3, SINK)).toHaveLength(0);
  });

  it('finds Maximus’s sealed wreck credits (before 108d6102), gone after', () => {
    const lost = (rev: string) => {
      const g = at('maximus', rev);
      const d = g.scenes.find((s) => s.scene === 48)!;
      return sealed(d, g.game, g.scenes);
    };
    expect(lost('65866979').length).toBeGreaterThan(0);
    expect(lost('f7e213bb')).toHaveLength(0);
  }, 60_000);

  it('finds wave 8b’s sinks before their fixes, and not after', async () => {
    // (the others wave 8b fixed, reckoning 98bb901b, risi 0534d938 and sweats 7875f630, were
    // sinks only while the port's DrawScroll skipped drawchars' bookkeeping: the hero's screen
    // row went stale during a scroll and ChkMonChr lifted him from the wrong side. PLAYGAME
    // never sank him there, so the probe finds nothing on those disks now.)
    const cases: [string, string, number, number[]][] = [['tickle', '0562f9dc', 3, [15, 16]]];
    for (const [id, rev, scene, mons] of cases) {
      const before = await sinks(id, `${rev}^`, scene);
      const after = await sinks(id, rev, scene, SINK);
      for (const n of mons) {
        expect(before, `${id} scene ${scene} monster ${n} before ${rev}`).toContain(n);
        expect(after, `${id} scene ${scene} monster ${n} at ${rev}`).not.toContain(n);
      }
    }
  }, 60_000);

  it('finds wave 15’s sinks and pushes before their fixes, and none after', async () => {
    // (as in wave 8b, the rest of wave 15's finds, in needle, tickle, mustard, risi and sweats,
    // came from the port's stale screen row during a scroll and are gone under the DOS-true one)
    const cases: [string, string, string[]][] = [
      ['needle', '86c66e09', ['4:14']],
      ['risi', '41424d6e', ['4:17']],
    ];
    for (const [id, rev, found] of cases) {
      const before = await allSinks(id, `${rev}^`);
      for (const k of found) expect(before, `${id} scene:monster ${k} before ${rev}`).toContain(k);
      const after = await allSinks(id, rev);
      for (const k of found) expect(after, `${id} scene:monster ${k} at ${rev}`).not.toContain(k);
    }
    // the rooftop pigeon's was a push: walking up against the chimney, it shoved Marcus inside
    expect(await sinks('risi', '41424d6e^', 4, PUSH)).toContain(17);
  }, 120_000);
});
