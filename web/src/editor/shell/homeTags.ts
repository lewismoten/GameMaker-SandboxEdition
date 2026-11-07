// Tags on the Imported list's cards and the "Tag" picker beside the rating picker. A game found
// in the known-games table (imported/knownGames.json, matched by content fingerprint) shows its
// tags as "Tags"; any other game shows the deterministic tagger's guesses as "Suggested tags"
// (imported/gameTags.ts). Worked out once per saved version of a game, kept in this browser
// only (never in the DOS files), and read after the list is up.
import { clear, h } from '../core/ui';

export interface TagInfo {
  tags: string[];
  /** Found in the known-games table; otherwise the tags are guesses. */
  known: boolean;
}

const KEY = 'gm-imported-tags-v1';
const FILTER_KEY = 'gm-imported-tag-filter';
const infos = new Map<string, TagInfo>();
let filter = '';

try {
  filter = localStorage.getItem(FILTER_KEY) ?? '';
} catch {
  /* not remembered */
}

function stored(): Record<string, TagInfo & { v: number }> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, TagInfo & { v: number }>;
  } catch {
    return {};
  }
}

/** Works out the tags of imported games (id and saved time); `done` when all are known. */
export async function loadTags(list: { id: string; updated: number; gam: string }[]): Promise<void> {
  const cache = stored();
  const next: typeof cache = {};
  let table: Record<string, string[]> | undefined;
  for (const p of list) {
    const hit = cache[p.id];
    if (hit && hit.v === p.updated) {
      infos.set(p.id, hit);
      next[p.id] = hit;
      continue;
    }
    try {
      const { loadProject } = await import('../../project/storage');
      const stored = await loadProject(p.id);
      const gam = stored?.files.get(p.gam);
      if (!stored || !gam) continue;
      const get = (n: string) => stored.files.get(n);
      const { contentFingerprint } = await import('../../imported/contentFingerprint');
      const fp = await contentFingerprint(gam, get);
      table ??= ((await import('../../imported/knownGames.json')) as { default: Record<string, string[]> }).default;
      const known = fp ? table[fp] : undefined;
      const info: TagInfo = known ? { tags: known, known: true } : { tags: (await import('../../imported/gameTags')).suggestTags(gam, get), known: false };
      infos.set(p.id, info);
      next[p.id] = { ...info, v: p.updated };
    } catch {
      /* this game just gets no tags */
    }
  }
  for (const id of [...infos.keys()]) if (!list.some((p) => p.id === id)) infos.delete(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* not kept */
  }
}

/** Whether a game shows under the tag picker. */
export const tagShown = (id: string): boolean => !filter || !!infos.get(id)?.tags.includes(filter);

/** One row of small chips where the dropped date and file name were; a screen reader hears one phrase. */
export function tagTile(tile: HTMLElement, id: string): void {
  const info = infos.get(id);
  if (!info?.tags.length) return;
  const label = `${info.known ? 'Tags' : 'Suggested tags'}: ${info.tags.join(', ')}`;
  tile
    .querySelector('.tile-select')
    ?.append(
      h(
        'span',
        { class: `tile-tags${info.known ? '' : ' tile-tags-guess'}`, title: label, role: 'img', 'aria-label': label },
        ...info.tags.map((t) => h('span', { class: 'tile-tag', 'aria-hidden': 'true' }, t)),
      ),
    );
}

/** The "Tag" picker, with the tags the Imported games have; `onChange` hears a pick, already remembered. */
export function tagFilterBox(onChange: () => void): HTMLLabelElement {
  const select = h('select', {
    onchange: (e: Event) => {
      filter = (e.target as HTMLSelectElement).value;
      try {
        localStorage.setItem(FILTER_KEY, filter);
      } catch {
        /* not remembered */
      }
      onChange();
    },
  });
  const box = h('label', { class: 'lib-sort lib-rating lib-tag' }, 'Tag ', select);
  const fill = () => {
    const all = [...new Set([...infos.values()].flatMap((i) => i.tags))].sort();
    if (filter && !all.includes(filter)) filter = '';
    clear(select, h('option', { value: '', selected: !filter }, 'All tags'), ...all.map((t) => h('option', { value: t, selected: t === filter }, t)));
  };
  fill();
  box.addEventListener('focusin', fill); // the list may have grown since the page drew
  box.addEventListener('pointerdown', fill);
  return box;
}
