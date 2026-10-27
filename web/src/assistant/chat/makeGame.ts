// Making a game from a description: an empty project first gets the starter level (the same one
// "Ready to play" makes: editor/shell/starter.ts), as one change; then the model builds it step by
// step with the tools (prompt.ts buildBrief), and the bot plays it. Until the bot wins, the model
// is shown why and asked to fix it, a couple of times at most.
import { GameFiles } from '../../project/files';
import { ADVTYPE, parseGame } from '../../formats/game';
import { fillStarter } from '../../editor/shell/starter';
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import type { Change, GameContext } from '../tools/types';
import { resultText, type Agent, type SendOptions } from './agent';
import { buildBrief } from './prompt';

/** True when the game has no level yet (a new "Empty" game). */
export function hasNoLevel(ctx: GameContext): boolean {
  const b = ctx.files.get(ctx.gam);
  return !b || !parseGame(b).scenes.some((s) => s.gametype === ADVTYPE);
}

/** The starter level's files for this game, as one change; undefined when the library game has none. */
export function starterChange(ctx: GameContext, lib: GameFiles): Change | undefined {
  const files = ctx.files.copy();
  const title = parseGame(files.get(ctx.gam)!).scenes[0]?.desc.trim() || 'My Game';
  if (!fillStarter({ files, gam: ctx.gam }, title, lib)) return undefined;
  const out: Record<string, Uint8Array> = {};
  for (const n of files.names()) if (files.get(n) !== ctx.files.get(n)) out[n] = files.get(n)!;
  return { summary: 'Started the game from the starter level', files: out };
}

export interface BuildResult {
  won: boolean;
  /** The bot's last report. */
  report: string;
  /** The model's last words. */
  reply: string;
}

/** Builds the described game on the open one; `rounds` is how many times the model is asked to fix a game the bot can't win. */
export async function buildGame(
  agent: Agent,
  ctx: GameContext,
  description: string,
  opts: SendOptions & { rounds?: number; budgetMs?: number } = {},
): Promise<BuildResult> {
  const bot = GAME_TOOL_DEFS.find((d) => d.name === 'bot_playtest')!;
  let reply = await agent.send(buildBrief(description, agent.small), opts);
  let report: string;
  for (let round = 0; ; round++) {
    opts.signal?.throwIfAborted();
    report = resultText(await runTool(bot, { budget_ms: opts.budgetMs ?? 5000 }, ctx));
    const won = /"won":true/.test(report);
    if (won || round >= (opts.rounds ?? 2)) return { won, report, reply };
    reply = await agent.send(
      `The bot play-test can’t win the game yet: ${report.slice(0, 1200)}\nFix it so the bot can win (for example an exit link to scene 1 at a cell the hero can reach), then run bot_playtest. Then say in a few lines what you made and what to try next.`,
      opts,
    );
  }
}
