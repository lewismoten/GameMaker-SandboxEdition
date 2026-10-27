// WebMCP: offering the Assistant's tools to an AI agent built into the browser, through the W3C
// Web Machine Learning Community Group's draft (webmachinelearning.github.io/webmcp):
// `document.modelContext.registerTool({ name, description, inputSchema, execute, annotations },
// { signal })`, unregistered by aborting the signal. Chrome has it behind
// chrome://flags/#enable-webmcp-testing (146 and later) and as an origin trial (149 to 156); its
// first builds put it on `navigator.modelContext`, with a synchronous registerTool and an
// unregisterTool(name), which are used when that is all there is. Nothing happens in a browser
// without it, and nothing is registered until the person opts in from the Assistant.
import type { JsonSchema, ToolResult } from './tools/types';

/** The part of ModelContext used here (both the current draft's and Chrome's first shape). */
export interface ModelContextLike {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): Promise<void> | void;
  unregisterTool?(name: string): void;
}

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: { readOnlyHint?: boolean; consequentialHint?: boolean };
  execute(input: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<unknown>;
}

/** A tool to offer: its definition, whether it changes the game, and how to run it. */
export interface OfferedTool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  writes: boolean;
  run(args: Record<string, unknown>): Promise<ToolResult>;
}

/**
 * The origin trial token for the published site (developer.chrome.com/origintrials, "WebMCP",
 * for https://lewismoten.github.io), put in a meta tag when the person opts in. Empty: only a
 * browser with the flag on has WebMCP.
 */
const TRIAL_TOKEN = '';

/** Adds the origin trial token (once), so a browser in the trial turns WebMCP on for this page. */
function enableTrial(doc: Document): void {
  if (!TRIAL_TOKEN || doc.querySelector('meta[http-equiv="origin-trial"][data-webmcp]')) return;
  const meta = doc.createElement('meta');
  meta.httpEquiv = 'origin-trial';
  meta.content = TRIAL_TOKEN;
  meta.dataset.webmcp = '';
  doc.head.append(meta);
}

/** The browser's model context, or undefined when it has none. */
export function modelContextOf(doc: Document = document, nav: Navigator = navigator): ModelContextLike | undefined {
  enableTrial(doc);
  const mc = (doc as unknown as { modelContext?: ModelContextLike }).modelContext ?? (nav as unknown as { modelContext?: ModelContextLike }).modelContext;
  return mc && typeof mc.registerTool === 'function' ? mc : undefined;
}

/** A result as WebMCP hands it to the agent: words alone as a string, anything with a picture as MCP's content blocks. */
export function webMcpResult(r: ToolResult): unknown {
  if (r.content.every((c) => c.type === 'text') && !r.isError) return r.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n');
  return { content: r.content, ...(r.isError ? { isError: true } : {}) };
}

/** Registers the tools; resolves with the function that takes them all back. */
export async function registerWebMcp(mc: ModelContextLike, tools: readonly OfferedTool[]): Promise<() => void> {
  const stop = new AbortController();
  const done: string[] = [];
  for (const t of tools) {
    await mc.registerTool(
      {
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        ...(t.writes ? {} : { annotations: { readOnlyHint: true } }),
        execute: async (input) => webMcpResult(await t.run(input ?? {})),
      },
      { signal: stop.signal },
    );
    done.push(t.name);
  }
  return () => {
    stop.abort();
    // Chrome's first shape had no signal
    for (const n of done)
      try {
        mc.unregisterTool?.(n);
      } catch {
        /* already gone */
      }
  };
}
