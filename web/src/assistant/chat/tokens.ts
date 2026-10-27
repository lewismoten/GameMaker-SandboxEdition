// Counting the context: an estimate of tokens from characters (about four a token for English
// and JSON alike), used until the provider reports its own count, and the gauge's words.
import type { OpenAITool } from '../openai';
import type { ChatMessage } from './providers';

/** About how many tokens a text takes. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** A picture's rough cost for a model that sees (a small one, as the tools draw them). */
const PICTURE_TOKENS = 600;

export function messageTokens(m: ChatMessage): number {
  let n = 4 + estimateTokens(m.content);
  if (m.role === 'user' && m.images) n += m.images.length * PICTURE_TOKENS;
  if (m.role === 'assistant' && m.toolCalls) n += estimateTokens(JSON.stringify(m.toolCalls));
  return n;
}

export function messagesTokens(ms: readonly ChatMessage[]): number {
  return ms.reduce((n, m) => n + messageTokens(m), 0);
}

export function toolsTokens(tools: readonly OpenAITool[]): number {
  return tools.length ? estimateTokens(JSON.stringify(tools)) : 0;
}

/** What the gauge shows. */
export interface Gauge {
  used: number;
  limit: number;
  /** The provider counted it (else it is an estimate). */
  reported: boolean;
}

/** "3.1k" for 3100, "812" for 812. */
export function kTokens(n: number): string {
  return n >= 1000 ? `${(Math.round(n / 100) / 10).toString()}k` : String(Math.round(n));
}

/** "3.1k / 8k tokens (estimated)". */
export function gaugeText(g: Gauge): string {
  return `${kTokens(g.used)} / ${kTokens(g.limit)} tokens${g.reported ? '' : ' (estimated)'}`;
}

/** How full, 0 to 1. */
export function gaugeFill(g: Gauge): number {
  return g.limit > 0 ? Math.max(0, Math.min(1, g.used / g.limit)) : 0;
}
