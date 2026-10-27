// Telling the common connection failures apart: mixed content before anything is sent, CORS
// (the no-cors probe gets through), nothing listening (it doesn't), a model without tools, and
// Ollama's 403 for a name it doesn't know; and Test connection end to end with fake servers.
import { describe, expect, it } from 'vitest';
import { diagnose, precheck, testConnection } from './diagnose';
import { ProviderError } from './providers';
import { defaultSettings } from './settings';

const href = (u: string | URL | Request) => (typeof u === 'string' ? u : u instanceof URL ? u.href : u.url);

const https = { protocol: 'https:', origin: 'https://lewismoten.github.io' };
const local = { protocol: 'http:', origin: 'http://localhost:5173' };
const ollama = (baseUrl: string, model = 'qwen3') => ({ ...defaultSettings('ollama'), baseUrl, model });
const failed = () => Promise.reject(new TypeError('Failed to fetch'));

describe('diagnosis', () => {
  it('mixed content: an http tailnet address from the https site, but not localhost', () => {
    const p = precheck(ollama('http://studio.tail1234.ts.net:11434'), https);
    expect(p?.kind).toBe('mixed-content');
    expect(p?.fix.join(' ')).toMatch(/tailscale serve --bg 11434/);
    expect(p?.fix.join(' ')).toMatch(/https:\/\/<machine>\.<tailnet>\.ts\.net/);
    expect(precheck(ollama('http://100.101.102.103:11434'), https)?.kind).toBe('mixed-content');
    expect(precheck(ollama('http://localhost:11434'), https)).toBeUndefined();
    expect(precheck(ollama('http://100.101.102.103:11434'), local)).toBeUndefined();
    expect(precheck(ollama('localhost:11434'), local)?.kind).toBe('bad-url');
  });

  it('CORS: the server answers a no-cors request, so it is refusing this origin', () => {
    const p = diagnose(ollama('http://localhost:11434'), https, new TypeError('Failed to fetch'), true);
    expect(p.kind).toBe('cors');
    expect(p.fix[0]).toBe('Set OLLAMA_ORIGINS on the Ollama computer to include https://lewismoten.github.io, then restart Ollama.');
  });

  it('refused: nothing answers; another computer needs OLLAMA_HOST, this one needs Ollama started', () => {
    const remote = diagnose(ollama('http://100.101.102.103:11434'), local, new TypeError('Failed to fetch'), false);
    expect(remote.kind).toBe('refused');
    expect(remote.fix[0]).toMatch(/Ollama only listens on its own computer by default: set OLLAMA_HOST=0\.0\.0\.0 there/);
    expect(diagnose(ollama('http://localhost:11434'), local, new TypeError('x'), false).fix[0]).toMatch(/Start Ollama/);
  });

  it('a model without tool calling, a missing model, a bad key and Ollama’s 403', () => {
    const s = ollama('http://localhost:11434', 'gemma2');
    expect(diagnose(s, local, new ProviderError(400, '{"error":"registry.ollama.ai/library/gemma2:latest does not support tools"}')).kind).toBe('no-tools');
    expect(diagnose(s, local, new ProviderError(404, '{"error":"model \\"gemma2\\" not found, try pulling it first"}')).fix[0]).toMatch(/ollama pull gemma2/);
    expect(diagnose({ ...defaultSettings('openai'), model: 'gpt-4o' }, https, new ProviderError(401, 'Incorrect API key')).kind).toBe('auth');
    expect(diagnose(ollama('https://studio.tail1234.ts.net'), https, new ProviderError(403, '')).fix[0]).toMatch(/OLLAMA_HOST=0\.0\.0\.0/);
  });
});

describe('Test connection', () => {
  it('Ollama: lists the models, then checks the model can call tools and see', async () => {
    const f = (async (u: string | URL | Request) =>
      href(u).endsWith('/api/tags')
        ? Response.json({ models: [{ name: 'qwen3:latest' }, { name: 'gemma2:latest' }] })
        : Response.json({ capabilities: ['completion', 'tools'] })) as typeof fetch;
    const ok = await testConnection(ollama('http://localhost:11434', 'qwen3'), local, f);
    expect(ok.ok).toBe(true);
    expect(ok.vision).toBe(false);
    expect(ok.lines.join(' ')).toMatch(/2 models.*can call tools/);
    const g = (async (u: string | URL | Request) =>
      href(u).endsWith('/api/tags') ? Response.json({ models: [{ name: 'gemma2:latest' }] }) : Response.json({ capabilities: ['completion'] })) as typeof fetch;
    expect((await testConnection(ollama('http://localhost:11434', 'gemma2'), local, g)).problem?.kind).toBe('no-tools');
    expect((await testConnection(ollama('http://localhost:11434', 'llama3.1'), local, g)).problem?.kind).toBe('model-missing');
  });

  it('a failed fetch is probed with no-cors to tell CORS from nothing there', async () => {
    const cors = (async (_u: string | URL | Request, init?: RequestInit) => (init?.mode === 'no-cors' ? new Response(null) : failed())) as typeof fetch;
    expect((await testConnection(ollama('http://localhost:11434'), https, cors)).problem?.kind).toBe('cors');
    const nothing = (async () => failed()) as typeof fetch;
    expect((await testConnection(ollama('http://100.64.0.5:11434'), local, nothing)).problem?.kind).toBe('refused');
  });

  it('OpenAI-compatible: one small request with a tool; a server that refuses tools says so', async () => {
    const f = (async (u: string | URL | Request) =>
      href(u).endsWith('/models')
        ? Response.json({ data: [{ id: 'local-model' }] })
        : new Response('{"error":{"message":"tools is not supported for this model"}}', { status: 400 })) as typeof fetch;
    const r = await testConnection({ ...defaultSettings('openai'), baseUrl: 'http://localhost:1234/v1', model: 'local-model' }, local, f);
    expect(r.problem?.kind).toBe('no-tools');
  });
});
