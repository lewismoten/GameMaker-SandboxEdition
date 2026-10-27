// The bridge's messages and pairing rules, shared by the MCP server and the editor tab.
import { describe, expect, it } from 'vitest';
import { bridgeUrl, newPairingCode, originAllowed, readToEditor, readToServer, sameCode } from './protocol';

describe('the bridge protocol', () => {
  it('reads only well-formed messages', () => {
    expect(readToEditor('{"type":"call","id":3,"tool":"get_map","args":{"file":"a.map"}}')).toEqual({
      type: 'call',
      id: 3,
      tool: 'get_map',
      args: { file: 'a.map' },
    });
    expect(readToEditor('{"type":"call","id":"3","tool":"get_map","args":{}}')).toBeUndefined();
    expect(readToEditor('not json')).toBeUndefined();
    expect(readToEditor('[1]')).toBeUndefined();
    expect(readToServer('{"type":"hello","version":1,"code":"123-456","page":"http://localhost:5173"}')?.type).toBe('hello');
    expect(readToServer('{"type":"result","id":1,"result":{"content":[{"type":"text","text":"ok"}]}}')?.type).toBe('result');
    expect(readToServer('{"type":"result","id":1,"result":{}}')).toBeUndefined();
    expect(readToServer('{"type":"state","state":{"readOnly":false,"file":"a.map"}}')).toEqual({ type: 'state', state: { readOnly: false, file: 'a.map' } });
  });

  it('makes six-digit codes and compares only their digits', () => {
    expect(newPairingCode()).toMatch(/^\d{3}-\d{3}$/);
    expect(newPairingCode(() => new Uint32Array([42]))).toBe('000-042');
    expect(sameCode('123 456', '123-456')).toBe(true);
    expect(sameCode('123456', '123-456')).toBe(true);
    expect(sameCode('123-457', '123-456')).toBe(false);
    expect(sameCode('12345', '123-456')).toBe(false);
    expect(sameCode('1234567', '123-456')).toBe(false);
  });

  it('lets this computer’s pages and the published site pair, nothing else', () => {
    expect(originAllowed('http://localhost:5173')).toBe(true);
    expect(originAllowed('http://127.0.0.1:4173')).toBe(true);
    expect(originAllowed('https://lewismoten.github.io')).toBe(true);
    expect(originAllowed('https://example.com')).toBe(false);
    expect(originAllowed('https://example.com', ['https://example.com'])).toBe(true);
    expect(originAllowed('http://localhost.evil.com:80')).toBe(false);
    expect(originAllowed(undefined)).toBe(false);
  });

  it('only connects to this computer', () => {
    expect(bridgeUrl('51234')).toBe('ws://127.0.0.1:51234');
    expect(bridgeUrl('ws://localhost:51234')).toBe('ws://127.0.0.1:51234');
    expect(bridgeUrl('ws://example.com:51234')).toBeUndefined();
    expect(bridgeUrl('wss://127.0.0.1:1')).toBeUndefined();
  });
});
