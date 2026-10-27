// The context's messages as sent: tool results from before the latest request are cut short
// (the archive keeps them whole; recall reads them), and pictures from before it are dropped.
import type { ChatMessage } from './providers';

const OLD_RESULT = 300;

/** A copy of the messages ready to send. */
export function prepareHistory(messages: readonly ChatMessage[]): ChatMessage[] {
  // the latest request (a message carrying a tool's picture is not one)
  let lastRequest = -1;
  messages.forEach((m, i) => m.role === 'user' && !m.images && (lastRequest = i));
  return messages.map((m, i) => {
    if (i > lastRequest) return m;
    if (m.role === 'tool' && m.content.length > OLD_RESULT) return { ...m, content: `${m.content.slice(0, OLD_RESULT)}… (cut short; recall has it all)` };
    // (an empty list keeps it marked as a picture's message, not a request)
    if (m.role === 'user' && m.images?.length) return { role: 'user', content: `${m.content} (picture no longer shown)`, images: [] };
    return m;
  });
}
