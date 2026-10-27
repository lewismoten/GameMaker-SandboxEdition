// The Assistant: the editor's panel for letting an AI tool on this computer work on the open
// game through the MCP server's bridge (client.ts). Nothing connects until the person types the
// port and pairing code the server shows. While connected, a chip in the corner says so with a
// Disconnect button, every change shows a toast with Undo, and a read-only switch keeps the
// assistant to looking. Loaded only when the Assistant button is first pressed.
import { h, clear } from '../../editor/core/ui';
import { assistantHost, onAssistantHost } from '../hostSlot';
import { bridgeUrl } from './protocol';
import { BridgeClient } from './client';
import { EditorContext } from './editorContext';
import { runInTab } from './editorAdapters';
import { EDITOR_TOOL_SPECS } from './editorTools';
import { GAME_TOOL_DEFS } from '../tools/index';
import { modelContextOf, registerWebMcp, type OfferedTool } from '../webmcp';
import './panel.css';

const READ_ONLY_KEY = 'gm-assistant-read-only';
const PORT_KEY = 'gm-assistant-port';

const stored = (k: string) => {
  try {
    return localStorage.getItem(k) ?? '';
  } catch {
    return '';
  }
};
const store = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: not remembered */
  }
};

let readOnly = stored(READ_ONLY_KEY) === '1';
const activity: { tool: string; ok: boolean }[] = [];

const toasts = h('div', { class: 'toasts assistant-toasts', role: 'status', 'aria-live': 'polite' });

/** A change the assistant made: its words, Undo, and a close button; it goes after a while unless focused or hovered. */
function changeToast(summary: string, undo: () => void): void {
  if (!toasts.isConnected) document.body.append(toasts);
  const t = h(
    'div',
    { class: 'toast' },
    h('span', null, `Assistant: ${summary}`),
    h('button', { class: 'toast-undo', onclick: () => (undo(), t.remove()) }, 'Undo'),
    h('button', { class: 'toast-close', 'aria-label': 'Dismiss', title: 'Dismiss', onclick: () => t.remove() }, '×'),
  );
  toasts.append(t);
  let timer = 0;
  const start = () => (timer = window.setTimeout(() => t.remove(), 12_000));
  const stop = () => clearTimeout(timer);
  t.addEventListener('pointerenter', stop);
  t.addEventListener('pointerleave', start);
  t.addEventListener('focusin', stop);
  t.addEventListener('focusout', start);
  start();
}

const ctx = new EditorContext(assistantHost, { readOnly: () => readOnly, changed: changeToast });
const client = new BridgeClient(ctx, assistantHost, () => readOnly);

// ---- WebMCP: the same tools offered to the browser's own AI agent (assistant/webmcp.ts) ----------

/** Tools of the tab's that change something, beside the shared tools marked as writes. */
const TAB_WRITES = new Set(['editor_open_file', 'editor_play', 'editor_stop_play', 'editor_undo']);
const offered: OfferedTool[] = [
  ...GAME_TOOL_DEFS.map((d) => ({ name: d.name, description: d.description, inputSchema: d.inputSchema, writes: !!d.writes })),
  ...EDITOR_TOOL_SPECS.map((d) => ({ name: d.name, description: d.description, inputSchema: d.inputSchema, writes: TAB_WRITES.has(d.name) })),
].map((t) => ({
  ...t,
  run: async (args: Record<string, unknown>) => {
    const r = await runInTab(t.name, args, ctx, assistantHost(), readOnly);
    noteCall(`${t.name} (WebMCP)`, !r.isError);
    return r;
  },
}));
let unregister: (() => void) | undefined;

async function setWebMcp(on: boolean): Promise<void> {
  unregister?.();
  unregister = undefined;
  webMcpBox.checked = false;
  const mc = on ? modelContextOf() : undefined;
  if (on && !mc) return show();
  if (mc)
    try {
      unregister = await registerWebMcp(mc, offered);
      webMcpBox.checked = true;
    } catch (e) {
      return show(`The browser didn’t take the tools: ${e instanceof Error ? e.message : String(e)}`);
    }
  show();
}

const webMcpBox = h('input', { id: 'assistant-webmcp', type: 'checkbox', onchange: () => void setWebMcp(webMcpBox.checked) });
const webMcpNote = h('p', { class: 'hint assistant-webmcp-note' });

// ---- the chip that shows while connected ------------------------------------------------------

let chipText: HTMLElement;

const chip = h(
  'div',
  { class: 'assistant-chip', role: 'region', 'aria-label': 'Assistant connection' },
  h(
    'button',
    { class: 'assistant-chip-open', title: 'Open the Assistant', onclick: () => openAssistant() },
    h('span', { 'aria-hidden': 'true' }, '✦ '),
    (chipText = h('span', null, 'Assistant connected')),
  ),
  h('button', { class: 'assistant-chip-off', onclick: () => (client.disconnect(), void setWebMcp(false)) }, 'Disconnect'),
);

// ---- the panel --------------------------------------------------------------------------------

const status = h('p', { class: 'assistant-status', role: 'status', 'aria-live': 'polite' });
const port = h('input', { id: 'assistant-port', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: 'e.g. 51234', value: stored(PORT_KEY) });
const code = h('input', { id: 'assistant-code', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '123-456' });
const connectBtn = h('button', { type: 'submit', class: 'primary' }, 'Connect');
const disconnectBtn = h('button', { type: 'button', onclick: () => client.disconnect() }, 'Disconnect');
const readOnlyBox = h('input', {
  id: 'assistant-read-only',
  type: 'checkbox',
  checked: readOnly,
  onchange: () => {
    readOnly = readOnlyBox.checked;
    store(READ_ONLY_KEY, readOnly ? '1' : '');
    client.sendState();
  },
});
const log = h('ul', { class: 'assistant-log', 'aria-label': 'What the assistant did' });

const form = h(
  'form',
  {
    class: 'assistant-form',
    onsubmit: (e: Event) => {
      e.preventDefault();
      const url = bridgeUrl(port.value);
      if (!url) return show('Type the port the MCP server shows (a number), or its ws://127.0.0.1 address.');
      if (code.value.replace(/\D/g, '').length !== 6) return show('Type the six-digit pairing code the MCP server shows.');
      store(PORT_KEY, port.value.trim());
      client.connect(url, code.value);
      code.value = '';
    },
  },
  h('label', { for: 'assistant-port' }, 'Port'),
  port,
  h('label', { for: 'assistant-code' }, 'Pairing code'),
  code,
  h('div', { class: 'assistant-actions' }, connectBtn, disconnectBtn),
);

const panel = h(
  'dialog',
  { class: 'modal assistant-panel', 'aria-labelledby': 'assistant-title' },
  h(
    'header',
    { class: 'modal-head' },
    h('h2', { id: 'assistant-title' }, h('span', { 'aria-hidden': 'true' }, '✦ '), 'Assistant'),
    h('button', { class: 'modal-close', 'aria-label': 'Close', title: 'Close (Esc)', onclick: () => panel.close() }, '×'),
  ),
  h(
    'p',
    { class: 'hint' },
    'Let an AI tool on this computer look at and change this game through the Game-Maker MCP server. Start it with ',
    h('code', null, 'npm run mcp -- --bridge'),
    ', or ask your AI tool to start the editor bridge, then type the port and pairing code it shows.',
  ),
  status,
  form,
  h('p', { class: 'assistant-check' }, readOnlyBox, h('label', { for: 'assistant-read-only' }, 'Read-only: it can look, but change nothing')),
  h('h3', null, 'The browser’s own AI agent'),
  h('p', { class: 'assistant-check' }, webMcpBox, h('label', { for: 'assistant-webmcp' }, 'Offer these tools to it (WebMCP)')),
  webMcpNote,
  h('h3', null, 'Recent'),
  log,
);
panel.addEventListener('cancel', () => panel.close());

function show(message?: string): void {
  const s = client.status;
  status.dataset.state = s;
  status.textContent =
    message ??
    (s === 'connected'
      ? `Connected${readOnly ? ', read-only' : ''}. The assistant can ${readOnly ? 'look at' : 'read and change'} the game open here.`
      : s === 'connecting'
        ? 'Connecting…'
        : client.reason || 'Not connected.');
  connectBtn.hidden = s === 'connected' || s === 'connecting';
  disconnectBtn.hidden = !connectBtn.hidden;
  port.disabled = code.disabled = connectBtn.hidden;
  const webMcp = !!unregister;
  const on = s === 'connected' || webMcp;
  chipText.textContent = s === 'connected' ? `Assistant connected${webMcp ? ' · WebMCP on' : ''}` : 'WebMCP tools on';
  if (on) {
    if (!chip.isConnected) document.body.append(chip);
  } else chip.remove();
  for (const b of document.querySelectorAll<HTMLElement>('.assistant-btn')) b.dataset.connected = String(on);
  const has = !!modelContextOf();
  webMcpBox.disabled = !has;
  webMcpNote.textContent = has
    ? webMcp
      ? `${offered.length} tools offered to the browser’s agent${readOnly ? ', read-only' : ''}.`
      : 'This browser has WebMCP: its agent may use the same tools on this game once you tick the box.'
    : 'This browser has no WebMCP. Chrome has it behind chrome://flags/#enable-webmcp-testing, and in an origin trial.';
  clear(
    log,
    ...(activity.length
      ? activity.map((a) => h('li', { class: a.ok ? '' : 'failed' }, `${a.tool}${a.ok ? '' : ' (refused or failed)'}`))
      : [h('li', null, 'Nothing yet.')]),
  );
}

client.onStatus = () => show();
function noteCall(tool: string, ok: boolean): void {
  activity.unshift({ tool, ok });
  activity.length = Math.min(activity.length, 6);
  show();
}
client.onCall = noteCall;
// another project opened, or the home page shown: the server hears what is open now
onAssistantHost(() => (client.sendState(), show()));

/** Opens the Assistant panel, with the focus on the field to fill next. */
export function openAssistant(): void {
  if (!panel.isConnected) document.body.append(panel);
  show();
  if (!panel.open) panel.show();
  (client.status === 'connected' ? readOnlyBox : port.value ? code : port).focus();
}
