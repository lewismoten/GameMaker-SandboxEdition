// The integrator's links read as places on the maps, for the map editor's markers and the
// shell's Play Level menu. As PLAYGAME.C plays them: a level's link fires when the hero
// touches its From block on that level's map (chklnk tries links 0..19 in order, so of two
// links on one block the lower one always wins), and the hero arrives at its To block on the
// linked scene's map. A start scene has no map: play(0) follows scene 0's link 0 only, so
// that one link is where the game starts. A link to scene 1 wins the game; nothing links to
// "lost" (that is running out of lives, MAXSCENELINKS+2 in engine/game.ts).
import { ADVTYPE, MAXSCENELINKS, NOSCENE, STARTTYPE, type Game, type Point } from '../../../formats/game';

/** A way into a level: link `link` of scene `from` lands the hero at `at` in scene `to`. */
export interface WayIn {
  from: number;
  link: number;
  to: number;
  at: Point;
}

/** A way out of a level: touching `at` in scene `scene` follows its link `link` to scene `to`. */
export interface Exit {
  scene: number;
  link: number;
  at: Point;
  to: number;
  /** Where the hero arrives in `to` (meaningless for the won scene). */
  toAt: Point;
  /** 'won' for scene 1; 'odd' for a scene that isn't a level (play would not go on there). */
  ending?: 'won' | 'odd';
  /** An earlier link of the same scene on the same block, which always fires first. */
  shadowedBy?: number;
}

const isLevel = (game: Game, i: number) => game.scenes[i]?.gametype === ADVTYPE;

/** The links play can follow out of a scene: all of a level's, only link 0 of the start scene 0. */
function liveLinks(game: Game, i: number): number[] {
  const s = game.scenes[i];
  if (!s) return [];
  const n = i === 0 && s.gametype === STARTTYPE ? 1 : s.gametype === ADVTYPE ? MAXSCENELINKS : 0;
  const out: number[] = [];
  for (let l = 0; l < n && l < s.links.length; l++) if (s.links[l].toScene !== NOSCENE) out.push(l);
  return out;
}

/** Every way into a level, scene by scene and link by link (the start first). */
export function waysIn(game: Game): WayIn[] {
  const out: WayIn[] = [];
  game.scenes.forEach((s, i) => {
    for (const l of liveLinks(game, i)) {
      const link = s.links[l];
      if (isLevel(game, link.toScene)) out.push({ from: i, link: l, to: link.toScene, at: { ...link.to } });
    }
  });
  return out;
}

/** The ways into these scenes (the scenes that play one map). */
export function waysInto(game: Game, scenes: readonly number[]): WayIn[] {
  return waysIn(game).filter((w) => scenes.includes(w.to));
}

/** The ways out of these scenes, with the endings and the links a lower one hides. */
export function exitsOf(game: Game, scenes: readonly number[]): Exit[] {
  const out: Exit[] = [];
  for (const i of scenes) {
    if (!isLevel(game, i)) continue;
    const s = game.scenes[i];
    for (const l of liveLinks(game, i)) {
      const link = s.links[l];
      const first = s.links.findIndex((o, k) => k < l && o.toScene !== NOSCENE && o.from.x === link.from.x && o.from.y === link.from.y);
      out.push({
        scene: i,
        link: l,
        at: { ...link.from },
        to: link.toScene,
        toAt: { ...link.to },
        ending: link.toScene === 1 ? 'won' : isLevel(game, link.toScene) ? undefined : 'odd',
        shadowedBy: first >= 0 ? first : undefined,
      });
    }
  }
  return out;
}

/** A scene's name as the editor shows it: its description, else "Scene n"; scene 1 is "Game won". */
export function sceneName(game: Game, i: number): string {
  if (i === 1 && !isLevel(game, 1)) return 'Game won';
  return game.scenes[i]?.desc.trim() || `Scene ${i}`;
}

/** Where a way in comes from: "the title", "Level 1's exit", or "Level 1's exit 2" when the level has several. */
export function sourceName(game: Game, w: Pick<WayIn, 'from' | 'link'>): string {
  if (w.from === 0 && game.scenes[0]?.gametype === STARTTYPE) return 'the title';
  const several = liveLinks(game, w.from).length > 1;
  return `${sceneName(game, w.from)}’s exit${several ? ` ${w.link + 1}` : ''}`;
}

/** "Level 2 at 40,12, from Level 1's exit": one entry of the Play Level menu. */
export function wayInLabel(game: Game, w: WayIn): string {
  return `${sceneName(game, w.to)} at ${w.at.x},${w.at.y}, from ${sourceName(game, w)}`;
}
