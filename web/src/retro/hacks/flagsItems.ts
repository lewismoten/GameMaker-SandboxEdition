// What FLAGS.EXE can list, set, clear and reset: the desk PC's hard-to-see browser state (merit
// badges, felt eggs, tin hearts, score trophy tiers, the hint line's bill, the registration card's
// mail, the BBS caller file, the room clock). Each item says what it shows and what it lets you do.
// Scope: this browser's simulated environment only. It never writes into a game's save files
// (SAVEHACK's job); a count of eggs or hearts is an override on top of the saves, like EGG.EXE's.
// Secret games are never named: the bonus rows speak of "bonus game 1/2" and only show once open.
import { achievementById, ACHIEVEMENTS } from '../../achievements/catalog';
import { loadAchievements, replaceAchievements, resetAchievements } from '../../achievements/store';
import { eggStates, OVERRIDES_KEY as EGG_KEY, resetAllOverrides as resetEggs, type Override } from '../../eggs/eggState';
import { huntStates, OVERRIDES_KEY as HEART_KEY, resetAllOverrides as resetHearts } from '../../tinHearts/tinHearts';
import { TIER_NAMES, TOP_TIER, readTrophyOverrides, resetTrophyOverrides, setTrophyOverride, tierOf, type TrophyKind } from '../../scoreTrophies/tiers';
import { bestSum, loadScores } from '../../scoreTrophies/scores';
import { deskClockSet, deskNow, resetDeskClock } from '../dos/deskClock';
import { account, filePoints, restoreAccount } from '../bbs/ratio';

/** The hint line's rate (desk/room/phone/hintBill.ts, which the DOS page may not load: flags.test.ts checks it). */
export const HINT_CENTS_PER_MINUTE = 199;

export interface FlagItem {
  id: string;
  /** What it is, in a few words (the help's list). */
  label: string;
  /** The current value in a few words; undefined hides the row until it applies. */
  show: () => Promise<string | undefined>;
  /** SET <id> <words...>; omitted when the state can only come from play. */
  set?: (words: string[]) => Promise<string>;
  /** CLEAR <id> <words...>. */
  clear?: (words: string[]) => Promise<string>;
  /** RESET <id>: back to the way a new visitor has it. */
  reset?: () => Promise<string>;
  /** Plain words for what to use instead when an action isn't offered. */
  elsewhere?: string;
}

export class FlagError extends Error {}

const area = (): Storage | undefined => {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
};
const get = (k: string): string | null => {
  try {
    return area()?.getItem(k) ?? null;
  } catch {
    return null;
  }
};
const drop = (...keys: string[]): void => {
  for (const k of keys) {
    try {
      area()?.removeItem(k);
    } catch {
      /* private mode */
    }
  }
};

const tell = (event: string) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(event));
};

// ---- counts of eggs and hearts ---------------------------------------------------------------

/**
 * The overrides that make exactly `n` of `states` count as found, the first `n` in list order:
 * a find the save has needs none, one it lacks is 'added'; a save's find outside the first `n` is
 * 'broken'. Pure, so a test can set 3 of N and check what shows.
 */
export function overridesForCount(states: { id: string; inSave: boolean }[], n: number): Record<string, Override> {
  const out: Record<string, Override> = {};
  states.forEach((s, i) => {
    const want = i < n;
    if (want && !s.inSave) out[s.id] = 'added';
    if (!want && s.inSave) out[s.id] = 'broken';
  });
  return out;
}

/** "3", "ALL" or "NONE" as a count out of `total`; throws a plain error otherwise. */
export function parseCount(words: string[], total: number, what: string): number {
  const w = (words[0] ?? '').toUpperCase();
  if (w === 'ALL') return total;
  if (w === 'NONE') return 0;
  if (!/^\d+$/.test(w)) throw new FlagError(`${what} needs a number from 0 to ${total}, or ALL or NONE`);
  const n = Number(w);
  if (n > total) throw new FlagError(`${what} goes from 0 to ${total}; ${n} is too many`);
  return n;
}

function writeOverrides(key: string, o: Record<string, Override>, event: string): void {
  try {
    if (Object.keys(o).length) area()?.setItem(key, JSON.stringify(o));
    else area()?.removeItem(key);
  } catch {
    /* private mode */
  }
  tell(event);
}

const foundOf = (s: { found: boolean }[]) => `${s.filter((x) => x.found).length} of ${s.length}`;

// ---- the trophies ----------------------------------------------------------------------------

const KINDS: Record<string, TrophyKind> = { BEST: 'best', TOTAL: 'total' };

/** A tier from a number 0-5 or its name (None, Plastic, Bronze, Silver, Gold, Gaudy). */
export function parseTier(word: string | undefined): number {
  const w = (word ?? '').toUpperCase();
  const byName = TIER_NAMES.findIndex((t) => t.toUpperCase() === w);
  if (byName >= 0) return byName;
  if (/^\d$/.test(w) && Number(w) <= TOP_TIER) return Number(w);
  throw new FlagError(`A tier is 0 to ${TOP_TIER} or a name: ${TIER_NAMES.join(', ')}`);
}

function kindOf(word: string | undefined): TrophyKind {
  const k = KINDS[(word ?? '').toUpperCase()];
  if (!k) throw new FlagError('Which trophy? BEST or TOTAL');
  return k;
}

// ---- the items -------------------------------------------------------------------------------

const when = (t: number) => new Date(t).toLocaleDateString('en-US');

export const ITEMS: readonly FlagItem[] = [
  {
    id: 'ACH',
    label: 'Merit badges (achievements)',
    async show() {
      const r = await loadAchievements();
      const n = ACHIEVEMENTS.filter((a) => r.unlocked[a.id]).length;
      return `${n} of ${ACHIEVEMENTS.length} earned${r.reset ? `; last Reset ${when(r.reset.at)}` : ''}`;
    },
    async set(words) {
      const id = words[0];
      if (!id) throw new FlagError('SET ACH needs a badge id, such as SET ACH desk-achieve');
      if (!achievementById(id)) throw new FlagError(`No badge called "${id}" (ACHIEVE lists the badges)`);
      const r = structuredClone(await loadAchievements());
      r.unlocked[id] = Date.now();
      await replaceAchievements(r);
      return `Badge ${id} earned.`;
    },
    async clear(words) {
      const id = words[0];
      if (!id) throw new FlagError('CLEAR ACH needs a badge id');
      const r = structuredClone(await loadAchievements());
      if (!r.unlocked[id] && !r.progress[id] && !r.sets[id]) throw new FlagError(`Badge ${id} was not earned, so nothing to clear`);
      delete r.unlocked[id];
      delete r.progress[id];
      delete r.sets[id];
      await replaceAchievements(r);
      return `Badge ${id} taken back.`;
    },
    async reset() {
      await resetAchievements();
      return 'All badges cleared, as the web page Reset does (eggs, hearts and scores held before count as before).';
    },
  },
  {
    id: 'EGGS',
    label: 'Felt eggs found',
    show: async () => foundOf(await eggStates()),
    async set(words) {
      const states = (await eggStates()).map((s) => ({ id: s.egg.game, inSave: s.inSave }));
      const n = parseCount(words, states.length, 'Eggs');
      writeOverrides(EGG_KEY, overridesForCount(states, n), 'gm-eggs-changed');
      return `${n} of ${states.length} eggs now count as found (saves untouched).`;
    },
    async clear() {
      return this.set!(['NONE']);
    },
    async reset() {
      resetEggs();
      drop('gm-egg-taps', 'gm-egg-hatched');
      tell('gm-eggs-changed');
      return 'Eggs back to what the saves say; the cracked egg whole again.';
    },
  },
  {
    id: 'HEARTS',
    label: 'Tin hearts found',
    show: async () => foundOf(await huntStates()),
    async set(words) {
      const states = await huntStates();
      const n = parseCount(words, states.length, 'Hearts');
      writeOverrides(HEART_KEY, overridesForCount(states, n), 'gm-tin-hearts-changed');
      return `${n} of ${states.length} hearts now count as found (saves untouched).`;
    },
    async clear() {
      return this.set!(['NONE']);
    },
    async reset() {
      resetHearts();
      drop('gm-heart-reveal');
      return "Hearts back to what the saves say; Joe's reveal will play again.";
    },
  },
  {
    id: 'TROPHY',
    label: 'Score trophy tiers',
    async show() {
      const s = await loadScores();
      const o = readTrophyOverrides();
      const row = (k: TrophyKind, pts: number) => {
        const earned = tierOf(k, pts);
        const shown = o[k];
        return `${k.toUpperCase()} ${TIER_NAMES[earned]}${shown !== undefined && shown !== earned ? ` (shown ${TIER_NAMES[shown]})` : ''}`;
      };
      return `${row('best', bestSum(s))}; ${row('total', s.total)}`;
    },
    async set(words) {
      const k = kindOf(words[0]);
      const t = parseTier(words[1]);
      setTrophyOverride(k, t);
      return `The ${k} trophy now shows ${TIER_NAMES[t]}. Scores untouched.`;
    },
    async clear(words) {
      const k = kindOf(words[0]);
      setTrophyOverride(k, undefined);
      return `The ${k} trophy shows what the scores earned.`;
    },
    async reset() {
      resetTrophyOverrides();
      return 'Both trophies show what the scores earned.';
    },
  },
  {
    id: 'BILL',
    label: 'Hint line phone bill',
    async show() {
      const ms = (() => {
        const n = Number(get('gm-hint-phone-bill'));
        return Number.isFinite(n) && n > 0 ? n : 0;
      })();
      const cents = Math.floor((ms * HINT_CENTS_PER_MINUTE) / 60000);
      return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')} (${Math.round(ms / 60000)} minutes listened)`;
    },
    async set(words) {
      const m = Number(words[0]);
      if (!/^\d+$/.test(words[0] ?? '') || m > 100_000) throw new FlagError('SET BILL needs minutes listened, 0 to 100000');
      if (m === 0) drop('gm-hint-phone-bill');
      else area()?.setItem('gm-hint-phone-bill', String(m * 60000));
      return `The bill now counts ${m} minutes.`;
    },
    async clear() {
      drop('gm-hint-phone-bill');
      return 'The bill is $0.00.';
    },
    async reset() {
      drop('gm-hint-phone-bill');
      return 'The bill is $0.00.';
    },
  },
  {
    id: 'MAIL',
    label: 'Registration card mail',
    async show() {
      const mail = get('gm-reg-mail') !== null;
      const reply = get('gm-reg-reply') !== null;
      return mail || reply ? `${reply ? 'reply saved' : 'no reply'}; ${mail ? 'envelope delivered' : 'no envelope'}` : 'no card sent';
    },
    async clear() {
      drop('gm-reg-mail', 'gm-reg-reply');
      return "The card, its reply and the envelope are forgotten (PLAYGAME.REG is GMCRACK's).";
    },
    async reset() {
      return this.clear!([]);
    },
    elsewhere: 'Mail comes from sending the card in GM REGISTER; GMCRACK sets PLAYGAME.REG itself.',
  },
  {
    id: 'BBS',
    label: 'BBS caller file',
    async show() {
      const a = account();
      const signups = (() => {
        try {
          const l = JSON.parse(get('gm-bbs-signups') ?? '[]') as unknown;
          return Array.isArray(l) ? l.length : 0;
        } catch {
          return 0;
        }
      })();
      return `${a.calls} calls, ${filePoints(a)} file points; ${signups} callback sign-ups`;
    },
    async reset() {
      restoreAccount(null);
      drop('gm-bbs-signups', 'gm-bbs-door-tictactoe');
      return 'You are a new caller again: calls, file points, sign-ups and the door game cleared.';
    },
  },
  {
    id: 'CLOCK',
    label: 'Room clock',
    async show() {
      return deskClockSet() ? `set to ${deskNow().toLocaleString('en-US')}` : 'real local time';
    },
    async reset() {
      resetDeskClock();
      return 'The room runs on real local time.';
    },
    elsewhere: 'Set it with the DOS TIME and DATE commands.',
  },
  {
    id: 'REG',
    label: 'Game-Maker registration',
    show: async () => {
      const { pcExtras } = await import('./pcExtras');
      const { checkRegistration } = await import('../gmReg/registration');
      const x = pcExtras();
      await x.ready;
      return checkRegistration(x.reg, x.serial).kind === 'registered' ? 'registered (PLAYGAME.REG good)' : 'not registered';
    },
    elsewhere: 'GMCRACK registers or unregisters it.',
  },
  {
    id: 'BONUS',
    label: 'Bonus games',
    async show() {
      const { secretsRevealed } = await import('../../project/secretGames');
      const bits = await secretsRevealed();
      if (!bits) return undefined; // hidden until something is open
      return `1: ${bits & 1 ? 'revealed' : 'hidden'}; 2: ${bits & 2 ? 'revealed' : 'hidden'}`;
    },
    elsewhere: 'They open when the eggs or hearts are all found: SET EGGS ALL or SET HEARTS ALL.',
  },
  { id: 'ROOM', label: 'Safe, lights, lume, mug...', show: async () => undefined, elsewhere: 'ROOMFIX does the room and the safe.' },
  { id: 'SAVES', label: 'Saved games', show: async () => undefined, elsewhere: 'SAVEHACK edits saves; BACKUP keeps copies.' },
];

/** Everything the backup keeps in localStorage. */
export const BACKUP_KEYS = [
  'gm-eggs',
  'gm-egg-taps',
  'gm-egg-hatched',
  'gm-tin-hearts',
  'gm-clock-heart',
  'gm-clock-pops',
  'gm-hearts-before-clock',
  'gm-heart-reveal',
  'gm-score-trophies',
  'gm-reg-mail',
  'gm-reg-reply',
  'gm-hint-phone-bill',
  'gm-bbs-sandbox-user',
  'gm-bbs-signups',
  'gm-bbs-door-tictactoe',
  'gm-desk-clock',
] as const;
