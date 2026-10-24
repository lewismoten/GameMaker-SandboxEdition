// A hosted game that starts before all its files are in: the .gam first, then the files in
// the order play needs them (the title and menu, the first level, the scenes reachable
// from it, the rest), with the next ones fetched while the current scene plays. The game
// reads its files synchronously (GameFiles); where the engine is about to read one (a
// picture, a song, a scene's files) it asks for it first and waits if it is still on its
// way (engine/machine.ts, need), which moves it to the front of the queue.
import { GameFiles, cdName, fetchSiteFile, normalize, openPack, type CatalogEntry, type FileStream, type PackHandle } from './files';
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

/**
 * The order of a game's files in its pack (project/gamePack.ts): play order, each file
 * followed by the ones it names (a slide list's pictures, a sound set's samples), so a
 * game read from the start of its pack has what it needs as early as it can.
 */
export function packOrder(gamName: string | null, names: string[], get: (name: string) => Uint8Array | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (name: string | undefined) => {
    const n = name ? resolveName(names, name) : undefined;
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(n);
    const bytes = get(n);
    if (bytes) filesNamedBy(n, bytes).forEach(add);
  };
  for (const n of gamName ? playOrder(gamName, get(gamName), names) : names) add(n);
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

/** What a demo preview reads before it starts: the title demo, and the first level's character (attract mode). */
export function demoNeeds(gam: Uint8Array | undefined): string[] {
  try {
    const scenes = gam ? parseGame(gam).scenes : [];
    const first = scenes[scenes[0]?.links[0]?.toScene ?? -1];
    return [scenes[0]?.files[11], first?.files[5]].filter((n): n is string => !!n);
  } catch {
    return [];
  }
}

interface StreamedGame {
  files: GameFiles;
  /** The .gam is in: the game can be shown (its other files keep coming). */
  started: Promise<void>;
  /** Every file is in (or failed). */
  done: Promise<void>;
}

/**
 * Starts fetching a hosted game's files: its pack (project/gamePack.ts), which brings them in
 * play order, or, without one, a few files at a time, most needed first. `files` fills
 * as they arrive; until the last is in, `files.stream` lets the engine wait for one.
 *
 * `aheadBytes` limits what is fetched before it is asked for (a demo on the home page needs a
 * few of a game's files, not its every picture): files the engine asks for (need, want) always
 * come; others, in play order, only until that many bytes have been fetched ahead. Unlimited
 * by default, so a game being played has everything by the time it gets there; `done` then
 * waits for files that may never be asked for. A pack read past that budget, with nothing
 * asked for still on its way, is stopped; what is asked for later comes file by file.
 */
export function streamHostedGame(entry: CatalogEntry, base = './', concurrency = 4, aheadBytes = Infinity): StreamedGame {
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
  const asked = new Set<string>(entry.gam ? [entry.gam] : []);
  const sizeOf = (name: string) => entry.sizes?.[names.indexOf(name)] ?? 0;
  let ahead = 0; // bytes fetched before they were asked for
  let active = 0;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));

  /** Moves files to the front of the queue; `ask`: they are wanted now (not just next in line). */
  const front = (list: string[], ask = true) => {
    const wanted = list.map((x) => resolveName(names, x)).filter((n): n is string => !!n && !started.has(n));
    if (ask) wanted.forEach((n) => asked.add(n));
    if (!wanted.length) return;
    queue = [...new Set([...wanted, ...queue])];
    pump();
  };

  const arrived = (name: string, bytes: Uint8Array | undefined) => {
    if (bytes) {
      files.put(name, bytes.slice()); // a copy: the game may change its files
      const named = filesNamedBy(name, bytes);
      if (named.length) front(named, asked.has(name)); // a slide list fetched ahead names files that can wait too
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

  /** The next file to fetch: the first asked for, or (while the budget lasts) the first in play order. */
  const next = (): string | undefined => {
    queue = queue.filter((n) => !started.has(n));
    const i = queue.findIndex((n) => asked.has(n) || ahead + sizeOf(n) <= aheadBytes);
    if (i < 0) return undefined;
    const [name] = queue.splice(i, 1);
    if (!asked.has(name)) ahead += sizeOf(name);
    return name;
  };

  // the pack, while it is being read: it brings every file, so none is fetched on its own meanwhile
  let pack: PackHandle | undefined;
  const fromPack = (name: string, bytes: Uint8Array) => {
    if (started.has(name) || !waiting.has(name)) return;
    started.add(name);
    if (!asked.has(name)) ahead += bytes.length;
    arrived(name, bytes);
    // a preview's budget spent, and nothing it asked for still to come (once what just came is
    // looked at: the .gam's arrival is what names the demo's files): stop
    if (ahead > aheadBytes && !checking) {
      checking = true;
      setTimeout(() => {
        checking = false;
        if (ahead > aheadBytes && ![...asked].some((n) => waiting.has(n))) quitPack();
      });
    }
  };
  let checking = false;
  let quit = false;
  const quitPack = () => {
    quit = true;
    const p = pack;
    pack = undefined;
    p?.stop();
    pump();
  };

  const pump = () => {
    if (pack) return;
    while (active < concurrency) {
      const name = next();
      if (!name) return;
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
      return Promise.all(pending.flatMap((n) => waiting.get(n)?.promise ?? [])).then(() => undefined);
    },
    want: (list) => front(list),
  };
  if (names.length) files.stream = stream;
  else resolveDone();
  pack = names.length ? openPack(entry, base, fromPack) : undefined;
  if (quit) quitPack(); // all there already
  // a pack that fails (or ends without a file) leaves the rest to be fetched one by one
  void pack?.done.then(() => pack && quitPack());
  pump();
  return { files, started: entry.gam ? (waiting.get(entry.gam)?.promise ?? Promise.resolve()) : Promise.resolve(), done };
}
