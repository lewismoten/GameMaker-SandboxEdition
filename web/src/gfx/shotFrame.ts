// A screenshot that is a real moment of play: a box shot (about.json box.shots) written as
// [map, x, y, { "tick": t }], or a manual's <shot map="…" tick="t">, shows the screen the game
// shows t game ticks (18.2 a second) after its walkthrough first enters the level on that map,
// with the hero, the monsters spawned by then and the blocks' animation. A map render can't
// show a level whose road, traffic and lane marks are all monsters spawned as it plays.
// scripts/shotFrames.ts replays each game's walkthrough on the real engine and draws these
// frames ahead of time into public/frames/ (gfx/frameShot.ts shows them; [map, x, y] stays the
// map view to fall back on, and what every other use of the shot reads).

/** Which moment: game ticks since the walkthrough entered the level (and which scene, when several use the map). */
export interface ShotFrame {
  tick: number;
  scene?: number;
}

/** The frame a box shot asks for (its 4th element), if it asks for one. */
export function shotFrame(shot: readonly unknown[] | undefined): ShotFrame | undefined {
  return asFrame(shot?.[3]);
}

/** A frame spec, if `v` is a valid one: a whole tick of 0 or more, and a whole scene number if given. */
export function asFrame(v: unknown): ShotFrame | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const { tick, scene } = v as { tick?: unknown; scene?: unknown };
  if (typeof tick !== 'number' || !Number.isInteger(tick) || tick < 0) return undefined;
  if (scene === undefined) return { tick };
  return typeof scene === 'number' && Number.isInteger(scene) && scene >= 0 ? { tick, scene } : undefined;
}

/** A frame a game's pictures want: its map, and when. */
export interface WantedFrame extends ShotFrame {
  map: string;
}

/** Where the frame's picture is on the site (public/frames/). */
export function framePath(id: string, { map, tick, scene }: WantedFrame): string {
  const stem = map
    .toLowerCase()
    .replace(/\.map$/, '')
    .replace(/[^a-z0-9_]/g, '_');
  return `frames/${id}-${stem}${scene === undefined ? '' : `-s${scene}`}-${tick}.png`;
}

/** Every frame a game's box shots and manual pages ask for, each once. */
export function wantedFrames(box: { shots?: readonly (readonly unknown[])[] } | undefined, manualHtml: readonly string[] = []): WantedFrame[] {
  const out = new Map<string, WantedFrame>();
  const add = (map: unknown, f: ShotFrame | undefined) => {
    if (typeof map !== 'string' || !map || !f) return;
    const w = { map: map.toLowerCase(), ...f };
    out.set(framePath('', w), w);
  };
  for (const s of box?.shots ?? []) add(s[0], shotFrame(s));
  for (const html of manualHtml)
    for (const [tag] of html.matchAll(/<shot\b[^>]*>/gi)) {
      const attr = (n: string) => new RegExp(`\\b${n}="([^"]*)"`, 'i').exec(tag)?.[1];
      const tick = attr('tick');
      const scene = attr('scene');
      if (tick !== undefined) add(attr('map'), asFrame({ tick: Number(tick), ...(scene !== undefined ? { scene: Number(scene) } : {}) }));
    }
  return [...out.values()];
}
