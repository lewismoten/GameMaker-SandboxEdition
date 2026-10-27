// todo: the assistant's hand in the game's to-do list (todo.ts), so the next steps outlast the
// conversation. It lists the list in its groups (Doing, To do, a few of Done), the open items
// numbered; adds a few short ones; moves items to Doing; and ticks them done. The list is
// editor-only companion data, so it isn't a change to the game and is never asked about.
import { fail, text, type GameContext, type ToolDef } from '../tools/types';
import { runTool } from '../tools/run';
import type { AgentTool } from './agent';
import { addTodo, grouped, setDoing, setDone, todos, type TodoHost } from './todo';

const NUMBERS = (what: string) => ({
  type: 'array' as const,
  maxItems: 10,
  items: { type: 'integer' as const, minimum: 1, description: `An open item's number, to ${what}.` },
});

const spec: Omit<ToolDef, 'run'> = {
  name: 'todo',
  description: 'The game’s to-do list, kept between visits (Doing, To do, Done): lists it; add short next steps; start and done take item numbers.',
  inputSchema: {
    type: 'object',
    properties: {
      add: { type: 'array', maxItems: 5, items: { type: 'string', description: 'One short next step, e.g. "Add a second level: the locker room".' } },
      start: NUMBERS('move to Doing'),
      done: NUMBERS('tick done'),
    },
  },
};

/** The list as the model reads it: open items numbered, Doing first, then the latest few done. */
function listing(p: TodoHost): string {
  const g = grouped(todos(p));
  const open = [...g.doing, ...g.todo];
  if (!open.length && !g.done.length) return 'The to-do list is empty.';
  const lines: string[] = [];
  if (g.doing.length) lines.push('Doing:', ...g.doing.map((x, i) => `${i + 1}. ${x.text}`));
  if (g.todo.length) lines.push('To do:', ...g.todo.map((x, i) => `${g.doing.length + i + 1}. ${x.text}`));
  if (g.done.length)
    lines.push(
      `Done (${g.done.length}): ${g.done
        .slice(-3)
        .map((x) => x.text)
        .join('; ')}`,
    );
  return lines.join('\n');
}

/** The tool on the open game's list; `changed` redraws the panel's list. */
export function todoTool(ctx: GameContext, host: () => TodoHost | undefined, changed: () => void): AgentTool {
  const run: ToolDef['run'] = async (a) => {
    const p = host();
    if (!p) return fail('No game is open.');
    // the numbers are those of the list as last shown: Doing, then To do
    const g = grouped(todos(p));
    const open = [...g.doing, ...g.todo];
    for (const n of (a.start ?? []) as number[]) if (open[n - 1]) setDoing(p, open[n - 1].id, true);
    for (const n of (a.done ?? []) as number[]) if (open[n - 1]) setDone(p, open[n - 1].id, true);
    for (const t of (a.add ?? []) as string[]) addTodo(p, t, new Date(), 'ai');
    if (a.start || a.done || a.add) changed();
    return text(listing(p));
  };
  const def: ToolDef = { ...spec, run };
  return { def, run: (a) => runTool(def, a, ctx) };
}
