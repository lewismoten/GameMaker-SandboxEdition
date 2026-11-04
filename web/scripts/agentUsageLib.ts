// Token totals of one agent session log (JSON lines). Used by agentUsage.ts.
// A streamed message can appear more than once with the same id, so usage is counted once per id.

export interface Usage {
  first?: string;
  last?: string;
  models: string[];
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
}

export function readUsage(jsonl: string): Usage {
  const seen = new Set<string>();
  const models = new Set<string>();
  const u: Usage = { models: [], input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  for (const line of jsonl.split('\n')) {
    if (!line) continue;
    let d: { timestamp?: string; type?: string; message?: { id?: string; model?: string; usage?: Record<string, number> } };
    try {
      d = JSON.parse(line);
    } catch {
      continue;
    }
    if (d.timestamp) {
      u.first ??= d.timestamp;
      u.last = d.timestamp;
    }
    const m = d.message;
    if (d.type !== 'assistant' || !m?.usage) continue;
    if (m.id) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
    }
    if (m.model && m.model !== '<synthetic>') models.add(m.model);
    u.input += m.usage.input_tokens ?? 0;
    u.cacheWrite += m.usage.cache_creation_input_tokens ?? 0;
    u.cacheRead += m.usage.cache_read_input_tokens ?? 0;
    u.output += m.usage.output_tokens ?? 0;
  }
  u.models = [...models];
  return u;
}

export const csvCell = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
