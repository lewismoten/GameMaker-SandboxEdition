// Tools in groups, so a small model's context isn't filled with all of them: it starts with a
// few (the game's summary, load_tools, recall, the recipes and the bot), asks load_tools for a group when it
// needs one, and a group nobody used for a few requests is put away again (compaction puts them
// all away). The chat's copies of the definitions are terse: first sentences, short argument
// notes, and no dry_run (the chat has Apply and Skip).
import type { JsonSchema, ToolDef } from '../tools/types';
import type { AgentTool } from './agent';

export interface Category {
  id: string;
  about: string;
  tools: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'scenes', about: 'scenes, links, files', tools: ['get_scene', 'set_scene', 'add_scene', 'get_links', 'set_links', 'list_files', 'delete_file'] },
  { id: 'maps', about: 'map cells, placed monsters', tools: ['map_sketch', 'get_map', 'set_map'] },
  { id: 'blocks', about: 'block properties, pictures', tools: ['list_blocks', 'get_block', 'set_block'] },
  { id: 'monsters', about: 'monster moves, power', tools: ['get_monsters', 'set_monster'] },
  { id: 'hero', about: 'the hero: keys, moves, lives', tools: ['get_character', 'set_sequence', 'set_character'] },
  { id: 'art', about: 'palettes, pictures of the game', tools: ['get_palette', 'set_palette', 'render_png', 'editor_screenshot'] },
  { id: 'text', about: 'text screens, slide shows', tools: ['get_text', 'set_text', 'get_slides', 'set_slides'] },
  { id: 'checks', about: 'validate, Level check, walkthrough', tools: ['validate', 'level_check', 'record_walkthrough'] },
  { id: 'player', about: 'DOS player words, colors', tools: ['get_player_patches', 'set_player_patches'] },
  { id: 'editor', about: 'what the tab shows, open a file', tools: ['editor_state', 'editor_open_file'] },
];

/** Always offered (recipe is one small definition; its list of topics comes only when called). */
export const CORE = ['game_summary', 'load_tools', 'recall', 'recipe', 'todo', 'bot_playtest'];

/** A request after which an unused group is put away. */
const IDLE_REQUESTS = 4;

const firstSentence = (s: string, max: number) => {
  const cut = /^(.+?[.:;])(\s|$)/.exec(s)?.[1] ?? s;
  return cut.length > max ? `${cut.slice(0, max - 1)}…` : cut;
};

function terseSchema(s: JsonSchema): JsonSchema {
  const out: JsonSchema = { ...s };
  if (out.description) out.description = firstSentence(out.description, 60);
  if (s.properties) {
    out.properties = Object.fromEntries(
      Object.entries(s.properties)
        .filter(([k]) => k !== 'dry_run')
        .map(([k, v]) => [k, terseSchema(v)]),
    );
    if (s.required) out.required = s.required.filter((r) => r !== 'dry_run');
  }
  if (s.items) out.items = terseSchema(s.items);
  return out;
}

/** The chat's copy of a definition: shorter words, the same arguments (less dry_run). */
export function terse<T extends Pick<ToolDef, 'name' | 'description' | 'inputSchema'>>(d: T): T {
  return { ...d, description: firstSentence(d.description, 140), inputSchema: terseSchema(d.inputSchema) as T['inputSchema'] };
}

export const categoryOf = (tool: string) => CATEGORIES.find((c) => c.tools.includes(tool));

/** Which groups are out, and when each was last used. */
export class ToolSet {
  private loaded = new Map<string, number>();
  private request = 0;
  private readonly byName: Map<string, AgentTool>;

  constructor(
    private readonly all: AgentTool[],
    private readonly core: readonly string[] = CORE,
  ) {
    this.byName = new Map(all.map((t) => [t.def.name, t]));
  }

  /** A new request: groups unused for a while are put away. */
  nextRequest(): void {
    this.request++;
    for (const [id, last] of this.loaded) if (this.request - last > IDLE_REQUESTS) this.loaded.delete(id);
  }

  /** Takes out a group; the names of its tools, or undefined for no such group. */
  load(id: string): string[] | undefined {
    const c = CATEGORIES.find((x) => x.id === id);
    if (!c) return undefined;
    this.loaded.set(id, this.request);
    return c.tools.filter((t) => this.byName.has(t));
  }

  /** A tool was used: its group stays out (and comes out, for a model that called it unasked). True when it came out now. */
  touch(name: string): boolean {
    const c = categoryOf(name);
    if (!c) return false;
    const was = this.loaded.has(c.id);
    this.loaded.set(c.id, this.request);
    return !was;
  }

  reset(): void {
    this.loaded.clear();
  }

  /** Keeps out only the groups of these tools; false when that put nothing away. */
  keepOnly(tools: readonly string[]): boolean {
    const keep = new Set(tools.map((t) => categoryOf(t)?.id).filter(Boolean));
    const before = this.loaded.size;
    for (const id of [...this.loaded.keys()]) if (!keep.has(id)) this.loaded.delete(id);
    return this.loaded.size < before;
  }

  get loadedIds(): string[] {
    return [...this.loaded.keys()];
  }

  /** The groups that have tools here. */
  categories(): Category[] {
    return CATEGORIES.filter((c) => c.tools.some((t) => this.byName.has(t)));
  }

  /** The tools to offer now: the core, then the groups that are out. */
  active(): AgentTool[] {
    const names = new Set([...this.core, ...this.loadedIds.flatMap((id) => CATEGORIES.find((c) => c.id === id)!.tools)]);
    return this.all.filter((t) => names.has(t.def.name));
  }

  get(name: string): AgentTool | undefined {
    return this.byName.get(name);
  }

  get names(): Set<string> {
    return new Set(this.byName.keys());
  }
}
