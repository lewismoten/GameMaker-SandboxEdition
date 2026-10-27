// WebMCP with a fake browser model context (no browser has it on by default), and the tools
// as OpenAI-style function definitions.
import { describe, expect, it } from 'vitest';
import { modelContextOf, registerWebMcp, webMcpResult, type ModelContextLike, type OfferedTool } from './webmcp';
import { toOpenAITools } from './openai';
import { GAME_TOOL_DEFS } from './tools/index';

/** A model context as the draft has it: registerTool with an AbortSignal, async. */
function fakeContext() {
  const tools = new Map<string, Parameters<ModelContextLike['registerTool']>[0]>();
  const mc: ModelContextLike = {
    async registerTool(tool, options) {
      if (tools.has(tool.name)) throw new Error('duplicate');
      tools.set(tool.name, tool);
      options?.signal?.addEventListener('abort', () => tools.delete(tool.name));
    },
  };
  return { mc, tools };
}

const doc = (modelContext?: unknown) => ({ modelContext, querySelector: () => null, head: { append: () => undefined } }) as unknown as Document;

const offered: OfferedTool[] = [
  {
    name: 'get_thing',
    description: 'Reads.',
    inputSchema: { type: 'object', properties: {} },
    writes: false,
    run: async () => ({ content: [{ type: 'text', text: '{"a":1}' }] }),
  },
  {
    name: 'set_thing',
    description: 'Writes.',
    inputSchema: { type: 'object', properties: { n: { type: 'integer' } } },
    writes: true,
    run: async (a) => ({ content: [{ type: 'text', text: `set ${String(a.n)}` }] }),
  },
];

describe('WebMCP', () => {
  it('finds the model context on document, then on navigator, else nothing', () => {
    const { mc } = fakeContext();
    expect(modelContextOf(doc(mc), {} as Navigator)).toBe(mc);
    expect(modelContextOf(doc(), { modelContext: mc } as unknown as Navigator)).toBe(mc);
    expect(modelContextOf(doc(), {} as Navigator)).toBeUndefined();
    expect(modelContextOf(doc({}), {} as Navigator)).toBeUndefined();
  });

  it('registers the tools with read-only hints, runs them, and takes them back', async () => {
    const { mc, tools } = fakeContext();
    const stop = await registerWebMcp(mc, offered);
    expect([...tools.keys()]).toEqual(['get_thing', 'set_thing']);
    expect(tools.get('get_thing')!.annotations).toEqual({ readOnlyHint: true });
    expect(tools.get('set_thing')!.annotations?.readOnlyHint).toBeUndefined();
    expect(await tools.get('set_thing')!.execute({ n: 4 })).toBe('set 4');
    stop();
    expect(tools.size).toBe(0);
  });

  it('takes them back from Chrome’s first shape too, which had unregisterTool', async () => {
    const names = new Set<string>();
    const mc: ModelContextLike = { registerTool: (t) => void names.add(t.name), unregisterTool: (n) => void names.delete(n) };
    const stop = await registerWebMcp(mc, offered);
    expect(names.size).toBe(2);
    stop();
    expect(names.size).toBe(0);
  });

  it('hands a picture over as content blocks and words as a string', () => {
    expect(webMcpResult({ content: [{ type: 'text', text: 'hi' }] })).toBe('hi');
    expect(webMcpResult({ content: [{ type: 'image', data: 'AA==', mimeType: 'image/png' }] })).toEqual({
      content: [{ type: 'image', data: 'AA==', mimeType: 'image/png' }],
    });
    expect(webMcpResult({ content: [{ type: 'text', text: 'no' }], isError: true })).toEqual({ content: [{ type: 'text', text: 'no' }], isError: true });
  });
});

describe('toOpenAITools', () => {
  it('gives every tool as a function definition with its schema unchanged', () => {
    const out = toOpenAITools(GAME_TOOL_DEFS);
    expect(out).toHaveLength(GAME_TOOL_DEFS.length);
    const map = out.find((t) => t.function.name === 'set_map')!;
    expect(map.type).toBe('function');
    expect(map.function.parameters).toEqual(GAME_TOOL_DEFS.find((d) => d.name === 'set_map')!.inputSchema);
    // a copy: changing it leaves the definitions alone
    map.function.parameters.description = 'x';
    expect(GAME_TOOL_DEFS.find((d) => d.name === 'set_map')!.inputSchema.description).toBeUndefined();
    // plain JSON: no functions or undefined values for an API to choke on
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });
});
