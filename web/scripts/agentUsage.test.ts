// Tests for agent usage counting, on a small synthetic log.
import { describe, expect, it } from 'vitest';
import { csvCell, readUsage } from './agentUsageLib';

const msg = (id: string, usage: object, t: string) => JSON.stringify({ type: 'assistant', timestamp: t, message: { id, model: 'model-a', usage } });

describe('agent usage', () => {
  it('counts each message id once and tracks times', () => {
    const log = [
      msg('m1', { input_tokens: 10, cache_creation_input_tokens: 5, cache_read_input_tokens: 100, output_tokens: 7 }, '2026-01-01T10:00:00Z'),
      msg('m1', { input_tokens: 10, cache_creation_input_tokens: 5, cache_read_input_tokens: 100, output_tokens: 7 }, '2026-01-01T10:00:01Z'),
      msg('m2', { input_tokens: 1, output_tokens: 2 }, '2026-01-01T10:05:00Z'),
      'not json',
      JSON.stringify({ type: 'user', timestamp: '2026-01-01T10:06:00Z' }),
    ].join('\n');
    expect(readUsage(log)).toEqual({
      first: '2026-01-01T10:00:00Z',
      last: '2026-01-01T10:06:00Z',
      models: ['model-a'],
      input: 11,
      cacheWrite: 5,
      cacheRead: 100,
      output: 9,
    });
  });

  it('quotes CSV cells', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(3)).toBe('3');
  });
});
