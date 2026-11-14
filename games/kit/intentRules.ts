// The declared-intent rules (games/<id>/intent.json): the schema with a clear error, and the rules that read
// an EventLog (the bot's play of the game, tools/eventLog.ts). Pure: no files, no engine. intentCheck.ts runs them.
// A finding is a suggestion an author can dismiss, so each says what the bot did, and that a person may play otherwise.
import { scanOf, type EventLog, type GameEvent } from '@lewismoten/gamemaker-sandbox-tools/kit/eventLog';

export type Rule =
  | { rule: 'before'; a: string; b: string; strict?: boolean }
  | { rule: 'uses'; move: string; min: number; strict?: boolean }
  | { rule: 'needs'; move: string; strict?: boolean };

export interface LevelIntent {
  /** The scene number the level plays in (the game's scene list; a level re-entered after a death is the same scene). */
  scene: number;
  /** What the level teaches, in the author's words; it names the level in findings. */
  teaches: string;
  rules: Rule[];
}
export interface Intent {
  levels: LevelIntent[];
}

export interface Finding {
  scene: number;
  rule: Rule;
  /** The words for the author. */
  text: string;
  /** A rule marked strict: check:games exits 1 on it. */
  strict: boolean;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** An event reference: key:<Name> (a key goes down), score:<n> (the score changes by n), scene:<n> (play enters scene n), leave (play leaves the level), death. */
export function validRef(ref: string): string | undefined {
  const m = /^(key|score|scene):(.+)$/.exec(ref);
  if (ref === 'leave' || ref === 'death') return undefined;
  if (!m) return `"${ref}" is not an event: use key:<Name>, score:<n>, scene:<n>, leave or death`;
  if (m[1] === 'key' && scanOf(m[2]) === undefined)
    return `"${ref}": "${m[2]}" is not a key name (Up, Down, Left, Right, Space, Enter, Esc, a letter or a digit)`;
  if (m[1] !== 'key' && !Number.isInteger(Number(m[2]))) return `"${ref}": "${m[2]}" is not a whole number`;
  return undefined;
}

/** Reads intent.json's parsed text; throws an Error naming where it is wrong. */
export function parseIntent(raw: unknown, where = 'intent.json'): Intent {
  const bad = (path: string, why: string): never => {
    throw new Error(`${where}: ${path}: ${why}`);
  };
  if (!isObj(raw) || !Array.isArray(raw.levels)) return bad('levels', 'expected a list of levels');
  const levels = raw.levels.map((l: unknown, i): LevelIntent => {
    const at = `levels[${i}]`;
    if (!isObj(l)) return bad(at, 'expected an object with scene, teaches and rules');
    if (!Number.isInteger(l.scene) || (l.scene as number) < 0) bad(`${at}.scene`, 'expected a scene number');
    if (typeof l.teaches !== 'string' || !l.teaches) bad(`${at}.teaches`, 'expected a few words on what the level teaches');
    if (!Array.isArray(l.rules)) bad(`${at}.rules`, 'expected a list of rules');
    const rules = (l.rules as unknown[]).map((r, j): Rule => {
      const rat = `${at}.rules[${j}]`;
      if (!isObj(r)) return bad(rat, 'expected an object with "rule"');
      if (r.strict !== undefined && typeof r.strict !== 'boolean') bad(`${rat}.strict`, 'expected true or false');
      const strict = r.strict as boolean | undefined;
      if (r.rule === 'before') {
        for (const k of ['a', 'b'] as const) {
          const err = typeof r[k] === 'string' ? validRef(r[k]) : 'expected an event';
          if (err) bad(`${rat}.${k}`, err);
        }
        return { rule: 'before', a: r.a as string, b: r.b as string, strict };
      }
      if (r.rule === 'uses' || r.rule === 'needs') {
        if (typeof r.move !== 'string' || scanOf(r.move) === undefined)
          bad(`${rat}.move`, `"${String(r.move)}" is not a key name (Up, Down, Left, Right, Space, Enter, Esc, a letter or a digit)`);
        if (r.rule === 'needs') return { rule: 'needs', move: r.move as string, strict };
        if (!Number.isInteger(r.min) || (r.min as number) < 1) bad(`${rat}.min`, 'expected a whole number of presses, 1 or more');
        return { rule: 'uses', move: r.move as string, min: r.min as number, strict };
      }
      return bad(`${rat}.rule`, `"${String(r.rule)}" is not a rule: use before, uses or needs`);
    });
    return { scene: l.scene as number, teaches: l.teaches as string, rules };
  });
  return { levels };
}

const label = (l: LevelIntent) => `Level in scene ${l.scene} (${l.teaches})`;
const TAIL = 'The bot is one way of playing; a person may find another. If this is intended, remove the rule.';

function matches(ref: string, e: GameEvent, scene: number): boolean {
  if (e.scene !== scene) return false;
  const [kind, arg] = ref.split(':');
  if (ref === 'death') return e.kind === 'death';
  if (ref === 'leave') return e.kind === 'scene' && e.from === scene && e.to !== scene;
  if (kind === 'key') return e.kind === 'key' && e.down && e.scan === scanOf(arg);
  if (kind === 'score') return e.kind === 'score' && e.delta === Number(arg);
  if (kind === 'scene') return e.kind === 'scene' && e.to === Number(arg);
  return false;
}

/** The rules that read the bot's logged route (before and uses). needs runs apart (intentCheck.ts). */
export function checkLog(level: LevelIntent, log: EventLog): Finding[] {
  const out: Finding[] = [];
  for (const rule of level.rules) {
    const strict = rule.strict === true;
    if (rule.rule === 'before') {
      const at = (ref: string) => log.events.findIndex((e) => matches(ref, e, level.scene));
      const a = at(rule.a);
      const b = at(rule.b);
      if (a < 0 && b >= 0)
        out.push({
          scene: level.scene,
          rule,
          strict,
          text: `${label(level)}: ${rule.b} happened but ${rule.a} never did first. The bot got there without it. ${TAIL}`,
        });
      else if (a >= 0 && b >= 0 && a > b)
        out.push({
          scene: level.scene,
          rule,
          strict,
          text: `${label(level)}: ${rule.b} came before ${rule.a} on the bot's route; the rule says ${rule.a} first. ${TAIL}`,
        });
      else if (a < 0 && b < 0)
        out.push({
          scene: level.scene,
          rule,
          strict,
          text: `${label(level)}: neither ${rule.a} nor ${rule.b} showed on the bot's route, so this could not be checked (the level may not have been reached).`,
        });
    } else if (rule.rule === 'uses') {
      const n = log.presses(scanOf(rule.move)!, level.scene);
      if (n < rule.min)
        out.push({
          scene: level.scene,
          rule,
          strict,
          text: `${label(level)}: the rule expects ${rule.move} pressed ${rule.min} times or more; the bot's route pressed it ${n}. ${TAIL}`,
        });
    }
  }
  return out;
}

/** The finding for a level a bot got through with `move` banned. */
export function winnableWithout(level: LevelIntent, rule: Rule & { rule: 'needs' }): Finding {
  return {
    scene: level.scene,
    rule,
    strict: rule.strict === true,
    text: `${label(level)} looks winnable without ${rule.move}. The bot won it with ${rule.move} banned, so players may skip the lesson. ${TAIL}`,
  };
}
