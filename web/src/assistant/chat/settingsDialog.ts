// AI setup: the dialog for the person's own AI (Ollama, or an OpenAI-compatible server), its
// address, model and key, with Test connection, the model list, and what is sent where said
// plainly. Opened from the chat panel and the home page's Describe a game box.
import { h, clear, modal } from '../../editor/core/ui';
import { diagnose, testConnection, type Problem, type TestResult } from './diagnose';
import { listModels } from './providers';
import { DEFAULT_URLS, defaultSettings, forgetSettings, loadSettings, saveSettings, type AiSettings, type ProviderKind } from './settings';
import { ollamaHelp } from './ollamaHelp';
import './settings.css';

/** Model families that call tools, for a first guess at the model. */
const TOOL_FAMILIES = /^(qwen3|qwen2\.5|llama3\.[123]|mistral|mixtral|granite3|command-r|hermes3|gpt-(4|5)|o[34])/i;

const page = () => ({ protocol: location.protocol, origin: location.origin });

function problemView(p: Problem): HTMLElement {
  return h(
    'div',
    { class: 'ai-problem' },
    h('p', null, h('strong', null, p.title)),
    p.fix.length ? h('ul', null, ...p.fix.map((f) => h('li', null, f))) : null,
  );
}

let n = 0;

/** Opens AI setup; resolves with the saved settings, or undefined when it was closed without saving. */
export function openAiSetup(): Promise<AiSettings | undefined> {
  const id = `ai-${++n}`;
  let s: AiSettings = loadSettings() ?? defaultSettings('ollama');
  return modal<AiSettings>('AI setup', (close) => {
    const status = h('div', { class: 'ai-status', role: 'status', 'aria-live': 'polite' });
    const radio = (k: ProviderKind, label: string, hint: string) =>
      h(
        'label',
        { class: 'ai-provider' },
        h('input', { type: 'radio', name: `${id}-provider`, value: k, checked: s.provider === k, onchange: () => setProvider(k) }),
        h('span', null, h('b', null, label), h('small', null, hint)),
      );
    const url = h('input', { id: `${id}-url`, type: 'url', value: s.baseUrl, autocomplete: 'off', spellcheck: false, required: true });
    const models = h('datalist', { id: `${id}-models` });
    const model = h('input', {
      id: `${id}-model`,
      type: 'text',
      value: s.model,
      list: `${id}-models`,
      autocomplete: 'off',
      spellcheck: false,
      placeholder: 'e.g. qwen3',
    });
    const key = h('input', { id: `${id}-key`, type: 'password', value: s.apiKey, autocomplete: 'off', spellcheck: false });
    const keyLabel = h('label', { for: `${id}-key` });
    const tools = h(
      'select',
      { id: `${id}-tools` },
      h('option', { value: 'core', selected: s.tools === 'core' }, 'In groups, as needed (best for small models)'),
      h('option', { value: 'all', selected: s.tools === 'all' }, 'All at once'),
    );
    const images = h(
      'select',
      { id: `${id}-images` },
      h('option', { value: 'auto', selected: s.images === 'auto' }, 'When the model can see them'),
      h('option', { value: 'on', selected: s.images === 'on' }, 'Always'),
      h('option', { value: 'off', selected: s.images === 'off' }, 'Never'),
    );
    const ctxSize = h('input', { id: `${id}-ctx`, type: 'number', min: 2048, max: 1048576, step: 1024, value: String(s.contextTokens) });
    const think = h('input', { id: `${id}-think`, type: 'checkbox', checked: s.think });
    const thinkRow = h('div', { class: 'ai-check' }, think, h('label', { for: `${id}-think` }, 'Let thinking models think first (slower)'));
    const ctxRow = h('div', { class: 'ai-field' }, h('label', { for: `${id}-ctx` }, 'Context size (tokens)'), ctxSize);
    const help = h('div', { class: 'ai-help-slot' });
    const listBtn = h('button', { type: 'button', onclick: () => void refreshModels(true) }, 'List models');
    const testBtn = h('button', { type: 'button', onclick: () => void test() }, 'Test connection');

    const read = (): AiSettings => ({
      provider: s.provider,
      baseUrl: url.value.trim(),
      model: model.value.trim(),
      apiKey: key.value.trim(),
      tools: tools.value === 'all' ? 'all' : 'core',
      images: images.value === 'on' ? 'on' : images.value === 'off' ? 'off' : 'auto',
      contextTokens: Math.max(2048, Math.min(1048576, Number(ctxSize.value) || defaultSettings(s.provider).contextTokens)),
      think: think.checked,
    });

    const sync = () => {
      const ollama = s.provider === 'ollama';
      keyLabel.textContent = ollama ? 'API key (optional for Ollama)' : 'API key';
      key.placeholder = ollama ? 'Only if a proxy asks for one' : 'sk-…';
      thinkRow.hidden = !ollama;
      clear(help, ollama ? ollamaHelp(location.origin) : null);
    };
    const setProvider = (k: ProviderKind) => {
      const was = s.provider;
      s = { ...read(), provider: k };
      if (!url.value.trim() || url.value.trim() === DEFAULT_URLS[was]) url.value = DEFAULT_URLS[k];
      tools.value = defaultSettings(k).tools;
      if (String(defaultSettings(was).contextTokens) === ctxSize.value) ctxSize.value = String(defaultSettings(k).contextTokens);
      clear(models);
      sync();
      void refreshModels(false);
    };

    const show = (r: Pick<TestResult, 'ok' | 'lines' | 'problem'>) => {
      status.dataset.state = r.ok ? 'ok' : 'failed';
      clear(status, ...r.lines.map((l) => h('p', null, r.ok ? '✓ ' : '', l)), r.problem ? problemView(r.problem) : null);
    };

    const fill = (names: string[]) => clear(models, ...names.map((m) => h('option', { value: m })));

    async function refreshModels(loud: boolean) {
      const now = read();
      if (!now.baseUrl) return;
      try {
        const names = await listModels(now, fetch, AbortSignal.timeout(8000));
        fill(names);
        if (loud)
          show({ ok: true, lines: [`${names.length} model${names.length === 1 ? '' : 's'}: ${names.slice(0, 12).join(', ')}${names.length > 12 ? '…' : ''}`] });
        // a first guess only among families known to call tools; else the person picks
        if (!model.value) model.value = names.find((m) => TOOL_FAMILIES.test(m)) ?? '';
      } catch (e) {
        if (!loud) return;
        show({ ok: false, lines: [], problem: diagnose(now, page(), e) });
      }
    }

    async function test() {
      testBtn.disabled = true;
      status.dataset.state = '';
      clear(status, h('p', null, 'Testing…'));
      try {
        const r = await testConnection(read(), page());
        if (r.models.length) fill(r.models);
        show(r);
      } finally {
        testBtn.disabled = false;
      }
    }

    const form = h(
      'form',
      {
        class: 'ai-setup',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (!url.reportValidity()) return;
          const v = read();
          if (!saveSettings(v)) show({ ok: false, lines: ['This browser won’t keep settings (private mode?): they last until the page closes.'] });
          close(v);
        },
      },
      h(
        'fieldset',
        { class: 'ai-providers' },
        h('legend', null, 'Your AI'),
        radio('ollama', 'Ollama', 'Local models, on this computer or another'),
        radio('openai', 'OpenAI-compatible', 'OpenAI, or any /v1 server such as LM Studio'),
      ),
      h('div', { class: 'ai-field' }, h('label', { for: `${id}-url` }, 'Address'), url),
      h('div', { class: 'ai-field' }, h('label', { for: `${id}-model` }, 'Model'), h('div', { class: 'ai-row' }, model, listBtn), models),
      h('div', { class: 'ai-field' }, keyLabel, key),
      h(
        'details',
        { class: 'ai-more' },
        h('summary', null, 'More settings'),
        h('div', { class: 'ai-field' }, h('label', { for: `${id}-tools` }, 'Tools offered'), tools),
        h('div', { class: 'ai-field' }, h('label', { for: `${id}-images` }, 'Send it pictures'), images),
        ctxRow,
        thinkRow,
      ),
      h(
        'p',
        { class: 'ai-privacy' },
        'These settings stay in this browser. The key is sent only to the address above. While the assistant works, this game’s contents (what its tools read, and pictures of it) are sent to that AI.',
      ),
      h('div', { class: 'ai-row' }, testBtn),
      status,
      help,
      h(
        'div',
        { class: 'buttons' },
        h(
          'button',
          {
            type: 'button',
            class: 'ai-forget',
            onclick: () => {
              forgetSettings();
              s = defaultSettings(s.provider);
              url.value = s.baseUrl;
              model.value = key.value = '';
              show({ ok: true, lines: ['Forgotten: nothing about your AI is kept in this browser now.'] });
            },
          },
          'Forget',
        ),
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Save'),
      ),
    );
    sync();
    void refreshModels(false);
    return form;
  });
}
