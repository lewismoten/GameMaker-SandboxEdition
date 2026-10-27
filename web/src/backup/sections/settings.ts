// Two sections of plain settings: preferences (the theme, the reading view and size, the
// Library's and home page's sorts and tabs, the volume, the on-screen keys and touch controls,
// the editors' remembered tabs and switches) and the AI assistant's setup. Merge keeps this
// browser's settings and fills in the ones not set here; Replace takes the file's.
//
// The AI setup's API key is left out of a backup unless asked for (withApiKey), and an import
// without one keeps the key this browser has.
import { localOf, type SectionId } from '../inventory';
import { describeKeys, fillGaps, injectLocal, isRecord, json, need, stringMap, type Section } from './types';

interface KeysPayload {
  local: Record<string, string>;
}

function keysSection(id: SectionId, title: string, short: string, description: string): Section<KeysPayload> {
  return {
    id,
    title,
    short,
    description,
    unit: ['setting', 'settings'],
    extract: (w) => ({ local: localOf(id, w.local) }),
    count: (p) => Object.keys(p.local).length,
    validate(raw) {
      need(isRecord(raw), title);
      return { local: stringMap(raw.local, title) };
    },
    merge: (mine, theirs, ctx) => ({ local: fillGaps(mine.local, theirs.local, ctx.prefer) }),
    inject: (w, mine, next) => injectLocal(w, mine.local, next.local),
    describe: (mine, next) => describeKeys(mine.local, next.local),
  };
}

export const prefs = keysSection(
  'prefs',
  'Preferences',
  'Preferences',
  'The theme, reading view and text size, how the Library and home page are sorted, the volume and the editors’ remembered choices.',
);

const AI = 'gm-ai-settings';
const keyOf = (text: string | undefined): string => {
  const v = json<{ apiKey?: unknown }>(text);
  return isRecord(v) && typeof v.apiKey === 'string' ? v.apiKey : '';
};

/** The AI settings' text with its API key taken out. */
export function withoutApiKey(local: Record<string, string>): Record<string, string> {
  const v = json<Record<string, unknown>>(local[AI]);
  if (!isRecord(v) || !v.apiKey) return local;
  return { ...local, [AI]: JSON.stringify({ ...v, apiKey: '' }) };
}

/** Whether these settings hold an API key. */
export const hasApiKey = (local: Record<string, string>): boolean => !!keyOf(local[AI]);

/** The file's AI settings, keeping this browser's key when the file has none. */
function keepKey(mine: Record<string, string>, next: Record<string, string>): Record<string, string> {
  const here = keyOf(mine[AI]);
  const v = json<Record<string, unknown>>(next[AI]);
  if (!here || !isRecord(v) || keyOf(next[AI])) return next;
  return { ...next, [AI]: JSON.stringify({ ...v, apiKey: here }) };
}

const aiBase = keysSection(
  'ai',
  'AI assistant setup',
  'AI setup',
  'Which AI the Assistant uses: its kind, address and model, and how it asks. The API key stays out unless you include it.',
);

export const ai: Section<KeysPayload> = {
  ...aiBase,
  merge: (mine, theirs, ctx) => ({ local: fillGaps(mine.local, theirs.local, ctx.prefer) }),
  replace: (theirs) => theirs,
  inject(w, mine, next) {
    injectLocal(w, mine.local, keepKey(mine.local, next.local));
  },
  describe: (mine, next) => describeKeys(mine.local, keepKey(mine.local, next.local)),
};
