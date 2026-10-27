// The bridge between the MCP server (web/scripts/mcp/bridge.ts) and the editor open in a browser
// tab (client.ts): JSON messages over a WebSocket on 127.0.0.1. The tab says hello with the
// pairing code the server showed; until then the server sends nothing but a refusal. Then the
// server sends tool calls, the tab answers each with its result and tells the server what is
// open whenever that changes. Shared by both ends, with no DOM and no Node.
import type { ToolResult } from '../tools/types';

export const BRIDGE_VERSION = 1;
/** Messages bigger than this are refused (a screenshot is well under it). */
export const MAX_MESSAGE = 32 << 20;

/** What the editor has open, for the model's editor_state and the server's notes. */
export interface EditorState {
  project?: { id: string; name: string; gam: string };
  /** The file whose editor is open. */
  file?: string;
  /** The open editor's own settings in the address (its tab, the scene or block picked…). */
  selection?: Record<string, string>;
  /** A play test is running. */
  playing?: boolean;
  /** The Assistant's read-only switch (or a game opened only to look inside). */
  readOnly: boolean;
}

export type ToEditor =
  { type: 'welcome'; server: string } | { type: 'denied'; reason: string } | { type: 'call'; id: number; tool: string; args: Record<string, unknown> };

export type ToServer =
  { type: 'hello'; version: number; code: string; page: string } | { type: 'result'; id: number; result: ToolResult } | { type: 'state'; state: EditorState };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** A message for the editor, or undefined when the text isn't one. */
export function readToEditor(text: string): ToEditor | undefined {
  const m = parse(text);
  if (!m) return undefined;
  if (m.type === 'welcome' && typeof m.server === 'string') return { type: 'welcome', server: m.server };
  if (m.type === 'denied' && typeof m.reason === 'string') return { type: 'denied', reason: m.reason };
  if (m.type === 'call' && Number.isInteger(m.id) && typeof m.tool === 'string' && isObj(m.args))
    return { type: 'call', id: m.id as number, tool: m.tool, args: m.args };
  return undefined;
}

/** A message for the server, or undefined when the text isn't one. */
export function readToServer(text: string): ToServer | undefined {
  const m = parse(text);
  if (!m) return undefined;
  if (m.type === 'hello' && typeof m.version === 'number' && typeof m.code === 'string' && typeof m.page === 'string')
    return { type: 'hello', version: m.version, code: m.code, page: m.page };
  if (m.type === 'result' && Number.isInteger(m.id) && isObj(m.result) && Array.isArray(m.result.content))
    return { type: 'result', id: m.id as number, result: m.result as ToolResult };
  if (m.type === 'state' && isObj(m.state) && typeof m.state.readOnly === 'boolean') return { type: 'state', state: m.state as unknown as EditorState };
  return undefined;
}

function parse(text: string): Record<string, unknown> | undefined {
  if (text.length > MAX_MESSAGE) return undefined;
  try {
    const v: unknown = JSON.parse(text);
    return isObj(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

/** A new pairing code: six random digits, shown as 123-456. */
export function newPairingCode(random: (n: Uint32Array) => Uint32Array = (n) => crypto.getRandomValues(n)): string {
  const n = random(new Uint32Array(1))[0] % 1_000_000;
  const s = String(n).padStart(6, '0');
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

/** Whether a typed code is the pairing code (its digits only; compared in constant time). */
export function sameCode(typed: string, code: string): boolean {
  const a = typed.replace(/\D/g, '');
  const b = code.replace(/\D/g, '');
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Origins allowed to pair by default: the dev server and previews on this computer, and the published site. */
export function originAllowed(origin: string | undefined, extra: readonly string[] = []): boolean {
  if (!origin) return false;
  if (extra.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d{1,5}$/.test(origin)) return true;
  return origin === 'https://lewismoten.github.io';
}

/** A bridge address the user typed (a port, or ws://127.0.0.1:port), or undefined when it isn't on this computer. */
export function bridgeUrl(typed: string): string | undefined {
  const t = typed.trim();
  if (/^\d{2,5}$/.test(t)) return `ws://127.0.0.1:${t}`;
  const m = /^ws:\/\/(127\.0\.0\.1|localhost):(\d{2,5})\/?$/.exec(t);
  return m ? `ws://127.0.0.1:${m[2]}` : undefined;
}
