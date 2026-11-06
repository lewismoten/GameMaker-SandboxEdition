// Tests for agent usage counting, on a small synthetic log.
import { describe, expect, it } from 'vitest';
import { csvCell, readUsage, taskTitle, usageCsv, usageHead, usageRow } from './agentUsageLib';

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

  const u = { first: '2026-01-01T10:00:00Z', last: '2026-01-01T10:05:00Z', models: ['model-a'], input: 1, cacheWrite: 2, cacheRead: 3, output: 4 };

  it('titles a task with its description', () => {
    expect(taskTitle({ description: 'Fix the door logic', agentType: 'general' }, 'a1')).toBe('Fix the door logic');
  });

  it('falls back without ever returning empty', () => {
    expect(taskTitle({ agentType: 'Explore' }, 'a1')).toBe('Explore task (a1)');
    expect(taskTitle({}, 'a1')).toBe('Untitled task (a1)');
    expect(taskTitle({ description: '  \n\t ', agentType: 7 }, 'a1')).toBe('Untitled task (a1)');
    expect(taskTitle({}, '')).toBe('Untitled task (unknown id)');
  });

  it('folds newlines and tabs in a title to single spaces', () => {
    expect(taskTitle({ description: ' Line one\n\tline  two ' }, 'a1')).toBe('Line one line two');
  });

  it('puts title right after agent and keeps the other columns in order', () => {
    expect(usageHead).toEqual(['started', 'ended', 'session', 'agent', 'title', 'model', 'type', 'task', 'state', 'input', 'cache_write', 'cache_read', 'output', 'total']);
    const row = usageRow('s1', 'agent-a1.jsonl', { agentType: 'general', description: 'Do it', finished: true }, u);
    expect(row).toHaveLength(usageHead.length);
    expect(row.slice(0, 5)).toEqual([u.first, u.last, 's1', 'a1', 'Do it']);
    expect(row.slice(5)).toEqual(['model-a', 'general', 'Do it', 'completed', 1, 2, 3, 4, 10]);
  });

  it('writes a non-empty, correctly quoted title in every CSV row', () => {
    const csv = usageCsv([
      usageRow('s1', 'agent-a1.jsonl', { description: 'Fix "doors", then\nwalls' }, u),
      usageRow('s1', 'agent-a2.jsonl', {}, u),
    ]);
    expect(csv).toContain('"Fix ""doors"", then walls"');
    expect(csv).toContain(',Untitled task (a2),');
    // Raw description keeps its newline, quoted.
    expect(csv).toContain('"Fix ""doors"", then\nwalls"');
    const header = csv.split('\n')[0].split(',');
    expect(header[4]).toBe('title');
  });
});
