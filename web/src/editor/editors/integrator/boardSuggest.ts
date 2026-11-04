// Groups the integrator can suggest for a game's scenes, for the author to accept or dismiss:
//  - scenes on the same map whose names share a stem ("lila 1", "lila 1 q2"; "Board: stub"), and
//  - pass-through scenes (the hero arrives on one of their own links out) that lead to the same place.
// A suggestion is only a guess from names and links; the tool can't see what the scenes are for.
import { NOSCENE, sceneKind, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { arrival } from './layoutCells';

interface Suggestion {
  /** Stable text for "dismissed". */
  key: string;
  name: string;
  members: number[];
  why: string;
}

const MIN = 3;

/** Where a pass-through scene sends the hero at once, or undefined for a scene that is played. */
function passesTo(game: Game, i: number): number | undefined {
  const s = game.scenes[i];
  if (sceneKind(s) !== 'adventure') return undefined;
  const at = arrival(game, i);
  const l = s.links.find((x) => x.toScene !== NOSCENE && !!game.scenes[x.toScene] && x.from.x === at.x && x.from.y === at.y);
  return l?.toScene;
}

/** The stem of a scene's name: the part before a colon, else the words without trailing numbers ("lila 1 q2" -> "lila"). */
export function stemOf(desc: string): string {
  const colon = desc.indexOf(':');
  if (colon > 0) return desc.slice(0, colon).trim().toLowerCase();
  const words = desc.trim().toLowerCase().split(/\s+/);
  while (words.length > 1 && /^q?\d+$/.test(words[words.length - 1])) words.pop();
  return words.join(' ');
}

const title = (s: string) => s.replace(/(^|[\s-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

/** Suggested groups among `scenes` not already `taken` (in a group) and not in `dismissed`. */
export function suggestGroups(game: Game, scenes: number[], taken: Set<number>, dismissed: string[]): Suggestion[] {
  const out: Suggestion[] = [];
  const claimed = new Set(taken);
  const offer = (name: string, members: number[], why: string, tag: string) => {
    const m = members.filter((i) => !claimed.has(i));
    const key = `${tag}:${m.join(',')}`;
    if (m.length < MIN || dismissed.includes(key)) return;
    m.forEach((i) => claimed.add(i));
    out.push({ key, name, members: m, why });
  };
  const free = scenes.filter((i) => sceneKind(game.scenes[i]) === 'adventure');
  // the same destination first: a run of talk pages or fades is one thing to the player
  const byDest = new Map<number, number[]>();
  for (const i of free) {
    const t = passesTo(game, i);
    if (t !== undefined) byDest.set(t, [...(byDest.get(t) ?? []), i]);
  }
  for (const [t, m] of byDest)
    offer(
      `Leads to ${game.scenes[t].desc || `scene ${t}`}`,
      m,
      `${m.length} pass-through scenes that all lead to ${game.scenes[t].desc || `scene ${t}`}`,
      'pass',
    );
  const byStem = new Map<string, number[]>();
  for (const i of free) {
    const k = `${game.scenes[i].files[1] ?? ''}|${stemOf(game.scenes[i].desc)}`;
    byStem.set(k, [...(byStem.get(k) ?? []), i]);
  }
  for (const [k, m] of byStem)
    offer(title(k.slice(k.indexOf('|') + 1)), m, `${m.length} scenes on the same map with names starting "${k.slice(k.indexOf('|') + 1)}"`, 'name');
  return out;
}
