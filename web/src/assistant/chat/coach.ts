// "What should I do next?": the Level check, a bot play-test and the quick validate, run with the
// shared tools on the open game. Their results go to the model to turn into a to-do list
// (prompt.ts coachBrief), or, with no AI set up, straight into one from the findings.
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import type { GameContext } from '../tools/types';
import { resultText } from './agent';

export interface CoachResults {
  /** The three results as compact text, for the model. */
  text: string;
  /** The findings as to-do items, for when there is no model. */
  items: string[];
}

const call = async (ctx: GameContext, name: string, args: Record<string, unknown>) =>
  resultText(
    await runTool(
      GAME_TOOL_DEFS.find((d) => d.name === name)!,
      args,
      ctx,
    ),
  );

interface CheckJson {
  errors?: number;
  warnings?: number;
  findings?: { severity: string; title: string; detail?: string; where?: { scene?: number; map?: string; x?: number; y?: number; file?: string } }[];
}
interface BotJson {
  won?: boolean;
  stopped?: string;
  scenes?: { scene: number; name: string; got_through: boolean }[];
}
interface ValidateJson {
  issues?: { severity: string; message: string }[];
}

const parse = <T>(s: string): T | undefined => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
};

const place = (w: NonNullable<NonNullable<CheckJson['findings']>[number]['where']>) =>
  [w.scene !== undefined ? `scene ${w.scene}` : '', w.map ?? w.file ?? '', w.x !== undefined ? `at ${w.x},${w.y}` : ''].filter(Boolean).join(' ');

/** Runs the checks; `budgetMs` is the bot's time a scene. */
export async function gatherResults(ctx: GameContext, budgetMs = 4000): Promise<CoachResults> {
  const [check, bot, valid] = [
    await call(ctx, 'level_check', { severity: 'warning', max_findings: 25 }),
    await call(ctx, 'bot_playtest', { budget_ms: budgetMs }),
    await call(ctx, 'validate', {}),
  ];
  const items: string[] = [];
  const b = parse<BotJson>(bot);
  if (b && !b.won)
    items.push(
      `The bot couldn’t win the game${b.stopped ? `: ${b.stopped}` : ''}${
        b.scenes?.some((s) => !s.got_through)
          ? ` (stuck in ${b.scenes
              .filter((s) => !s.got_through)
              .map((s) => s.name || `scene ${s.scene}`)
              .join(', ')})`
          : ''
      }.`,
    );
  for (const i of parse<ValidateJson>(valid)?.issues ?? []) if (i.severity === 'error') items.push(i.message);
  const c = parse<CheckJson>(check);
  for (const f of c?.findings ?? []) {
    const where = f.where ? place(f.where) : '';
    items.push(`${f.title}${where ? ` (${where})` : ''}.`.replace(/\.\.$/, '.'));
  }
  // the checks' words, short enough for a small model
  const trimmed = c
    ? JSON.stringify({
        errors: c.errors,
        warnings: c.warnings,
        findings: c.findings?.map((f) => ({ severity: f.severity, title: f.title, ...(f.detail ? { detail: f.detail.slice(0, 140) } : {}), where: f.where })),
      })
    : check.slice(0, 3000);
  return {
    text: `Level check: ${trimmed}\nBot play-test: ${bot.slice(0, 1500)}\nValidate: ${valid.slice(0, 1000)}`,
    items: [...new Set(items)].slice(0, 12),
  };
}
