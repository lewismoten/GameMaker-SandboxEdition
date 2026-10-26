// The level check's hero-at-the-start checks: starting values a later character sets that
// PLAYGAME never reads (it takes hit points, lives, counters and the inventory from the first
// scene's character only, engine/scene.ts startSceneInits), and an Idle with no frames, which
// PLAYGAME stands in for with character block 0 (engine/character.ts).
import { CHARBL } from '../../../formats/blocks';
import { IDLESEQ, MAXSEQ, frameCount, type Character } from '../../../formats/character';
import { NOSCENE, type Game } from '../../../formats/game';
import type { Finding } from '../findings';
import type { SceneData } from '../sceneData';

/** What PLAYGAME takes from the first character: [label, value] pairs. */
function startOf(chr: Character): [string, string][] {
  const counters = chr.meter.slice(MAXSEQ, MAXSEQ + 10).map((v, i) => [`counter ${i}`, String(v - 1)] as [string, string]);
  const inv = [...chr.inv].filter((b) => b < 150).sort((a, b) => a - b);
  return [['hit points', String(chr.meter[0])], ['lives', String(chr.meter[1])], ...counters, ['inventory', inv.length ? `blocks ${inv.join(', ')}` : 'empty']];
}

/** The level scene play starts in: scene 0's first link. */
export function firstScene(game: Game, scenes: SceneData[]): SceneData | undefined {
  const to = game.scenes[0]?.links[0]?.toScene;
  return scenes.find((s) => s.scene === to) ?? (to === NOSCENE || to === undefined ? scenes[0] : undefined);
}

/**
 * Characters whose starting hit points, lives, counters or inventory differ from the first
 * scene's: PLAYGAME ignores them. A choice of heroes (a scene linking to scenes with different
 * characters) that differ only there is a warning, since the choice does less than it says.
 */
export function startValues(game: Game, scenes: SceneData[]): Finding[] {
  const first = firstScene(game, scenes);
  if (!first?.names.chr) return [];
  const base = new Map(startOf(first.chr));
  // scenes another scene chooses between, by character
  const choices = new Set<number>();
  for (const s of game.scenes) {
    const to = scenes.filter((d) => s.links.some((l) => l.toScene === d.scene));
    if (new Set(to.map((d) => d.names.chr?.toLowerCase())).size > 1) to.forEach((d) => choices.add(d.scene));
  }
  const out: Finding[] = [];
  const seen = new Set<string>([first.names.chr.toLowerCase()]);
  for (const d of scenes) {
    const chr = d.names.chr?.toLowerCase();
    if (!chr || seen.has(chr)) continue;
    seen.add(chr);
    const diff = startOf(d.chr).filter(([k, v]) => base.get(k) !== v);
    if (!diff.length) continue;
    const pick = choices.has(d.scene);
    out.push({
      check: 'start-values',
      severity: pick ? 'warning' : 'info',
      title: `${d.names.chr} starts with ${diff.map(([k, v]) => `${k} ${v}`).join(', ')}, which PLAYGAME ignores`,
      detail: `Only the first scene’s character (${first.names.chr}: ${diff.map(([k]) => `${k} ${base.get(k)}`).join(', ')}) sets the starting values; later characters keep what the player has. ${
        pick
          ? 'This character is one of a choice of heroes, so the choice changes less than it seems: make heroes differ in speed, jump, weapons or reach instead, or give the difference at the start of its first scene (a block that heals or adds to a counter).'
          : 'Fine if nothing depends on it; to change them mid-game, use blocks that heal, hurt or add to a counter.'
      }`,
      where: { scene: d.scene, file: d.names.chr },
    });
  }
  return out;
}

/** An Idle sequence with no frames: standing still, the hero is character block 0 alone. */
export function blankIdle(d: SceneData): Finding[] {
  const s = d.chr.sequences[IDLESEQ];
  if (frameCount(s) > 0 && s.frames[0].pic2 !== CHARBL + 1) return [];
  const empty = !d.cbl[0]?.pixels.some((p) => p !== 255);
  return [
    {
      check: 'blank-idle',
      severity: empty ? 'warning' : 'info',
      title: `The hero has no Idle frames, so standing still shows character block 0${empty ? ', which is empty: the hero vanishes' : ' alone'}`,
      detail: 'Give the Idle sequence a frame with the hero’s standing pictures (top and bottom).',
      where: { scene: d.scene, file: d.names.chr },
    },
  ];
}
