// The level check's findings from playing (playtest.ts): stuck areas, things nobody reached,
// links never touched, falls the player can't see, hurts that hold, scoring that never stops,
// how much of each scene the bot covered, long scenes, and the hit points at each exit.
import { prizeInView, seenFrom } from './inView';
import { BACKBL } from '../../../formats/blocks';
import { LASTMON } from '../../../formats/monster';
import { MLEN } from '../../../formats/map';
import { at, type Finding } from '../findings';
import type { Incident } from '../explore';
import type { SceneRun } from '../playtest';
import type { SceneData } from '../sceneData';
import { hostile } from './monsterChecks';

/** A block the hero would want to touch: it gives something, or can be picked up. */
export function isPickup(d: SceneData, n: number): boolean {
  const b = d.bbl[n];
  return n < BACKBL && !b.solid && (b.obj !== 0 || b.scorePts > 0 || b.chHitPt > 0 || (b.effect > 0 && b.eamt > 0));
}

const REASON = {
  pit: 'a pit with no way out',
  drop: 'a drop the hero can’t climb back up',
  lock: 'beside a lock the hero can’t open from here',
  unknown: 'an area with no way on',
};

export function playFindings(run: SceneRun, d: SceneData | undefined): Finding[] {
  const out: Finding[] = [];
  const ex = run.ex;
  const where = { scene: run.scene, map: d?.names.map };
  for (const a of run.stuck)
    out.push({
      check: 'stuck',
      severity: 'error',
      title: `The hero can get stuck at ${at(a.cells[0])}: ${REASON[a.reason]}`,
      detail: `${a.cells.length} resting place${a.cells.length === 1 ? '' : 's'} there lead to no exit and no link back${a.at !== undefined ? `; the way in is at ${at(a.at)}` : ''}.`,
      where: { ...where, cell: a.cells[0], cells: a.cells },
      fix: a.reason === 'lock' ? 'open-gap' : 'ladder',
    });
  const sure = ex.complete;
  if (d) {
    // pickups never touched, grouped by block
    const missed = new Map<number, number[]>();
    d.map.blocks.forEach((n, i) => {
      if (isPickup(d, n) && !ex.heat[i]) missed.set(n, [...(missed.get(n) ?? []), i]);
    });
    for (const [n, all] of missed) {
      // in plain view of where the hero went, after trying everything: a tease
      const shown = new Set(sure ? seenFrom(all, (c) => !!ex.heat[c]) : []);
      if (shown.size) out.push(prizeInView(d, n, [...shown], 'never reached'));
      const cells = all.filter((c) => !shown.has(c));
      if (!cells.length) continue;
      out.push({
        check: 'unreachable',
        severity: sure ? 'warning' : 'info',
        title: `${cells.length} of block ${n} ${cells.length === 1 ? 'was' : 'were'} never reached, first at ${at(cells[0])}`,
        detail: sure
          ? 'The bot tried every move from everywhere it could stand.'
          : 'The bot ran out of time before trying everything; play there to make sure.',
        where: { ...where, cell: cells[0], cells, block: { file: d.names.bbl ?? '', n } },
      });
    }
    // placed monsters never come near, the friendly ones (they give something) above all
    const far = d.map.monsters.flatMap((p, slot) => (p.monnum < LASTMON && d.mon[p.monnum] && !ex.monsters.has(slot) ? [p] : []));
    const friendly = far.filter((p) => !hostile(d.mon[p.monnum], d.mbl));
    if (friendly.length)
      out.push({
        check: 'unreachable',
        severity: sure ? 'warning' : 'info',
        title: `${friendly.length} friendly or prize monster${friendly.length === 1 ? ' was' : 's were'} never reached, first at ${at(friendly[0].cury * MLEN + friendly[0].curx)}`,
        where: { ...where, cell: friendly[0].cury * MLEN + friendly[0].curx, cells: friendly.map((p) => p.cury * MLEN + p.curx) },
      });
    const foes = far.length - friendly.length;
    if (foes > 2)
      out.push({
        check: 'unreachable',
        severity: 'info',
        title: `${foes} enemies are where the hero never goes`,
        detail: 'If nobody is meant to meet them, they could go; if they guard a secret, keep them.',
        where: { ...where, cells: far.filter((p) => hostile(d.mon[p.monnum], d.mbl)).map((p) => p.cury * MLEN + p.curx) },
      });
  }
  // links whose cell the hero never touched
  ex.links.forEach((l, k) => {
    if (l.toScene === 0xffff || ex.heat[l.from.y * MLEN + l.from.x]) return;
    out.push({
      check: 'link-unreached',
      severity: sure ? 'warning' : 'info',
      title: `Link ${k + 1} at ${at(l.from.y * MLEN + l.from.x)} was never reached`,
      detail: 'Fine if it is a way back the bot never needed; a door to nowhere if not.',
      where: { ...where, cell: l.from.y * MLEN + l.from.x },
    });
  });
  const groups = new Map<string, Incident[]>();
  for (const i of ex.incidents) {
    if (i.kind === 'death') continue;
    // falls landing within a few blocks of each other are one finding
    // one finding per thing that did it; falls without a culprit, per stretch of the map
    const k = i.source ? `${i.kind}:${i.source}` : `${i.kind}:${Math.floor((i.cell % MLEN) / 8)}:${Math.floor(i.cell / MLEN / 5)}`;
    groups.set(k, [...(groups.get(k) ?? []), i]);
  }
  const KIND = {
    'blind-drop': 'blind-drop',
    'hazard-landing': 'hazard-landing',
    'hurt-lock': 'hurt-lock',
    'every-tick-score': 'every-tick',
    'every-tick-heal': 'every-tick',
  } as const;
  for (const list of groups.values()) {
    const i = list[0];
    const check = KIND[i.kind as keyof typeof KIND];
    out.push({
      check,
      severity: check === 'blind-drop' ? 'info' : 'warning',
      title: `${i.detail} at ${at(i.cell)}${i.source ? ` (${i.source})` : ''}`,
      detail: list.length > 1 ? `And ${list.length - 1} more like it${i.source ? '' : ' nearby'}.` : undefined,
      where: { ...where, cell: i.cell, cells: list.map((l) => l.cell) },
    });
  }
  const minutes = Math.min(...ex.exits.map((e) => e.tick)) / 18.2 / 60;
  if (Number.isFinite(minutes) && minutes > 3)
    out.push({
      check: 'checkpoints',
      severity: 'info',
      title: `Even the bot’s quickest way through takes ${minutes.toFixed(1)} minutes`,
      detail: 'A death starts the scene over. If it isn’t meant as one long run, a link partway splits it, so the player keeps what they earned.',
      where,
    });
  if (!ex.complete)
    out.push({
      check: 'coverage',
      severity: 'info',
      title: `The bot ran out of time after ${ex.places.length} places (${(ex.ms / 1000).toFixed(0)} s)`,
      detail: 'Stuck spots are only reported where every move was tried; run a longer check for the rest.',
      where,
    });
  if (!ex.exits.length && d)
    out.push({
      check: 'link-unreached',
      severity: ex.complete ? 'error' : 'warning',
      title: ex.complete ? 'The bot found no way out of this scene' : 'The bot didn’t find a way out in the time it had',
      where,
    });
  return out;
}

/** Hit points at each scene's best exit, in play order: a curve that only climbs is too kind. */
export function curve(runs: SceneRun[]): Finding[] {
  const hp = runs.map((r) => Math.max(...r.ex.exits.map((e) => e.hp))).filter(Number.isFinite);
  if (hp.length < 3) return [];
  const rises = hp.every((v, i) => i === 0 || v >= hp[i - 1]) && hp[hp.length - 1] > hp[0];
  if (!rises) return [];
  return [
    {
      check: 'curve',
      severity: 'warning',
      title: `The bot finishes each scene with more hit points than the last (${hp.join(' → ')})`,
      detail:
        'Healing outpaces harm, so the game gets easier as it goes. If that isn’t the plan, spread healing where the hard parts end, and less of it late.',
      where: {},
      fix: 'spread-healing',
    },
  ];
}
