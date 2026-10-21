// A hosted game that starts before all its files are in: the .gam first, then the files in
// the order play needs them (the title and menu, the first level, the scenes reachable
// from it, the rest), with the next ones fetched while the current scene plays. The game
// reads its files synchronously (GameFiles); where the engine is about to read one (a
// picture, a song, a scene's files) it asks for it first and waits if it is still on its
// way (engine/machine.ts, need), which moves it to the front of the queue.
import { GameFiles, cdName, fetchSiteFile, normalize, type CatalogEntry, type FileStream } from './files';
import { parseGame } from '../formats/game';
import { parseSoundSet } from '../formats/sound';
import { parseBackdrop, parseSlideList } from '../formats/graphicScripts';

// Scene file slots (engine/game.ts, engine/scene.ts): scene 0 holds the front end, scene 1
// "Game Won"; a level's 9 and 10 are the pictures shown before and after it.
const TITLE = [1, 0, 3, 2]; // title song and picture, menu song and screen
const FRONT_REST = [11, 6, 4, 5, 7, 8, 9, 10]; // demo, instructions, storyline (and song), credits, high scores, load/save
const LEVEL = [9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10];
const WON = [1, 0, 3, 2];

/**
 * The game's files in the order play first needs them: the .gam, the title and menu, the
 * first level, the rest of the front end, the levels in the order their links reach them,
 * Game Won, and then everything else. Names are the catalog's (`names`), each once.
 */
export function playOrder(gamName: string, gam: Uint8Array | undefined, names: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (name: string | undefined) => {
    const n = name ? resolveName(names, name) : undefined;
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };
  add(gamName);
  let game: ReturnType<typeof parseGame> | undefined;
  try {
    game = gam ? parseGame(gam) : undefined;
  } catch {
    game = undefined;
  }
  if (game) {
    const scenes = game.scenes;
    const slots = (scene: number, list: number[]) => list.forEach((i) => add(scenes[scene]?.files[i]));
    slots(0, TITLE);
    // levels breadth first from where play starts (scene 0's links)
    const queue: number[] = [];
    const queued = new Set<number>([0, 1]);
    const reach = (scene: number) =>
      scenes[scene]?.links.forEach((l) => {
        if (l.toScene < scenes.length && !queued.has(l.toScene)) {
          queued.add(l.toScene);
          queue.push(l.toScene);
        }
      });
    reach(0);
    for (let i = 0; i < queue.length; i++) {
      slots(queue[i], LEVEL);
      if (i === 0) slots(0, FRONT_REST);
      reach(queue[i]);
    }
    slots(0, FRONT_REST);
    slots(1, WON);
    add(`${gamName.replace(/\.[^.]*$/, '')}.his`);
    add('gmhelp.txt');
  }
  for (const n of names) add(n);
  return out;
}

/** The catalog name a game's reference opens (A-J.BKD finds the CD's a_j.bkd), if it has one. */
function resolveName(names: string[], name: string): string | undefined {
  const n = normalize(name);
  if (names.includes(n)) return n;
  const c = cdName(name);
  return names.includes(c) ? c : undefined;
}

/** Files a file names in turn, wanted right after it: a slide list's pictures, a backdrop's GIF, a sound set's samples. */
export function filesNamedBy(name: string, bytes: Uint8Array): string[] {
  try {
    if (/\.lst$/i.test(name)) return parseSlideList(bytes).map((e) => e.name);
    if (/\.bkd$/i.test(name)) return [parseBackdrop(bytes).gif];
    if (/\.snd$/i.test(name))
      return parseSoundSet(bytes)
        .digital.filter((d) => d && d[0] !== ' ')
        .map((d) => `${d}.voc`);
  } catch {
    /* not readable: nothing to add */
  }
  return [];
}

export interface StreamedGame {
  files: GameFiles;
  /** The .gam is in: the game can be shown (its other files keep coming). */
  started: Promise<void>;
  /** Every file is in (or failed). */
  done: Promise<void>;
}

/**
 * Starts fetching a hosted game's files, a few at a time, most needed first. `files` fills
 * as they arrive; until the last is in, `files.stream` lets the engine wait for one.
 */
export function streamHostedGame(entry: CatalogEntry, base = './', concurrency = 4): StreamedGame {
  const files = new GameFiles();
  const names = entry.files;
  const waiting = new Map<string, { promise: Promise<void>; resolve: () => void }>();
  for (const n of names) {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    waiting.set(n, { promise, resolve });
  }
  let queue: string[] = entry.gam && names.includes(entry.gam) ? [entry.gam] : [...names];
  let ordered = !(entry.gam && names.includes(entry.gam));
  const started = new Set<string>();
  let active = 0;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));

  const front = (list: string[]) => {
    const wanted = list.map((x) => resolveName(names, x)).filter((n): n is string => !!n && !started.has(n));
    if (!wanted.length) return;
    queue = [...new Set([...wanted, ...queue])];
    pump();
  };

  const arrived = (name: string, bytes: Uint8Array | undefined) => {
    if (bytes) {
      files.put(name, bytes.slice()); // a copy: the game may change its files
      const named = filesNamedBy(name, bytes);
      if (named.length) front(named);
    }
    if (name === entry.gam && !ordered) {
      ordered = true;
      // what was asked for meanwhile stays first
      queue = [...new Set([...queue, ...playOrder(entry.gam, bytes, names)])].filter((n) => !started.has(n));
    }
    waiting.get(name)?.resolve();
    waiting.delete(name);
    if (!waiting.size) {
      if (files.stream === stream) files.stream = undefined;
      resolveDone();
    }
  };

  const pump = () => {
    while (active < concurrency && queue.length) {
      const name = queue.shift()!;
      if (started.has(name)) continue;
      started.add(name);
      active++;
      void fetchSiteFile(`${base}${entry.path}${name}`, entry.gz)
        .catch(() => undefined)
        .then((bytes) => {
          active--;
          arrived(name, bytes);
          pump();
        });
    }
  };

  const stream: FileStream = {
    need(list) {
      const pending = list.map((x) => resolveName(names, x)).flatMap((n) => (n && waiting.has(n) ? [n] : []));
      if (!pending.length) return undefined;
      front(pending);
      return Promise.all(pending.map((n) => waiting.get(n)?.promise)).then(() => undefined);
    },
    want: front,
  };
  if (names.length) files.stream = stream;
  else resolveDone();
  pump();
  return { files, started: entry.gam ? (waiting.get(entry.gam)?.promise ?? Promise.resolve()) : Promise.resolve(), done };
}
