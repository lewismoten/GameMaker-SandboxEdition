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

// Plain-words title of one sub-agent task: its description with whitespace runs (newlines, tabs) folded to single
// spaces; with no description, "<agent type> task (<agent id>)"; with neither, "Untitled task (<agent id>)". Never empty.
export function taskTitle(meta: { description?: unknown; agentType?: unknown }, id: string): string {
  const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
  const description = clean(meta.description);
  if (description) return description;
  const type = clean(meta.agentType);
  return `${type ? `${type} task` : 'Untitled task'} (${id || 'unknown id'})`;
}

export const usageHead = ['started', 'ended', 'session', 'agent', 'title', 'model', 'type', 'task', 'state', 'input', 'cache_write', 'cache_read', 'output', 'total'];

// One CSV row (values, not yet quoted) for a sub-agent log file name, its optional meta.json and its counted usage.
export function usageRow(session: string, file: string, meta: Record<string, string | boolean>, u: Usage): (string | number)[] {
  const agent = file.replace(/^agent-|\.jsonl$/g, '');
  return [
    u.first ?? '',
    u.last ?? '',
    session,
    agent,
    taskTitle(meta, agent),
    u.models.join('+'),
    String(meta.agentType ?? ''),
    String(meta.description ?? ''),
    meta.finished ? 'completed' : 'running-or-stopped',
    u.input,
    u.cacheWrite,
    u.cacheRead,
    u.output,
    u.input + u.cacheWrite + u.cacheRead + u.output,
  ];
}

export const usageCsv = (rows: (string | number)[][]) => [usageHead, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
