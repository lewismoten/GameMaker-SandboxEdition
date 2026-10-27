// Small models often send a number as a string ("2"), a list as JSON text, or true as "true".
// The chat turns such arguments into what the tool's schema asks for before the tool checks
// them, so a call that means the right thing isn't refused for its quoting.
import type { JsonSchema } from '../tools/types';

function coerce(schema: JsonSchema | undefined, v: unknown): unknown {
  if (!schema) return v;
  if (typeof v === 'string') {
    const t = v.trim();
    if ((schema.type === 'integer' || schema.type === 'number') && /^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    if (schema.type === 'boolean' && /^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
    if ((schema.type === 'array' && t.startsWith('[')) || (schema.type === 'object' && t.startsWith('{')))
      try {
        return coerce(schema, JSON.parse(t));
      } catch {
        return v;
      }
  }
  if (schema.type === 'array' && Array.isArray(v)) return v.map((x) => coerce(schema.items, x));
  if (schema.type === 'object' && v && typeof v === 'object' && !Array.isArray(v))
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, coerce(schema.properties?.[k], x)]));
  return v;
}

/** The arguments as the schema wants them, where a plain reading of them allows. */
export function coerceArgs(schema: JsonSchema, args: Record<string, unknown>): Record<string, unknown> {
  return coerce(schema, args) as Record<string, unknown>;
}
