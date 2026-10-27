// "Test connection" and the words for what went wrong: a browser only says "Failed to fetch",
// so the common causes are told apart here. An http address from an https page is mixed
// content (blocked before anything is sent); a server that answers a no-cors request but not a
// normal one is refusing this page's origin (CORS: OLLAMA_ORIGINS); one that answers neither is
// not listening where it can be reached (OLLAMA_HOST, Tailscale off, the computer asleep).
import { toOpenAITools } from '../openai';
import { ProviderError, chatUrl, listModels, modelsUrl, ollamaCapabilities, openaiBody } from './providers';
import { hostOf, type AiSettings } from './settings';

type Fetch = typeof fetch;

export interface Problem {
  kind: 'bad-url' | 'mixed-content' | 'cors' | 'refused' | 'auth' | 'host-refused' | 'not-found' | 'model-missing' | 'no-tools' | 'timeout' | 'http';
  /** One plain sentence. */
  title: string;
  /** What to do, a step a line. */
  fix: string[];
}

export interface Page {
  protocol: string;
  origin: string;
}

const LOOPBACK = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/i;

function urlOf(s: string): URL | undefined {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u : undefined;
  } catch {
    return undefined;
  }
}

/** A problem that is clear before anything is sent: a bad address, or http from an https page. */
export function precheck(s: Pick<AiSettings, 'provider' | 'baseUrl'>, page: Page): Problem | undefined {
  const u = urlOf(s.baseUrl);
  if (!u)
    return {
      kind: 'bad-url',
      title: 'That isn’t a web address.',
      fix: [s.provider === 'ollama' ? 'Use one like http://localhost:11434.' : 'Use one like https://api.openai.com/v1.'],
    };
  if (page.protocol === 'https:' && u.protocol === 'http:' && !LOOPBACK.test(u.hostname))
    return {
      kind: 'mixed-content',
      title: 'This page is https, so the AI address must be https too. The browser blocks http addresses from it (mixed content).',
      fix:
        s.provider === 'ollama'
          ? [
              'On the Ollama computer, run: tailscale serve --bg 11434',
              'Then use https://<machine>.<tailnet>.ts.net here (tailscale serve status shows it).',
              'Or open the editor from http://localhost, where http addresses work.',
            ]
          : ['Use the server’s https address, or put it behind an https proxy.'],
    };
  return undefined;
}

/** Whether anything answers at the address at all (a no-cors request the page can't read, but which fails only when nothing is there). */
export async function reachable(url: string, f: Fetch = fetch): Promise<boolean> {
  try {
    await f(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(6000) });
    return true;
  } catch {
    return false;
  }
}

/** Words for an error from talking to the server. `answers` is the no-cors probe's result for a network error. */
export function diagnose(s: Pick<AiSettings, 'provider' | 'baseUrl' | 'model'>, page: Page, error: unknown, answers?: boolean): Problem {
  const pre = precheck(s, page);
  if (pre) return pre;
  const ollama = s.provider === 'ollama';
  const host = hostOf(s.baseUrl);
  const local = LOOPBACK.test(urlOf(s.baseUrl)?.hostname ?? '');
  if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError'))
    return {
      kind: 'timeout',
      title: `${host} took too long to answer.`,
      fix: [
        'Check that the computer is awake and the server is running.',
        ollama ? 'A large model can take a minute to load the first time: try again.' : 'Try again.',
      ],
    };
  if (error instanceof ProviderError) {
    const body = error.body.toLowerCase();
    if (/does not support tools|tools? (are |is )?not supported|tool use is not supported|tool_choice|function calling is not/.test(body))
      return {
        kind: 'no-tools',
        title: `The model ${s.model} can’t call tools, and the assistant works through tools.`,
        fix: ollama
          ? ['Pick a model with tool calling (ollama.com/search?c=tools), for example qwen3, llama3.1 or mistral-nemo.', 'Then run: ollama pull <model>']
          : ['Pick a model that supports function calling.'],
      };
    if (error.status === 404 && /model/.test(body) && /not found|does not exist|no such/.test(body))
      return {
        kind: 'model-missing',
        title: `The server has no model called ${s.model}.`,
        fix: ollama ? [`On the Ollama computer, run: ollama pull ${s.model || '<model>'}`, 'Or pick one from the list.'] : ['Pick one from the list.'],
      };
    if (error.status === 401 || (error.status === 403 && !ollama))
      return { kind: 'auth', title: 'The server turned the key down.', fix: ['Check the API key (and that the account may use this model).'] };
    if (error.status === 403 && ollama)
      return {
        kind: 'host-refused',
        title: 'Ollama turned the request away (403). While it listens only on its own computer, it accepts only its own names, not a tailnet name.',
        fix: ['Set OLLAMA_HOST=0.0.0.0 on the Ollama computer and restart Ollama (see Remote Ollama over Tailscale below).'],
      };
    if (error.status === 404)
      return {
        kind: 'not-found',
        title: `Nothing answers at ${ollama ? chatUrl(s) : modelsUrl(s)} (404).`,
        fix: [
          ollama
            ? 'Use Ollama’s own address, like http://localhost:11434, with nothing after it.'
            : 'Check the address: OpenAI-compatible servers usually end in /v1.',
        ],
      };
    return { kind: 'http', title: `The server answered with an error: ${error.message}`, fix: ['Check the address, the model and the key.'] };
  }
  if (answers)
    return {
      kind: 'cors',
      title: `The server is there, but it doesn’t let this page (${page.origin}) talk to it (CORS).`,
      fix: ollama
        ? [
            `Set OLLAMA_ORIGINS on the Ollama computer to include ${page.origin}, then restart Ollama.`,
            'See Remote Ollama over Tailscale below for where to set it.',
          ]
        : ['Turn on CORS in the server for this page’s address (LM Studio: Developer › Server settings › Enable CORS).'],
    };
  return {
    kind: 'refused',
    title: `Nothing answered at ${host}.`,
    fix: ollama
      ? local
        ? ['Start Ollama on this computer (the Ollama app, or ollama serve).', 'If the browser asked to let this site reach devices on your network, allow it.']
        : [
            'Ollama only listens on its own computer by default: set OLLAMA_HOST=0.0.0.0 there and restart Ollama.',
            'Check that Tailscale is on, here and on that computer, and that the computer is awake.',
            'If the browser asked to let this site reach devices on your network, allow it.',
          ]
      : ['Check the address, and that the server is running.', 'If the browser asked to let this site reach devices on your network, allow it.'],
  };
}

export interface TestResult {
  ok: boolean;
  models: string[];
  /** What was found, a line each. */
  lines: string[];
  problem?: Problem;
  /** Ollama said the model takes pictures (undefined: it didn’t say). */
  vision?: boolean;
}

/** Tries the settings: lists the models, then checks the chosen one can call tools. */
export async function testConnection(s: AiSettings, page: Page, f: Fetch = fetch): Promise<TestResult> {
  const pre = precheck(s, page);
  if (pre) return { ok: false, models: [], lines: [], problem: pre };
  const lines: string[] = [];
  const failed = async (e: unknown, url: string, models: string[] = []): Promise<TestResult> => {
    const network = e instanceof TypeError;
    return { ok: false, models, lines, problem: diagnose(s, page, e, network ? await reachable(url, f) : undefined) };
  };
  let models: string[];
  try {
    models = await listModels(s, f, AbortSignal.timeout(15000));
  } catch (e) {
    return failed(e, modelsUrl(s));
  }
  lines.push(`Connected to ${hostOf(s.baseUrl)}: ${models.length} model${models.length === 1 ? '' : 's'}.`);
  if (!s.model) return { ok: true, models, lines: [...lines, 'Pick a model, then test again.'] };
  if (s.provider === 'ollama') {
    const known = models.some((m) => m === s.model || m === `${s.model}:latest` || m.replace(/:latest$/, '') === s.model);
    if (!known) return { ok: false, models, lines, problem: diagnose(s, page, new ProviderError(404, `model "${s.model}" not found`)) };
    try {
      const caps = await ollamaCapabilities(s, f, AbortSignal.timeout(15000));
      if (caps && !caps.includes('tools')) return { ok: false, models, lines, problem: diagnose(s, page, new ProviderError(400, 'does not support tools')) };
      const vision = caps ? caps.includes('vision') : undefined;
      lines.push(caps ? `${s.model} can call tools${vision ? ' and see pictures' : ', but can’t see pictures'}.` : `${s.model} is there.`);
      return { ok: true, models, lines, vision };
    } catch (e) {
      return failed(e, chatUrl(s), models);
    }
  }
  // OpenAI-compatible: one tiny request with one tool shows whether the model takes tools
  const ping = toOpenAITools([{ name: 'ping', description: 'Says hello.', inputSchema: { type: 'object', properties: {} } }]);
  try {
    const res = await f(chatUrl(s), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(s.apiKey.trim() ? { Authorization: `Bearer ${s.apiKey.trim()}` } : {}) },
      body: JSON.stringify(openaiBody(s.model, [{ role: 'user', content: 'Reply with the word OK.' }], ping, false)),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new ProviderError(res.status, await res.text().catch(() => ''));
    lines.push(`${s.model} answered, with tools offered.`);
    return { ok: true, models, lines };
  } catch (e) {
    return failed(e, chatUrl(s), models);
  }
}
