// What the home page's deeper search reads for each listed game (deepIndex.ts): a catalog game
// by the site's own loaders (the files of its pack that hold text, its details), one of yours
// from the browser's storage. Only games the home page lists are given: a secret game is listed
// only once this player has unlocked it (secretGames.ts withSecretGames), so a locked one is
// never read, and its cached text is never looked at. No DOM.
import { fetchGameFile, peekGameFile, withDetails } from '../../project/files';
import { isStarterGame, starterGroupOf } from '../../project/starter';
import { questionsOf } from '../../project/howDoI';
import { worthReading } from './deepExtract';
import type { DeepSource } from './deepIndex';
import type { HomeGame } from './homeCards';
import type { Part } from './searchMatch';

const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** The words a catalog entry carries outside its files. */
async function catalogExtras(game: HomeGame): Promise<Part[]> {
  const e = await withDetails(game.entry!);
  const out: Part[] = [{ label: 'Title', text: e.title }];
  if (e.blurb) out.push({ label: 'Description', text: e.blurb });
  if (e.notice) out.push({ label: 'Notice', text: e.notice });
  for (const c of e.boxGame?.captions ?? []) out.push({ label: 'Box text', text: c });
  const manual = e.original?.manual as { pages?: { head: string; html: string }[] } | undefined;
  for (const p of manual?.pages ?? []) {
    out.push({ label: 'Manual', text: p.head });
    for (const s of stripTags(p.html).split(/(?<=[.!?])\s+/)) if (s.length > 2) out.push({ label: 'Manual', text: s.slice(0, 400) });
  }
  if (isStarterGame(e)) {
    const group = starterGroupOf(e.id);
    if (group) out.push({ label: 'Starter group', text: group });
    for (const q of questionsOf(e)) out.push({ label: 'How do I question', text: q.q });
  }
  const box = e.original?.box;
  if (box) {
    for (const t of [box.tagline, box.back, ...box.features]) if (t) out.push({ label: 'Box text', text: stripTags(t).slice(0, 400) });
  }
  return out;
}

/** A source for one game, or undefined for one that must not be indexed. */
export function deepSourceOf(game: HomeGame): DeepSource | undefined {
  const e = game.entry;
  if (e) {
    return {
      key: game.key,
      version: String(e.pack ?? e.gamCrc ?? e.bytes ?? (e.files ?? []).length),
      names: e.files ?? [],
      readFiles: async () => {
        const out: [string, Uint8Array][] = [];
        for (const name of (e.files ?? []).filter(worthReading)) {
          const bytes = (await peekGameFile(e, name)) ?? (await fetchGameFile(e, name));
          if (bytes) out.push([name, bytes]);
        }
        return out;
      },
      readExtras: async () => ({ extras: await catalogExtras(game) }),
    };
  }
  const p = game.project;
  if (!p) return undefined;
  let names: string[] = [];
  return {
    key: game.key,
    version: `${p.id}|${p.updated}`,
    get names() {
      return names;
    },
    readFiles: async () => {
      const files = await game.files();
      names = files.names();
      return names.filter(worthReading).flatMap((n) => (files.get(n) ? [[n, files.get(n)!] as [string, Uint8Array]] : []));
    },
    readExtras: async () => ({
      extras: [{ label: 'Name', text: p.name }],
      companion: p.companion?.files,
    }),
  };
}
