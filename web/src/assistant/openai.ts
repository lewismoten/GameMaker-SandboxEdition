// The tools as OpenAI-style function-calling definitions ({ type: 'function', function: { name,
// description, parameters } }), which OpenAI's Chat Completions API and Ollama's /api/chat and
// /v1 endpoints all take: for an in-page assistant that calls the user's own model directly.
// The schemas are already plain, flat JSON Schema, so they go across as they are.
import type { JsonSchema, ToolDef } from './tools/types';

export interface OpenAITool {
  type: 'function';
  function: { name: string; description: string; parameters: JsonSchema };
}

export function toOpenAITools(defs: readonly Pick<ToolDef, 'name' | 'description' | 'inputSchema'>[]): OpenAITool[] {
  return defs.map((d) => ({
    type: 'function',
    function: { name: d.name, description: d.description, parameters: structuredClone(d.inputSchema) },
  }));
}
