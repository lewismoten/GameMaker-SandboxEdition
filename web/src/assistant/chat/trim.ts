// Keeping the conversation inside a small model's context: tool results and pictures from before
// the latest request are cut short or dropped, and when it is still too long the
// oldest exchanges (a request and everything after it up to the next) go, whole, so a tool
// result is never left without the call it answers.
import type { ChatMessage } from './providers';

const OLD_RESULT = 400;

const size = (m: ChatMessage) =>
  m.content.length + ('images' in m && m.images ? m.images.length * 1500 : 0) + ('toolCalls' in m && m.toolCalls ? JSON.stringify(m.toolCalls).length : 0);

/** A copy of the messages that fits in about `budget` characters (the system message always stays). */
export function trimHistory(messages: readonly ChatMessage[], budget: number): ChatMessage[] {
  if (!messages.length) return [];
  // the latest request (a message carrying a tool's picture is not one)
  let lastRequest = -1;
  messages.forEach((m, i) => m.role === 'user' && !m.images?.length && (lastRequest = i));
  let out: ChatMessage[] = messages.map((m, i) => {
    if (i > lastRequest) return m;
    if (m.role === 'tool' && m.content.length > OLD_RESULT) return { ...m, content: `${m.content.slice(0, OLD_RESULT)}… (cut short)` };
    // (an empty list keeps it marked as a picture's message, not a request)
    if (m.role === 'user' && m.images?.length) return { role: 'user', content: `${m.content} (picture no longer shown)`, images: [] };
    return m;
  });
  const total = () => out.reduce((n, m) => n + size(m), 0);
  const head = out[0].role === 'system' ? 1 : 0;
  while (total() > budget) {
    // the oldest exchange: from the first message after the system one up to the next request
    const starts = out.map((m, i) => (i > head && m.role === 'user' && !m.images ? i : -1)).filter((i) => i > 0);
    const next = starts[0];
    if (next === undefined || next >= out.length - 1) break;
    out = [...out.slice(0, head), ...out.slice(next)];
  }
  return out;
}
