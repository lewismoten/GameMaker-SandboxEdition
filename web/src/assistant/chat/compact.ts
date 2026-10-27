// Compaction: when the conversation nears the context's limit (or on Compact now), the older
// requests and everything after them are put away (they are already in the archive) and a short
// summary takes their place: the goal, what was decided, what changed in the game and the open
// to-dos. The model writes it when there is room for that; otherwise (or when that fails) it is
// put together from the turns themselves. The last few requests stay word for word.
import type { ChatMessage } from './providers';

/** Where each request starts (a message carrying a tool's picture is not one). */
export function requestStarts(ms: readonly ChatMessage[]): number[] {
  return ms.flatMap((m, i) => (m.role === 'user' && !m.images ? [i] : []));
}

/** The messages to put away and those to keep: the last `keep` requests stay. */
export function splitForCompaction(ms: readonly ChatMessage[], keep = 2): { old: ChatMessage[]; kept: ChatMessage[] } {
  const starts = requestStarts(ms);
  if (starts.length <= keep) return { old: [], kept: [...ms] };
  const at = starts[starts.length - keep];
  return { old: ms.slice(0, at), kept: ms.slice(at) };
}

const short = (s: string, n: number) => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** A summary put together from the turns, for a model too small to write one (or when it couldn't). */
export function fixedSummary(old: readonly ChatMessage[], before: string, todos: readonly string[] = []): string {
  const requests = old.flatMap((m) => (m.role === 'user' && !m.images ? [m.content] : []));
  const changes = old.flatMap((m) =>
    m.role === 'tool' && /^Applied: /.test(m.content) ? [short(m.content.replace(/^Applied: /, '').replace(/\. Files:.*$/s, ''), 90)] : [],
  );
  const lastWords = [...old].reverse().find((m) => m.role === 'assistant' && m.content.trim());
  const lines = [
    before ? `Before: ${short(before, 400)}` : '',
    requests.length ? `Goal: ${short(requests[0], 200)}` : '',
    requests.length > 1
      ? `Then asked: ${requests
          .slice(1, 4)
          .map((r) => short(r, 100))
          .join(' | ')}`
      : '',
    changes.length ? `Changed: ${changes.slice(-8).join('; ')}` : '',
    lastWords ? `Said: ${short(lastWords.content, 200)}` : '',
    todos.length
      ? `Open to-dos: ${todos
          .slice(0, 5)
          .map((t) => short(t, 80))
          .join('; ')}`
      : '',
  ].filter(Boolean);
  return lines.join('\n') || 'Nothing of note yet.';
}

/** The turns as compact text for the model to summarize, within `maxChars`. */
export function transcript(old: readonly ChatMessage[], maxChars: number): string {
  const lines = old.map((m) =>
    m.role === 'tool'
      ? `tool ${m.name}: ${short(m.content, 160)}`
      : m.role === 'assistant'
        ? `assistant: ${short(m.content || (m.toolCalls ?? []).map((c) => `called ${c.name}`).join(', '), 240)}`
        : `${m.role}: ${short(m.content, 240)}`,
  );
  let out = lines.join('\n');
  // the newest matter most: drop from the front
  while (out.length > maxChars && lines.length > 1) out = (lines.shift(), lines.join('\n'));
  return out.slice(-maxChars);
}

/** What the model is asked when it writes the summary itself. */
export function summaryMessages(old: readonly ChatMessage[], before: string, todos: readonly string[], maxChars: number): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'Summarize this chat about making a game, for yourself, in at most 100 words. Use these lines: Goal:, Decided:, Changed: (what changed in the game), To-do:. Facts only.',
    },
    {
      role: 'user',
      content: `${before ? `Earlier summary: ${before}\n` : ''}${todos.length ? `Open to-dos: ${todos.slice(0, 5).join('; ')}\n` : ''}Chat:\n${transcript(old, maxChars)}`,
    },
  ];
}
