// The level check's monster checks: crowded screens, enemies much faster than the hero, a
// threat in reach of the start, chasers with no lifetime, monsters the color of the scenery
// (on the scene's own palette), solid monsters that hurt (they hold the hero while they hurt),
// monsters that score or heal every tick, and lifts that make the hero wait.
import { BLEN, MONBL, type Block } from '../../../formats/blocks';
import { CHARBL } from '../../../formats/blocks';
import type { Character } from '../../../formats/character';
import { LASTMON, MAXMARCH, type Monster } from '../../../formats/monster';
import { MLEN } from '../../../formats/map';
import { at, type Finding } from '../findings';
import { linksInto } from '../playtest';
import { contrastRatio, luminance, topColors, type SceneData } from '../sceneData';
import type { Game } from '../../../formats/game';
import { TICK_S, WAIT_TICKS } from './blockChecks';

/** The monster's picture blocks. */
export function pictures(m: Monster): number[] {
  const out: number[] = [];
  for (const [p] of m.pic) {
    if (p >= MONBL || p < 0) break;
    out.push(p);
  }
  return out;
}

export const hostile = (m: Monster | undefined, mbl: Block[]) => !!m && pictures(m).some((p) => mbl[p]?.chHitPt < 0);

/** Pixels a tick the monster moves at its fastest. */
export function monsterSpeed(m: Monster): number {
  if (m.towards >= 64) return m.towards >> 6;
  if (m.towards !== 0) return Math.abs(m.towards);
  let best = 0;
  for (const c of m.march[0]) {
    if (!c.pic) break;
    best = Math.max(best, Math.abs(c.pic));
  }
  return best;
}

/** Ticks one round of the monster's march takes. */
export function marchTicks(m: Monster): number {
  let t = 0;
  let px = 0;
  let py = 0;
  for (let i = 0; i < MAXMARCH; i++) {
    const c = m.march[0][i];
    if (!c.pic) break;
    const d = Math.max(Math.abs(c.x - px), Math.abs(c.y - py)) * BLEN;
    t += Math.ceil(d / Math.abs(c.pic));
    px = c.x;
    py = c.y;
  }
  return t;
}

/** The hero's walking speed: pixels a tick of the fastest sideways move sequence. */
export function heroSpeed(chr: Character): number {
  let best = 0;
  chr.sequences.forEach((s, i) => {
    if (i < 5 || !s.key) return;
    let x = 0;
    let t = 0;
    for (const f of s.frames) {
      if (f.pic2 === CHARBL + 1) break;
      if (f.pic2 === MONBL) continue;
      x += f.x;
      t += Math.max(1, f.pause);
    }
    if (t && !s.momentum) best = Math.max(best, Math.abs(x) / t);
  });
  return best;
}

const placed = (d: SceneData) => d.map.monsters.filter((p) => p.monnum < LASTMON && !!d.mon[p.monnum]);

export function density(d: SceneData): Finding[] {
  const foes = placed(d).filter((p) => hostile(d.mon[p.monnum], d.mbl));
  const out: Finding[] = [];
  const taken: { x: number; y: number }[] = [];
  // every 16 x 10 window (a screen), worst first, not overlapping one already reported
  const windows: { x: number; y: number; n: number }[] = [];
  for (let y = 0; y <= 90; y += 2)
    for (let x = 0; x <= 84; x += 2) {
      const n = foes.filter((p) => p.curx >= x && p.curx < x + 16 && p.cury >= y && p.cury < y + 10).length;
      if (n > 3) windows.push({ x, y, n });
    }
  windows.sort((a, b) => b.n - a.n);
  for (const w of windows) {
    if (taken.some((t) => Math.abs(t.x - w.x) < 16 && Math.abs(t.y - w.y) < 10)) continue;
    taken.push(w);
    out.push({
      check: 'density',
      severity: w.n > 5 ? 'warning' : 'info',
      title: `${w.n} enemies on one screen at ${at(w.y * MLEN + w.x)}`,
      detail: 'Two or three on a screen is a fight; more is noise. Give each a job, or spread them out.',
      where: {
        scene: d.scene,
        map: d.names.map,
        cell: (w.y + 5) * MLEN + w.x + 8,
        cells: foes.filter((p) => p.curx >= w.x && p.curx < w.x + 16 && p.cury >= w.y && p.cury < w.y + 10).map((p) => p.cury * MLEN + p.curx),
      },
    });
    if (out.length >= 5) break;
  }
  return out;
}

export function speed(d: SceneData): Finding[] {
  const hero = heroSpeed(d.chr);
  if (!hero) return [];
  const used = new Set(placed(d).map((p) => p.monnum));
  const out: Finding[] = [];
  for (const n of used) {
    const m = d.mon[n];
    const v = monsterSpeed(m);
    if (!hostile(m, d.mbl) || v <= hero * 1.5) continue;
    const chases = m.towards > 0 && m.towards < 64;
    out.push({
      check: chases && m.end <= 0 ? 'chasers' : 'speed',
      severity: chases ? 'warning' : 'info',
      title: `Monster ${n} moves ${v} px a tick, ${(v / hero).toFixed(1)} times the hero’s ${hero.toFixed(1)}${chases ? ', chasing' : ''}`,
      detail: chases
        ? 'A chaser faster than the hero can’t be outrun. Slow it below the walk, or give it a lifetime.'
        : 'Fine on a straight, easy-to-read path; unfair on a winding one.',
      where: {
        scene: d.scene,
        map: d.names.map,
        monster: { file: d.names.mon ?? '', n },
        cells: placed(d)
          .filter((p) => p.monnum === n)
          .map((p) => p.cury * MLEN + p.curx),
      },
    });
  }
  return out;
}

export function startThreat(d: SceneData, game: Game): Finding[] {
  const foes = placed(d).filter((p) => hostile(d.mon[p.monnum], d.mbl));
  const out: Finding[] = [];
  for (const l of linksInto(game, d.scene)) {
    const near = foes.find((p) => Math.abs(p.curx - l.to.x) <= 3 && Math.abs(p.cury - l.to.y) <= 2);
    if (!near) continue;
    out.push({
      check: 'start-threat',
      severity: 'warning',
      title: `Monster ${near.monnum} starts ${Math.max(Math.abs(near.curx - l.to.x), Math.abs(near.cury - l.to.y))} blocks from where the hero comes in`,
      detail: `The hero enters at ${at(l.to.y * MLEN + l.to.x)}. Give the player a moment before the first threat.`,
      where: { scene: d.scene, map: d.names.map, cell: near.cury * MLEN + near.curx, monster: { file: d.names.mon ?? '', n: near.monnum } },
    });
  }
  return out;
}

/** The lowest contrast between a monster's colors and the scenery round where it is placed. */
export function monsterContrast(d: SceneData, n: number): { ratio: number; cell: number } | undefined {
  const pics = pictures(d.mon[n]);
  if (!pics.length) return undefined;
  const mine = topColors(d.mbl[pics[0]].pixels, 3);
  if (!mine.length) return undefined;
  let worst: { ratio: number; cell: number } | undefined;
  for (const p of placed(d).filter((q) => q.monnum === n)) {
    const behind = topColors(d.bbl[d.map.blocks[p.cury * MLEN + p.curx]].pixels, 1)[0];
    if (behind === undefined) continue;
    const lb = luminance(d.palette, behind);
    // the best its colors do against the scenery: one strong color is enough to see it
    const ratio = Math.max(...mine.map((c) => contrastRatio(luminance(d.palette, c), lb)));
    if (!worst || ratio < worst.ratio) worst = { ratio, cell: p.cury * MLEN + p.curx };
  }
  return worst;
}

export function contrast(d: SceneData): Finding[] {
  const out: Finding[] = [];
  for (const n of new Set(placed(d).map((p) => p.monnum))) {
    if (!hostile(d.mon[n], d.mbl)) continue;
    const c = monsterContrast(d, n);
    if (!c || c.ratio >= 1.8) continue;
    out.push({
      check: 'contrast',
      severity: c.ratio < 1.3 ? 'warning' : 'info',
      title: `Monster ${n} is hard to see against the scenery (contrast ${c.ratio.toFixed(1)} : 1)`,
      detail: `Worst where it is placed at ${at(c.cell)}. A dark or bright outline from the palette makes it stand out.`,
      where: {
        scene: d.scene,
        map: d.names.map,
        cell: c.cell,
        monster: { file: d.names.mon ?? '', n },
        block: { file: d.names.mbl ?? '', n: pictures(d.mon[n])[0] },
      },
      fix: 'outline-monster',
    });
  }
  return out;
}

export function monsterTouches(d: SceneData): Finding[] {
  const out: Finding[] = [];
  for (const n of new Set(placed(d).map((p) => p.monnum))) {
    const m = d.mon[n];
    const blocks = pictures(m).map((p) => d.mbl[p]);
    const cells = placed(d)
      .filter((p) => p.monnum === n)
      .map((p) => p.cury * MLEN + p.curx);
    if (blocks.some((b) => b.solid && b.chHitPt < 0))
      out.push({
        check: 'hurt-lock',
        severity: 'warning',
        title: `Monster ${n} is solid and hurts: it can hold the hero against it while it hurts`,
        detail: 'Make the hurting picture not solid, or give the Hurt sequence frames that move the hero back out of reach.',
        where: { scene: d.scene, map: d.names.map, monster: { file: d.names.mon ?? '', n }, cells },
      });
    // a monster that is never used up by a touch (power 100 or more) gives what it gives every tick
    if (m.power >= 100 && blocks.some((b) => b.scorePts > 0 || b.chHitPt > 0))
      out.push({
        check: 'every-tick',
        severity: 'warning',
        title: `Monster ${n} gives ${blocks.some((b) => b.scorePts > 0) ? 'points' : 'health'} on every tick it touches the hero`,
        detail: 'Its power is 100 or more, so a touch never uses it up. Lower its power, or move the reward to a block.',
        where: { scene: d.scene, map: d.names.map, monster: { file: d.names.mon ?? '', n }, cells },
      });
    if (m.towards === 0 && blocks.some((b) => b.solid)) {
      const t = marchTicks(m);
      if (t > WAIT_TICKS * 2)
        out.push({
          check: 'waits',
          severity: t > WAIT_TICKS * 4 ? 'warning' : 'info',
          title: `Lift monster ${n} takes ${(t * TICK_S).toFixed(1)} s to go round: a hero who just missed it waits that long`,
          detail: 'Speed up its empty legs, or make it wait at the bottom for the hero.',
          where: { scene: d.scene, map: d.names.map, monster: { file: d.names.mon ?? '', n }, cells },
          fix: 'shorten-cycle',
        });
    }
  }
  return out;
}

export const monsterChecks = [density, speed, contrast, monsterTouches];
