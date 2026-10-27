// The Assistant chat: the editor's side panel (full screen on phones) where the person's own AI
// (settings.ts) works on the open game with the shared tools, through the same in-page adapters
// as the bridge (bridge/editorContext.ts, bridge/editorAdapters.ts). Changes apply live with an
// Undo toast; in "Ask before changing" each waits for Apply or Skip, and the shared read-only
// switch keeps the AI to looking. Tool calls run as they arrive and the editor moves to each
// change (showChange.ts). A gauge shows how full the model's context is, with Compact now and
// Reset (session.ts, agent.ts). It also holds the game's to-do list and "What should I do next?"
// (coach.ts), and the Describe a game box (makeGame.ts). Loaded when ✦ is first pressed.
import { h } from '../../editor/core/ui';
import type { Game } from '../../formats/game';
import { setHashParams } from '../../urlState';
import { assistantHost, onAssistantHost, type AssistantHost } from '../hostSlot';
import { EditorContext } from '../bridge/editorContext';
import { runInTab } from '../bridge/editorAdapters';
import { EDITOR_TOOL_SPECS } from '../bridge/editorTools';
import { assistantReadOnly, onAssistantReadOnly, setAssistantReadOnly } from '../shared/readOnlySwitch';
import { changeToast } from '../shared/changeToast';
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import { resultText, type AgentEvent } from './agent';
import { copyText } from './clipboard';
import { gatherResults } from './coach';
import { diagnose, precheck, reachable } from './diagnose';
import { ChatLog } from './log';
import { buildGame, hasNoLevel, starterChange } from './makeGame';
import { coachBrief, listItems, systemPrompt } from './prompt';
import { ProviderError, chat, chatUrl } from './providers';
import { endSession, modelFacts, sessionAgent, type ModelFacts } from './session';
import { isReady, loadSettings, modelLabel, type AiSettings } from './settings';
import { changePlace } from './showChange';
import { addCredit, refreshTodos, todos } from './todo';
import { gaugeFill, gaugeText, type Gauge } from './tokens';
import { todoView } from './todoView';
import './chat.css';

const MODE_KEY = 'gm-assistant-mode';
/** "Make a game about …", "create me a platform game where …". */
const MAKE_GAME = /^\s*(?:please\s+)?(?:make|create|build|design)\s+(?:me\s+)?(?:a|an|my)\s+(?:\w+\s+)?game\b/i;
type Mode = 'ask' | 'free';
let mode: Mode = (() => {
  try {
    return localStorage.getItem(MODE_KEY) === 'free' ? 'free' : 'ask';
  } catch {
    return 'ask';
  }
})();

let settings: AiSettings | undefined = loadSettings();
/** What the chosen model can do (found when work starts). */
let facts: ModelFacts = { sees: false, thinking: false };

const host = () => assistantHost();
/** The last change's Undo, for its line in the chat. */
let lastUndo: (() => void) | undefined;
const ctx = new EditorContext(host, {
  readOnly: () => assistantReadOnly(),
  changed: (summary, undo) => {
    changeToast(summary, undo);
    lastUndo = undo;
    // the game says which AI helped make it (its downloads' About text)
    const p = host()?.project;
    if (settings && p && !p.readOnly)
      try {
        addCredit(p, modelLabel(settings));
      } catch {
        /* a look-inside game keeps nothing */
      }
  },
});

const tab = { specs: EDITOR_TOOL_SPECS, run: (name: string, args: Record<string, unknown>) => runInTab(name, args, ctx, host(), assistantReadOnly()) };

/** The conversation for the open game and these settings. */
const agentNow = (s: AiSettings, hst: AssistantHost) =>
  sessionAgent(s, {
    ctx,
    projectId: hst.project.id,
    tab,
    facts: () => facts,
    todos: () => {
      try {
        return todos(hst.project)
          .filter((x) => !x.done)
          .sort((x, y) => Number(!!y.doing) - Number(!!x.doing))
          .map((x) => (x.doing ? `(doing) ${x.text}` : x.text));
      } catch {
        return [];
      }
    },
    todoHost: () => host()?.project,
    todosChanged: () => todo.render(),
  });

/** Moves the editor to a change, and lights the editor up for a moment. */
function showChange(hst: AssistantHost, place: ReturnType<typeof changePlace>): void {
  if (!place || hst.playing || !hst.project.files.has(place.file)) return;
  if (hst.currentFile !== place.file || place.params) {
    hst.open(place.file);
    if (place.params) setHashParams(place.params, ['p', hst.project.id, place.file]);
    // the editor reads the address as it opens: open it again for the place to take
    if (place.params && hst.currentFile === place.file) hst.open(place.file);
  }
  const area = hst.editorArea;
  area.classList.remove('assistant-changed');
  void area.offsetWidth;
  area.classList.add('assistant-changed');
  setTimeout(() => area.classList.remove('assistant-changed'), 1200);
}

// ---- the panel --------------------------------------------------------------------------------

const log = new ChatLog();
const modelText = h('span', { class: 'chat-model' });
const setupBtn = h('button', { type: 'button', class: 'chat-setup', onclick: () => void setup() }, h('span', { 'aria-hidden': 'true' }, '⚙ '), 'AI setup');
const modeSel = h(
  'select',
  {
    id: 'chat-mode',
    onchange: () => {
      mode = modeSel.value === 'free' ? 'free' : 'ask';
      try {
        localStorage.setItem(MODE_KEY, mode);
      } catch {
        /* not remembered */
      }
    },
  },
  h('option', { value: 'ask', selected: mode === 'ask' }, 'Ask before changing'),
  h('option', { value: 'free', selected: mode === 'free' }, 'Change freely (Undo still works)'),
);
const readOnlyBox = h('input', {
  id: 'chat-read-only',
  type: 'checkbox',
  checked: assistantReadOnly(),
  onchange: () => setAssistantReadOnly(readOnlyBox.checked),
});
onAssistantReadOnly((v) => ((readOnlyBox.checked = v), render()));
const coachBtn = h('button', { type: 'button', class: 'chat-coach', onclick: () => void coach() }, 'What should I do next?');

// the context gauge, with Compact now and Reset
const gaugeWords = h('span', { id: 'chat-gauge-words' }, '');
const gaugeBar = h('meter', { id: 'chat-gauge', min: 0, max: 1, value: 0, 'aria-labelledby': 'chat-gauge-label chat-gauge-words' });
const compactBtn = h(
  'button',
  { type: 'button', class: 'chat-small', title: 'Put older turns away for a short summary, now', onclick: () => void compactNow() },
  'Compact now',
);
const resetBtn = h(
  'button',
  {
    type: 'button',
    class: 'chat-small',
    title: 'Start a fresh context; the earlier conversation stays in the archive (recall can read it)',
    onclick: () => resetContext(),
  },
  'Reset',
);
const status = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
let gauge: Gauge | undefined;
function showGauge(g?: Gauge): void {
  if (g) gauge = g;
  const shown = gauge ?? { used: 0, limit: settings?.contextTokens ?? 0, reported: false };
  gaugeWords.textContent = gaugeText(shown);
  gaugeBar.value = gaugeFill(shown);
  gaugeBar.dataset.level = gaugeFill(shown) > 0.85 ? 'high' : gaugeFill(shown) > 0.6 ? 'mid' : 'low';
}
/** Copies, and says so for a moment. */
log.copy = (t) =>
  void copyText(t).then((ok) => {
    status.textContent = ok ? 'Copied' : 'Couldn’t copy';
    copied.textContent = ok ? 'Copied' : 'Couldn’t copy';
    setTimeout(() => (copied.textContent = status.textContent = ''), 1500);
  });
const copied = h('span', { class: 'chat-copied', 'aria-hidden': 'true' });
const copyAllBtn = h(
  'button',
  { type: 'button', class: 'chat-copy-all', 'aria-label': 'Copy whole chat', title: 'Copy whole chat', onclick: () => log.copy?.(log.markdown()) },
  h('span', { 'aria-hidden': 'true' }, '⧉'),
);
const todo = todoView(() => host()?.project, { ask: (t) => void send(`From the to-do list, please do this: ${t}`), canAsk: () => !busy && isReady(settings) });

const describeText = h('textarea', {
  id: 'chat-describe',
  rows: 3,
  maxLength: 1000,
  placeholder: 'A friendly robot collects lost socks in a laundromat maze…',
});
const describeBtn = h('button', { type: 'submit', class: 'primary' }, 'Build it');
const describeBox = h(
  'form',
  { class: 'chat-describe', onsubmit: (e: Event) => (e.preventDefault(), void build(describeText.value)) },
  h('label', { for: 'chat-describe' }, 'Describe a game…'),
  describeText,
  h(
    'p',
    { class: 'hint' },
    'Your AI builds a small first level, play-tests it and says what to add next. It changes the game as it builds; each change has an Undo.',
  ),
  h('div', { class: 'chat-row' }, describeBtn),
);

const input = h('textarea', {
  id: 'chat-input',
  rows: 2,
  placeholder: 'Ask, or say what to change…',
  'aria-label': 'Message to the assistant',
  onkeydown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      compose.requestSubmit();
    }
  },
});
const sendBtn = h('button', { type: 'submit', class: 'primary' }, 'Send');
const stopBtn = h('button', { type: 'button', class: 'chat-stop', hidden: true, onclick: () => busy?.abort() }, '■ Stop');
const compose = h(
  'form',
  {
    class: 'chat-compose',
    onsubmit: (e: Event) => {
      e.preventDefault();
      const t = input.value.trim();
      if (!t || busy) return;
      input.value = '';
      // "make a game about…" in a game with no level yet goes the Describe a game way: the starter, then a guided build
      void (MAKE_GAME.test(t) && hasNoLevelSafe() ? build(t) : send(t));
    },
  },
  input,
  h('div', { class: 'chat-row' }, stopBtn, sendBtn),
);

const panel = h(
  'aside',
  { class: 'chat-panel', 'aria-labelledby': 'chat-title', hidden: true },
  h(
    'header',
    { class: 'chat-head' },
    h('h2', { id: 'chat-title' }, h('span', { 'aria-hidden': 'true' }, '✦ '), 'Assistant'),
    modelText,
    copied,
    copyAllBtn,
    setupBtn,
    h('button', { type: 'button', class: 'chat-close', 'aria-label': 'Close the Assistant', title: 'Close (Esc)', onclick: () => closeChat() }, '×'),
  ),
  h(
    'div',
    { class: 'chat-bar' },
    h('label', { for: 'chat-mode', class: 'sr-only' }, 'Changes'),
    modeSel,
    h('span', { class: 'chat-check' }, readOnlyBox, h('label', { for: 'chat-read-only' }, 'Read-only')),
    coachBtn,
  ),
  h(
    'div',
    { class: 'chat-gauge' },
    h('label', { id: 'chat-gauge-label', for: 'chat-gauge', class: 'sr-only' }, 'Context used'),
    gaugeBar,
    gaugeWords,
    compactBtn,
    resetBtn,
  ),
  status,
  todo.el,
  describeBox,
  log.el,
  compose,
  h(
    'p',
    { class: 'chat-foot' },
    h(
      'button',
      { type: 'button', class: 'link', onclick: () => void import('../bridge/panel').then((m) => m.openAssistant()) },
      'Use an AI tool on this computer instead (MCP)…',
    ),
  ),
);
log.afterAsk = () => input.focus();
panel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.defaultPrevented) {
    e.preventDefault();
    closeChat();
  }
});

let busy: AbortController | undefined;

function render(): void {
  const hst = host();
  const ready = isReady(settings);
  modelText.textContent = ready ? modelLabel(settings!) : 'No AI set up';
  const looking = !hst || assistantReadOnly() || !!hst.project.readOnly;
  describeBox.hidden = !hst || !hasNoLevelSafe() || !!hst.project.readOnly;
  describeBtn.disabled = !!busy || looking;
  sendBtn.hidden = !!busy;
  stopBtn.hidden = !busy;
  sendBtn.disabled = !ready || !hst;
  input.disabled = !ready || !hst;
  input.placeholder = !hst ? 'Open a game first.' : ready ? 'Ask, or say what to change…' : 'Set up your AI first (AI setup above).';
  coachBtn.disabled = !!busy || !hst;
  compactBtn.disabled = resetBtn.disabled = !!busy || !ready || !hst;
  showGauge();
  todo.render();
  if (log.empty) welcome();
  // the to-do list may have grown: the newest words stay in sight
  log.toEnd();
}

const hasNoLevelSafe = () => {
  try {
    return hasNoLevel(ctx);
  } catch {
    return false;
  }
};

function welcome(): void {
  if (!isReady(settings))
    log.note(
      'Set up your own AI to chat about this game and change it: Ollama on this computer or another, or OpenAI. Press AI setup above. Without one, “What should I do next?” still lists what the Level check finds.',
    );
  else log.note('Ask about this game, or say what to change. The AI looks with its tools, makes small changes and play-tests them.');
}

/** Reset: a fresh context; what was said stays in the archive for recall. */
function resetContext(): void {
  const s = settings;
  const hst = host();
  if (!s || !hst || busy) return;
  agentNow(s, hst).reset();
  log.note('— A fresh context. The earlier conversation is archived: the AI can recall it. —');
  void agentNow(s, hst)
    .estimate()
    .then((g) => showGauge(g));
}

/** Compact now: older turns put away for a summary. */
async function compactNow(): Promise<void> {
  await work(async (s, hst, signal) => {
    log.startWorking('Compacting');
    // on request, everything but the latest request goes
    const done = await agentNow(s, hst).compact({ signal, keep: 1, onEvent: events(() => hst.project.game(), hst) });
    if (!done) log.note('Nothing to compact yet: the context holds only the latest request.');
    showGauge(await agentNow(s, hst).estimate());
  });
}

async function setup(): Promise<void> {
  const { openAiSetup } = await import('./settingsDialog');
  const s = await openAiSetup();
  if (s) {
    settings = s;
    gauge = undefined;
    endSession();
    log.clear();
  }
  render();
}

/** Says what went wrong talking to the model, in words. */
async function explain(e: unknown, s: AiSettings): Promise<void> {
  if (e instanceof DOMException && e.name === 'AbortError') return void log.note('Stopped.');
  const page = { protocol: location.protocol, origin: location.origin };
  if (e instanceof ProviderError || e instanceof TypeError || e instanceof DOMException)
    log.problem(diagnose(s, page, e, e instanceof TypeError ? await reachable(chatUrl(s)) : undefined));
  else log.note(`Something went wrong: ${e instanceof Error ? e.message : String(e)}`, 'error');
}

/** The agent's events, shown in the log (and the editor moved to each change). */
function events(game: () => Game | undefined, hst: AssistantHost) {
  return (e: AgentEvent) => {
    if (e.type === 'text') log.text(e.text);
    else if (e.type === 'reply') {
      log.reply(e.content);
      if (e.calls.length) log.startWorking('Using its tools');
    } else if (e.type === 'call') log.call(e.call, e.writes, game());
    else if (e.type === 'running') {
      lastUndo = undefined;
      log.running(e.call);
    } else if (e.type === 'result') {
      log.result(e.call, e.result, e.skipped);
      if (lastUndo && !e.result.isError) {
        log.undoable(e.call, lastUndo);
        showChange(hst, changePlace(e.call, hst.project.gam));
      }
      lastUndo = undefined;
    } else if (e.type === 'gauge') showGauge(e.gauge);
    else if (e.type === 'compacted')
      log.note(
        `Compacted: ${e.putAway} older message${e.putAway === 1 ? '' : 's'} put away for a summary${e.how === 'model' ? ' the AI wrote' : ''}. The archive keeps them; the AI can recall them.`,
      );
  };
}

/** Runs one piece of work with Stop, the indicator and errors in words. */
async function work(fn: (s: AiSettings, h: AssistantHost, signal: AbortSignal) => Promise<void>): Promise<void> {
  const s = settings;
  const hst = host();
  if (!hst) return void log.note('Open a game first.');
  if (!isReady(s)) return void (await setup());
  const pre = precheck(s, { protocol: location.protocol, origin: location.origin });
  if (pre) return void log.problem(pre);
  busy = new AbortController();
  render();
  try {
    facts = await modelFacts(s);
    await fn(s, hst, busy.signal);
  } catch (e) {
    await explain(e, s);
  } finally {
    log.stopWorking();
    busy = undefined;
    render();
  }
}

async function send(text: string): Promise<void> {
  await work(async (s, hst, signal) => {
    log.user(text);
    log.startWorking();
    await agentNow(s, hst).send(text, {
      signal,
      approve: mode === 'ask' && !ctx.readOnly ? (c) => log.ask(c, signal) : undefined,
      onEvent: events(() => hst.project.game(), hst),
    });
  });
}

/** Describe a game: the starter level when the game has none, then the AI builds it. */
async function build(description: string): Promise<void> {
  const d = description.trim();
  if (!d) return void describeText.focus();
  await work(async (s, hst, signal) => {
    if (ctx.readOnly) return void log.note('The game is read-only here, so nothing can be built. Untick Read-only first.');
    log.user(`Make this game: ${d}`);
    describeText.value = '';
    if (hasNoLevel(ctx)) {
      log.startWorking('Starting from the starter level');
      const { loadCatalog } = await import('../../project/files');
      const { libraryGame } = await import('../../editor/core/library');
      const g = (await loadCatalog()).find((c) => c.id === 'sample');
      const change = g && starterChange(ctx, await libraryGame(g));
      if (!change) return void log.note('The starter level couldn’t be loaded (offline?).', 'error');
      await ctx.apply(change);
    }
    log.startWorking();
    const r = await buildGame(agentNow(s, hst), ctx, d, { signal, onEvent: events(() => hst.project.game(), hst) });
    log.note(
      r.won ? '▶ The bot play-tested it and won.' : `▶ The bot couldn’t win it yet. Ask the AI to fix it, or press “What should I do next?”.`,
      r.won ? 'info' : 'error',
    );
    // a new game named "My Game" takes the title the AI gave it
    const title = hst.project.game().scenes[0]?.desc.trim();
    if (title && hst.project.name === 'My Game' && title !== 'My Game') {
      hst.project.name = title;
      void hst.project.saveNow().catch(() => undefined);
    }
  });
}

/** What should I do next?: the checks, then the model's plain list (or the findings, with no AI). */
async function coach(): Promise<void> {
  const hst = host();
  if (!hst || busy) return;
  busy = new AbortController();
  const signal = busy.signal;
  render();
  log.startWorking('Checking the game: Level check, bot play-test, validate');
  try {
    const results = await gatherResults(ctx);
    const s = settings;
    if (!isReady(s)) {
      refreshTodos(hst.project, results.items, 'check');
      log.note(
        results.items.length
          ? `The checks found ${results.items.length} thing${results.items.length === 1 ? '' : 's'} (in the to-do list above). With your own AI set up, they become a short plain list.`
          : 'The checks found nothing to fix.',
      );
      return;
    }
    log.startWorking('Making the to-do list');
    facts = await modelFacts(s);
    const reply = await chat(s, {
      messages: [
        {
          role: 'system',
          content: systemPrompt({
            summary: resultText(await runTool(GAME_TOOL_DEFS[0], {}, ctx)),
            readOnly: true,
            images: false,
            compact: s.contextTokens < 8192,
          }),
        },
        { role: 'user', content: coachBrief(results.text) },
      ],
      tools: [],
      signal,
      think: s.provider === 'ollama' && facts.thinking ? s.think : undefined,
    });
    const items = listItems(reply.content);
    refreshTodos(hst.project, items.length ? items : results.items, items.length ? 'coach' : 'check');
    log.note(
      `The to-do list has ${items.length || results.items.length} item${(items.length || results.items.length) === 1 ? '' : 's'} now. Tick them off as you go, or press Ask beside one.`,
    );
  } catch (e) {
    if (settings) await explain(e, settings);
    else log.note(`The checks failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
  } finally {
    log.stopWorking();
    busy = undefined;
    render();
  }
}

// ---- docking ------------------------------------------------------------------------------------

const wide = matchMedia('(min-width: 900px)');
const dock = () => document.body.classList.toggle('chat-docked', !panel.hidden && wide.matches);
wide.addEventListener('change', dock);

let lastProject: string | undefined;
onAssistantHost((hst) => {
  // another game: a new conversation
  if (hst?.project.id !== lastProject) {
    lastProject = hst?.project.id;
    busy?.abort();
    endSession();
    gauge = undefined;
    log.clear();
  }
  if (hst && pending?.project === hst.project.id) {
    const d = pending.description;
    pending = undefined;
    openChat();
    void build(d);
    return;
  }
  if (!hst) closeChat();
  else if (!panel.hidden) render();
});

/** Opens the chat beside the editor (full screen on phones), with the focus where to type. */
export function openChat(focus: 'input' | 'describe' = 'input'): void {
  if (!panel.isConnected) document.body.append(panel);
  lastProject ??= host()?.project.id;
  panel.hidden = false;
  dock();
  render();
  for (const b of document.querySelectorAll<HTMLElement>('.assistant-btn')) b.setAttribute('aria-expanded', 'true');
  const target = focus === 'describe' && !describeBox.hidden ? describeText : !input.disabled ? input : isReady(settings) ? coachBtn : setupBtn;
  target.focus();
}

export function closeChat(): void {
  if (panel.hidden) return;
  panel.hidden = true;
  dock();
  for (const b of document.querySelectorAll<HTMLElement>('.assistant-btn')) b.setAttribute('aria-expanded', 'false');
  document.querySelector<HTMLElement>('.assistant-btn')?.focus();
}

export function toggleChat(): void {
  if (panel.hidden || !panel.isConnected) openChat();
  else closeChat();
}

/** A game made on the home page from a description: built once its editor opens. */
let pending: { project: string; description: string } | undefined;
export function buildWhenOpened(project: string, description: string): void {
  pending = { project, description };
}

/** For the home page's box: the settings now, after AI setup if there were none. */
export async function readySettings(): Promise<AiSettings | undefined> {
  if (!isReady(settings)) {
    const { openAiSetup } = await import('./settingsDialog');
    settings = (await openAiSetup()) ?? settings;
  }
  return isReady(settings) ? settings : undefined;
}
