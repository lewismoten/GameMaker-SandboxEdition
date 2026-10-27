// Tool calls a model writes as text ({"name": …, "arguments": {…}}, bare, in a ```json fence or
// in <tool_call> tags, or wrapped as {"type": "function", "function": {…}}, several in one reply), found while the reply streams: a call counts as
// soon as its closing brace arrives, so it can run while the model writes on. The words shown
// leave the calls out, and hold back a call still being written.

export interface TextCall {
  name: string;
  args: Record<string, unknown>;
  /** Where it was in the text. */
  start: number;
  end: number;
}

const HEAD = /^\{\s*"(?:name|tool|function)"\s*:\s*"([A-Za-z_][\w]*)"/;
const STARTS = ['{"name":"', '{"tool":"', '{"function":"', '{"type":"function","function":{"name":"'];
/** The OpenAI-style wrapper round a call, `{"type": "function", "function": ` … `}`. */
const WRAP_OPEN = /\{\s*"type"\s*:\s*"function"\s*,\s*"function"\s*:\s*$/;
const WRAP_CLOSE = /^\s*\}/;

/** Whether the text from a brace to the end could still become a call's start. */
function maybeHead(tail: string): boolean {
  const t = tail.replace(/\s+/g, '');
  return STARTS.some((s) => s.startsWith(t) || (t.startsWith(s) && /^\w*$/.test(t.slice(s.length))));
}

/** The end of the JSON object starting at `i` (index after its closing brace), or -1 while it is unfinished. */
function objectEnd(text: string, i: number): number {
  let depth = 0;
  let inString = false;
  for (let k = i; k < text.length; k++) {
    const c = text[k];
    if (inString) {
      if (c === '\\') k++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return k + 1;
  }
  return -1;
}

/** Widens a call's span over a wrapper, fence or tags around it (and an array's comma). */
function widen(text: string, start: number, end: number): [number, number] {
  const wrap = WRAP_OPEN.exec(text.slice(0, start));
  const shut = WRAP_CLOSE.exec(text.slice(end));
  if (wrap && shut) [start, end] = [start - wrap[0].length, end + shut[0].length];
  const before = text.slice(0, start);
  const after = text.slice(end);
  const open = /(```(?:json|tool_call)?\s*|<tool_call>\s*|\[\s*|,\s*)$/.exec(before);
  const close = /^(\s*```|\s*<\/tool_call>|\s*\]|\s*,)/.exec(after);
  return [open ? start - open[1].length : start, close ? end + close[1].length : end];
}

/** The calls written so far, the words to show, and whether a call is still being written. */
export function scanText(text: string, names: ReadonlySet<string>): { calls: TextCall[]; shown: string; pending: boolean } {
  const calls: TextCall[] = [];
  const cut: [number, number][] = [];
  let pendingAt = -1;
  for (let i = text.indexOf('{'); i >= 0 && i < text.length; i = text.indexOf('{', i + 1)) {
    const rest = text.slice(i, i + 60);
    const head = HEAD.exec(rest);
    if (!head) {
      if (maybeHead(text.slice(i))) {
        pendingAt = i;
        break;
      }
      continue;
    }
    const end = objectEnd(text, i);
    if (end < 0) {
      pendingAt = i;
      break;
    }
    try {
      const v = JSON.parse(text.slice(i, end)) as {
        name?: unknown;
        tool?: unknown;
        function?: unknown;
        arguments?: unknown;
        parameters?: unknown;
        args?: unknown;
      };
      const name = String(v.name ?? v.tool ?? v.function);
      const raw = v.arguments ?? v.parameters ?? v.args ?? {};
      const args = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      if (names.has(name) && args && typeof args === 'object' && !Array.isArray(args)) {
        // a wrapped call counts once its wrapper's brace arrives too
        if (WRAP_OPEN.test(text.slice(0, i)) && !text.slice(end).trim()) {
          pendingAt = i;
          break;
        }
        calls.push({ name, args: args as Record<string, unknown>, start: i, end });
        cut.push(widen(text, i, end));
      }
    } catch {
      /* not a call after all */
    }
    i = end - 1;
  }
  let shown = '';
  let at = 0;
  for (const [s, e] of cut) {
    // spans widened over a shared comma may overlap
    shown += text.slice(at, Math.max(at, s));
    at = Math.max(at, e);
  }
  shown += text.slice(at, pendingAt >= 0 ? Math.max(at, pendingAt) : text.length);
  // a fence or tag left open just before a call still arriving
  if (pendingAt >= 0) shown = shown.replace(WRAP_OPEN, '').replace(/(```(?:json|tool_call)?|<tool_call>|\[)\s*$/, '');
  shown = shown.replace(/\n{3,}/g, '\n\n').trim();
  // a lone ";" or "," left between calls is no reply
  return { calls, shown: /^[;,.:]*$/.test(shown) ? '' : shown, pending: pendingAt >= 0 };
}
