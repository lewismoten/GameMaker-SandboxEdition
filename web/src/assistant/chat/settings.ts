// The person's own AI for the in-page assistant: which kind of server (Ollama, or anything that
// speaks OpenAI's /v1 API), its address, the model and an optional key. Kept in this browser's
// localStorage only, and the key goes nowhere but the address chosen here (providers.ts).
export type ProviderKind = 'ollama' | 'openai';

export interface AiSettings {
  provider: ProviderKind;
  /** Ollama: http://host:11434. OpenAI-compatible: the /v1 address. */
  baseUrl: string;
  model: string;
  /** Optional for Ollama; OpenAI needs one. */
  apiKey: string;
  /** The tools offered: a smaller set for small local models, or all of them. */
  tools: 'core' | 'all';
  /** Whether the model is sent pictures: auto asks Ollama (or guesses from an OpenAI model's name). */
  images: 'auto' | 'on' | 'off';
  /** Ollama's context window, in tokens (its own default is often too small for tools). */
  contextTokens: number;
}

export const DEFAULT_URLS: Record<ProviderKind, string> = {
  ollama: 'http://localhost:11434',
  openai: 'https://api.openai.com/v1',
};

export const PROVIDER_NAMES: Record<ProviderKind, string> = { ollama: 'Ollama', openai: 'OpenAI-compatible' };

export function defaultSettings(provider: ProviderKind = 'ollama'): AiSettings {
  return {
    provider,
    baseUrl: DEFAULT_URLS[provider],
    model: '',
    apiKey: '',
    tools: provider === 'ollama' ? 'core' : 'all',
    images: 'auto',
    contextTokens: 16384,
  };
}

const KEY = 'gm-ai-settings';

/** The saved settings, or undefined when none were saved (or storage is off). */
export function loadSettings(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): AiSettings | undefined {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return undefined;
    const v = JSON.parse(raw) as Partial<AiSettings>;
    const provider: ProviderKind = v.provider === 'openai' ? 'openai' : 'ollama';
    const d = defaultSettings(provider);
    return {
      provider,
      baseUrl: typeof v.baseUrl === 'string' && v.baseUrl.trim() ? v.baseUrl.trim() : d.baseUrl,
      model: typeof v.model === 'string' ? v.model : '',
      apiKey: typeof v.apiKey === 'string' ? v.apiKey : '',
      tools: v.tools === 'all' || v.tools === 'core' ? v.tools : d.tools,
      images: v.images === 'on' || v.images === 'off' ? v.images : 'auto',
      contextTokens: typeof v.contextTokens === 'number' && v.contextTokens >= 2048 ? Math.min(262144, Math.round(v.contextTokens)) : d.contextTokens,
    };
  } catch {
    return undefined;
  }
}

export function saveSettings(s: AiSettings, storage: Pick<Storage, 'setItem'> | undefined = safeStorage()): boolean {
  try {
    storage?.setItem(KEY, JSON.stringify(s));
    return !!storage;
  } catch {
    return false;
  }
}

export function forgetSettings(storage: Pick<Storage, 'removeItem'> | undefined = safeStorage()): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    /* nothing kept */
  }
}

/** Ready to chat: an address and a model (and a key for OpenAI's own API). */
export function isReady(s: AiSettings | undefined): s is AiSettings {
  return !!s && !!s.baseUrl && !!s.model && !(s.provider === 'openai' && /api\.openai\.com/.test(s.baseUrl) && !s.apiKey);
}

/** "llama3.1 via Ollama": for the credits and the panel's header (never the address, which may be a private machine's name). */
export function modelLabel(s: AiSettings): string {
  return `${s.model} via ${s.provider === 'ollama' ? 'Ollama' : /api\.openai\.com/.test(s.baseUrl) ? 'OpenAI' : 'an OpenAI-compatible server'}`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
