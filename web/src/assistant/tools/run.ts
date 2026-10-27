// Running a tool the same way on every transport: its arguments checked against its schema
// (types, ranges, enums, required; unknown keys refused, so a misspelled one is never quietly
// ignored), writes refused while read-only, and any error returned as an error result.
import { fail, ToolError, type Change, type GameContext, type JsonSchema, type ToolDef, type ToolResult } from './types';

function problem(schema: JsonSchema, v: unknown, at: string): string | undefined {
  switch (schema.type) {
    case 'string':
      if (typeof v !== 'string') return `${at} must be a string`;
      break;
    case 'boolean':
      if (typeof v !== 'boolean') return `${at} must be true or false`;
      break;
    case 'integer':
    case 'number':
      if (typeof v !== 'number' || !Number.isFinite(v)) return `${at} must be a number`;
      if (schema.type === 'integer' && !Number.isInteger(v)) return `${at} must be a whole number`;
      if (schema.minimum !== undefined && v < schema.minimum) return `${at} must be at least ${schema.minimum}`;
      if (schema.maximum !== undefined && v > schema.maximum) return `${at} must be at most ${schema.maximum}`;
      break;
    case 'array': {
      if (!Array.isArray(v)) return `${at} must be a list`;
      if (schema.maxItems !== undefined && v.length > schema.maxItems) return `${at} has more than ${schema.maxItems} items`;
      if (schema.items)
        for (let i = 0; i < v.length; i++) {
          const p = problem(schema.items, v[i], `${at}[${i}]`);
          if (p) return p;
        }
      break;
    }
    case 'object': {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return `${at} must be an object`;
      const o = v as Record<string, unknown>;
      for (const r of schema.required ?? []) if (o[r] === undefined) return `${at ? `${at}.` : ''}${r} is required`;
      for (const [k, x] of Object.entries(o)) {
        const s = schema.properties?.[k];
        if (!s) {
          if (schema.additionalProperties === false || schema.properties) return `unknown argument ${at ? `${at}.` : ''}${k}`;
          continue;
        }
        if (x === undefined) continue;
        const p = problem(s, x, at ? `${at}.${k}` : k);
        if (p) return p;
      }
      break;
    }
  }
  if (schema.enum && !schema.enum.includes(v as string | number)) return `${at} must be one of ${schema.enum.join(', ')}`;
  return undefined;
}

/** What is wrong with these arguments for this schema, or undefined. */
export function argsProblem(schema: JsonSchema, args: unknown): string | undefined {
  return problem(schema, args ?? {}, '');
}

/** "It takes: scene (required), name.": a tool's arguments, so a model that got them wrong can try again. */
function takes(schema: JsonSchema): string {
  const req = new Set(schema.required ?? []);
  const keys = Object.keys(schema.properties ?? {}).map((k) => (req.has(k) ? `${k} (required)` : k));
  return keys.length ? `It takes: ${keys.join(', ')}.` : 'It takes no arguments.';
}

/** Runs one tool: checks the arguments, refuses a write while read-only, and turns a throw into an error result. */
export async function runTool(def: ToolDef, args: unknown, ctx: GameContext): Promise<ToolResult> {
  const bad = argsProblem(def.inputSchema, args);
  if (bad) return fail(`${def.name}: ${bad}. ${takes(def.inputSchema)}`);
  const a = (args ?? {}) as Record<string, unknown>;
  if (def.writes && ctx.readOnly && !a.dry_run) return fail(`${def.name}: this game is read-only here, so nothing was changed. Try dry_run: true to preview.`);
  try {
    return await def.run(a, ctx);
  } catch (e) {
    if (e instanceof ToolError) return fail(e.message);
    return fail(`${def.name} failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** The dry_run flag every write tool takes. */
export const DRY_RUN: JsonSchema = { type: 'boolean', description: 'Only say what would change; change nothing.' };

/** Applies a change, or with dry_run only describes it. */
export async function commit(ctx: GameContext, args: Record<string, unknown>, change: Change, extra = ''): Promise<ToolResult> {
  const names = Object.entries(change.files ?? {}).map(([n, b]) => (b ? `${n} (${b.length} bytes${ctx.files.has(n) ? '' : ', new'})` : `${n} (deleted)`));
  if (change.player) names.push('the DOS player patches');
  const what = `${change.summary}. Files: ${names.join(', ') || 'none'}.${extra ? ` ${extra}` : ''}`;
  if (args.dry_run) return { content: [{ type: 'text', text: `Dry run, nothing changed. Would apply: ${what}` }] };
  await ctx.apply(change);
  return { content: [{ type: 'text', text: `Applied: ${what}` }] };
}
