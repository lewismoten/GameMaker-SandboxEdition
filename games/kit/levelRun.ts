// The bot's game on a built disk, level after level (each game's tools/play.ts): runs each
// level's route, prints the bot's log when BOT_LOG is set, and fails unless a whole run wins
// without losing a life. check.ts, walkthrough.ts and gendemo.ts all play through it.
import type { GameSim } from './gameSim';

/** What a run needs of a game's bot: its sim, its log and a way to note a level done. */
export interface LevelBot {
  readonly sim: GameSim;
  log: string[];
  say(s: string): void;
}

export type Level<B> = (bot: B) => Promise<unknown>;

/** Plays `levels[0..upTo)` in a row; a run of every level must end won, and none may lose a life. */
export async function playLevels<B extends LevelBot>(bot: B, levels: Level<B>[], upTo = levels.length): Promise<void> {
  const { sim } = bot;
  for (const level of levels.slice(0, upTo)) {
    try {
      await level(bot);
    } finally {
      if (process.env.BOT_LOG) console.log(bot.log.join('\n'));
      bot.log.length = 0;
    }
    bot.say(`${level.name} done`);
  }
  if (upTo === levels.length && sim.ended !== 'won') throw new Error('The bot did not win');
  if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
}
