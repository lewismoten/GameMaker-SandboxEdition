// The recipe tool: short how-tos for kinds of levels and the parts they are made of (recipes/),
// so a small model can ask how a platformer or a locked door is built, in the tools' own words,
// without the whole library in its context. No topic lists them, a line each. It needs no game.
import { KIND_RECIPES } from './recipes/kinds';
import { PART_RECIPES } from './recipes/parts';
import { text, type ToolDef } from './types';

export interface Recipe {
  /** What the model asks for (letters and _). */
  id: string;
  /** A few words for the list. */
  about: string;
  /** Numbered steps naming tools as tool(arg: value). */
  text: string;
}

export const RECIPES: readonly Recipe[] = [...KIND_RECIPES, ...PART_RECIPES];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

/** Words that say nothing about which recipe. */
const COMMON = new Set(['an', 'the', 'to', 'of', 'and', 'or', 'at', 'in', 'on', 'how', 'make', 'build', 'level', 'game', 'with', 'for', 'you', 'is', 'it']);

/** The recipe a model meant: its id, or one whose id or words share the most with what was asked. */
function find(topic: string): Recipe | undefined {
  const t = norm(topic);
  const exact = RECIPES.find((r) => r.id === t);
  if (exact) return exact;
  const words = t.split('_').filter((w) => w.length > 1 && !COMMON.has(w));
  let best: Recipe | undefined;
  let score = 0;
  for (const r of RECIPES) {
    const mine = norm(`${r.id} ${r.about}`)
      .split('_')
      .filter((m) => m.length > 1);
    const n = words.filter((w) => mine.some((m) => m.startsWith(w) || w.startsWith(m))).length;
    if (n > score) [best, score] = [r, n];
  }
  return best;
}

const list = () => `Recipes (recipe with a topic reads one):\n${RECIPES.map((r) => `${r.id}: ${r.about}`).join('\n')}`;

export const RECIPE_TOOL: ToolDef = {
  name: 'recipe',
  noGame: true,
  // one sentence, so the chat's terse copy keeps all of it
  description: 'Lists how-tos for kinds of level (platformer, keys and locks, shooter…) with no topic, or reads the named one before you build that kind.',
  inputSchema: { type: 'object', properties: { topic: { type: 'string', description: 'A topic from the list.' } } },
  async run(a) {
    const asked = typeof a.topic === 'string' ? a.topic.trim() : '';
    if (!asked) return text(list());
    const r = find(asked);
    return r ? text(`${r.id}\n${r.text}`) : text(`No recipe for "${asked}". ${list()}`);
  },
};
