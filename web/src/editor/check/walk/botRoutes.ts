// The routes the bot made for one scene alone, for Watch the bot (widgets/watchScene.ts), kept in
// the project's companion file (editor-only, section "botRoutes" of the .gam, by scene). Each
// keeps a fingerprint of what the scene plays with when it was made (sceneHash: the scene's
// files by name and bytes, its links, scroll and game type; moving its box or renaming it
// doesn't count), so the Level check can say the map changed since and offer to make it again.
import type { Project } from '../../core/project';
import type { Game } from '../../../formats/game';
import type { Walkthrough } from '../../../walkthrough/format';

export interface BotRoute {
  when: string;
  walk: Walkthrough;
  /** sceneHash when it was made (routes kept before it was have none). */
  hash?: string;
}

const ROUTES = 'botRoutes';

export const botRoutes = (project: Project): Record<string, BotRoute> => project.extras<Record<string, BotRoute>>(project.gam, ROUTES, {});

/** Keeps a route the bot made for `scene` (replacing any), with the scene's fingerprint now. */
export function keepBotRoute(project: Project, scene: number, walk: Walkthrough, when = new Date().toISOString()): void {
  const route: BotRoute = { when, walk, hash: sceneHash(project.game(), project.files, scene) };
  project.setExtras(project.gam, ROUTES, { ...botRoutes(project), [scene]: route });
}

/** The game's walkthrough (from Make a walkthrough), when it has a route through `scene`. */
export function walkthroughThrough(project: Project, scene: number): Walkthrough | undefined {
  const walk = project.extras<{ walk?: Walkthrough } | undefined>(project.gam, 'walkthrough', undefined)?.walk;
  return walk?.timeline.frames && walk.segments.some((s) => s.scene === scene) ? walk : undefined;
}

/**
 * Where Watch the bot's route comes from: the game's walkthrough, one made for this scene
 * alone (stale when the scene's files changed since it was made), or none yet.
 */
export type RouteState = { from: 'walkthrough' } | { from: 'none' } | { from: 'scene'; when: string; stale: boolean };

export function routeState(project: Project, scene: number): RouteState {
  if (walkthroughThrough(project, scene)) return { from: 'walkthrough' };
  const r = botRoutes(project)[scene];
  if (!r) return { from: 'none' };
  return { from: 'scene', when: r.when, stale: !!r.hash && r.hash !== sceneHash(project.game(), project.files, scene) };
}

/** FNV-1a (32 bits, hex) of what `scene` plays with. */
export function sceneHash(game: Game, files: { get(name: string): Uint8Array | undefined }, scene: number): string {
  const s = game.scenes[scene];
  if (!s) return '';
  let h = 0x811c9dc5;
  const add = (b: Uint8Array) => {
    for (let i = 0; i < b.length; i++) h = Math.imul(h ^ b[i], 0x01000193);
  };
  const enc = new TextEncoder();
  add(enc.encode(JSON.stringify({ t: s.gametype, s: s.scroll, l: s.links.slice(0, s.numLinks), f: s.files.map((f) => f.toLowerCase()) })));
  for (const f of s.files) {
    const b = f ? files.get(f) : undefined;
    add(enc.encode(`|${b?.length ?? -1}|`));
    if (b) add(b);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
