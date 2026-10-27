// What the chat knows of the model (does it see, does it think, how much context it was made
// for), the context limit that follows, and the conversation (Agent) for the open game and the
// settings: a new one when either changes, with its archive kept per game in sessionStorage.
import { normalize } from '../../project/files';
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import type { GameContext, ToolDef, ToolResult } from '../tools/types';
import { Agent } from './agent';
import { Archive, sessionArchive } from './archive';
import { chatTools } from './chatTools';
import { systemPrompt } from './prompt';
import { chat, looksLikeVision, ollamaModelInfo } from './providers';
import type { AiSettings } from './settings';

export interface ModelFacts {
  sees: boolean;
  thinking: boolean;
  /** The longest context the model was made for, when the server says. */
  contextLength?: number;
}

const facts = new Map<string, ModelFacts>();

/** What the model can do: asked of Ollama once a model, else guessed from its name. */
export async function modelFacts(s: AiSettings): Promise<ModelFacts> {
  const key = `${s.provider}|${s.baseUrl}|${s.model}`;
  const known = facts.get(key);
  let f: ModelFacts = known ?? { sees: looksLikeVision(s.model), thinking: false };
  if (!known && s.provider === 'ollama')
    try {
      const info = await ollamaModelInfo(s, fetch, AbortSignal.timeout(8000));
      f = {
        sees: info.capabilities ? info.capabilities.includes('vision') : f.sees,
        thinking: !!info.capabilities?.includes('thinking'),
        contextLength: info.contextLength,
      };
    } catch {
      /* the name's guess */
    }
  facts.set(key, f);
  return { ...f, sees: s.images === 'auto' ? f.sees : s.images === 'on' };
}

/** The context the chat keeps within: the setting, but no more than the model was made for. */
export function contextLimit(s: AiSettings, f: ModelFacts): number {
  return Math.max(2048, Math.min(s.contextTokens, f.contextLength ?? Infinity));
}

/** The game's summary for the system prompt, worked out again only when the game's .gam or file list changed. */
function briefOf(ctx: GameContext): () => Promise<string> {
  let key: unknown;
  let size = -1;
  let brief = '';
  return async () => {
    const gam = ctx.files.get(normalize(ctx.gam));
    if (gam !== key || ctx.files.size !== size) {
      key = gam;
      size = ctx.files.size;
      brief = resultText(await runTool(GAME_TOOL_DEFS[0], {}, ctx));
    }
    return brief;
  };
}

const resultText = (r: ToolResult) => r.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n');

let current: { key: string; agent: Agent } | undefined;

export interface SessionNeeds {
  ctx: GameContext;
  projectId: string;
  tab: { specs: Omit<ToolDef, 'run'>[]; run: (name: string, args: Record<string, unknown>) => Promise<ToolResult> };
  facts: () => ModelFacts;
  todos: () => string[];
}

/** The conversation for this game and these settings. */
export function sessionAgent(s: AiSettings, n: SessionNeeds): Agent {
  const key = `${n.projectId}|${s.provider}|${s.baseUrl}|${s.model}|${s.tools}|${s.contextTokens}|${s.think}|${s.images}`;
  if (current?.key === key) return current.agent;
  const brief = briefOf(n.ctx);
  const agent = new Agent({
    chat: (req) => chat(s, req),
    tools: chatTools(n.ctx, n.tab),
    system: async (compact) => systemPrompt({ summary: await brief(), readOnly: n.ctx.readOnly, images: n.facts().sees, compact }),
    images: () => n.facts().sees,
    limit: () => contextLimit(s, n.facts()),
    archive: new Archive(sessionArchive(n.projectId)),
    todos: n.todos,
    allTools: () => s.tools === 'all',
    // Ollama's switch, only for a model that thinks
    think: () => (s.provider === 'ollama' && n.facts().thinking ? s.think : undefined),
  });
  current = { key, agent };
  return agent;
}

/** Forgets the conversation (another game opened). */
export function endSession(): void {
  current = undefined;
}
