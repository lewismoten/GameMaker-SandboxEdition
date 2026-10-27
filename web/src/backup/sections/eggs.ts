// The felt eggs and the two bonus eggs: EGG.EXE's overrides, the rotten egg's taps, and which
// eggs this browser's saved games hold (an egg is found when a save holds it). Those carry over
// as "added" overrides, so the eggs stay found even when the saves aren't brought back.
// Merge: found stays found (an egg broken here stays broken), the taps keep the higher count.
import { EGGS } from '../../eggs/eggs';
import { savesHold } from '../../eggs/eggState';
import { savesOf, type World } from '../world';
import { localOf } from '../inventory';
import { describeKeys, injectLocal, isRecord, json, need, plural, stringMap, type Section } from './types';

export interface EggsPayload {
  local: Record<string, string>;
  /** Override keys (a game's id, or bonusKey's "<game>/<id>") of eggs a save here holds. */
  inSaves: string[];
}

type Overrides = Record<string, 'added' | 'broken'>;
const KEY = 'gm-eggs';
const TAPS = 'gm-egg-taps';

const overrides = (local: Record<string, string>): Overrides => {
  const o = json<Overrides>(local[KEY]);
  return isRecord(o) ? o : {};
};

async function eggsInSaves(w: World, o: Overrides): Promise<string[]> {
  const found = EGGS.filter((e) => savesHold(savesOf(w, `game:${e.game}`), e.detect)).map((e) => e.game);
  // the bonus eggs' file loads only once every felt egg is found, as everywhere else
  if (!EGGS.every((e) => o[e.game] !== 'broken' && (found.includes(e.game) || o[e.game] === 'added'))) return found;
  const { BONUS_EGGS, bonusKey } = await import('../../eggs/bonus');
  return [...found, ...BONUS_EGGS.filter((e) => savesHold(savesOf(w, `game:${e.game}`), e.detect)).map(bonusKey)];
}

/** `local` with every egg in `found` marked added unless it is set already (broken stays broken). */
function withFound(local: Record<string, string>, found: string[], base: Overrides): Record<string, string> {
  const o = { ...base };
  for (const k of found) o[k] ??= 'added';
  if (!Object.keys(o).length) return local;
  return { ...local, [KEY]: JSON.stringify(o) };
}

const foundCount = (p: EggsPayload) => {
  const o = overrides(p.local);
  return new Set([...p.inSaves, ...Object.keys(o).filter((k) => o[k] === 'added')].filter((k) => o[k] !== 'broken')).size;
};

export const eggs: Section<EggsPayload> = {
  id: 'eggs',
  title: 'Felt eggs and bonus eggs',
  description: 'Which eggs you have found, EGG.EXE’s changes and how far the rotten egg is cracked.',
  unit: ['egg found', 'eggs found'],
  async extract(w) {
    const local = localOf('eggs', w.local);
    return { local, inSaves: await eggsInSaves(w, overrides(local)) };
  },
  count: foundCount,
  validate(raw) {
    need(isRecord(raw) && Array.isArray(raw.inSaves) && raw.inSaves.every((k) => typeof k === 'string'), 'eggs');
    return { local: stringMap(raw.local, 'eggs'), inSaves: raw.inSaves };
  },
  merge(mine, theirs) {
    const a = overrides(mine.local);
    const b = overrides(theirs.local);
    const o: Overrides = { ...a };
    for (const [k, v] of Object.entries(b)) if (v === 'added' && o[k] !== 'broken') o[k] = 'added';
    const local = { ...mine.local };
    if (Object.keys(o).length) local[KEY] = JSON.stringify(o);
    const taps = Math.max(Number(mine.local[TAPS] ?? 0) || 0, Number(theirs.local[TAPS] ?? 0) || 0);
    if (taps) local[TAPS] = String(taps);
    if (theirs.local['gm-egg-hatched'] && !mine.local['gm-egg-hatched'] && !local[TAPS]) local['gm-egg-hatched'] = theirs.local['gm-egg-hatched'];
    const mineSaved = new Set(mine.inSaves);
    const next = withFound(
      local,
      theirs.inSaves.filter((k) => !mineSaved.has(k)),
      o,
    );
    return { local: same(next, mine.local) ? mine.local : next, inSaves: mine.inSaves };
  },
  replace(theirs, _ctx, mine) {
    const saved = new Set(mine.inSaves);
    return {
      local: withFound(
        theirs.local,
        theirs.inSaves.filter((k) => !saved.has(k)),
        overrides(theirs.local),
      ),
      inSaves: mine.inSaves,
    };
  },
  inject: (w, mine, next) => injectLocal(w, mine.local, next.local),
  describe(mine, next) {
    const a = foundCount(mine);
    const b = foundCount({ ...next, inSaves: mine.inSaves });
    const out: string[] = [];
    if (b > a) out.push(`Finds ${plural(b - a, ['egg', 'eggs'])}`);
    if (b < a) out.push(`Unfinds ${plural(a - b, ['egg', 'eggs'])}`);
    if (!out.length) out.push(...describeKeys(mine.local, next.local));
    return out;
  },
};

const same = (a: Record<string, string>, b: Record<string, string>) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
