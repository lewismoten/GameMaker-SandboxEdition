// Tool calls written as text, found while the reply streams: each one as soon as its closing
// brace arrives, in fences, tags or bare, several in one reply; the words shown leave them out
// and hold back one still being written; JSON that isn't a known tool stays as words.
import { describe, expect, it } from 'vitest';
import { scanText } from './textCalls';

const names = new Set(['set_map', 'render_png', 'get_map']);

describe('tool calls written as text', () => {
  it('count once complete, while the reply streams on', () => {
    const full =
      'Let me build it.\n```json\n{"name": "set_map", "arguments": {"file": "a.map", "rows": [[1, 1]]}}\n```\nNow a look:\n<tool_call>{"name":"render_png","arguments":{"what":"map","file":"a.map"}}</tool_call>\nDone!';
    const seen: string[] = [];
    let last = 0;
    for (let n = 1; n <= full.length; n++) {
      const s = scanText(full.slice(0, n), names);
      for (; last < s.calls.length; last++) seen.push(`${s.calls[last].name}@${n}`);
      // never shows a call's JSON, even half written
      expect(s.shown).not.toMatch(/"name"|"arguments"/);
    }
    const ends = [full.indexOf('}}\n```') + 2, full.indexOf('}}</tool_call>') + 2];
    expect(seen).toEqual([`set_map@${ends[0]}`, `render_png@${ends[1]}`]);
    const done = scanText(full, names);
    expect(done.calls.map((c) => c.args)).toEqual([
      { file: 'a.map', rows: [[1, 1]] },
      { what: 'map', file: 'a.map' },
    ]);
    expect(done.shown).toBe('Let me build it.\n\nNow a look:\n\nDone!');
    expect(done.pending).toBe(false);
  });

  it('take bare calls, "parameters", lists of calls, and string arguments', () => {
    const s = scanText(
      '[{"name":"get_map","parameters":{"file":"a.map"}}, {"name":"get_map","arguments":"{\\"file\\":\\"b.map\\"}"}] and {"tool":"set_map","args":{"file":"c.map"}}',
      names,
    );
    expect(s.calls.map((c) => c.args.file)).toEqual(['a.map', 'b.map', 'c.map']);
    expect(s.shown).toBe('and');
  });

  it('leave other JSON and braces as words', () => {
    const s = scanText('The hero {"name": "Penny"} jumps {high}. {"name":"rm_rf","arguments":{}}', names);
    expect(s.calls).toEqual([]);
    expect(s.shown).toContain('{"name": "Penny"}');
    expect(s.shown).toContain('{high}');
  });

  it('hold back a call still arriving, braces in strings and all', () => {
    const s = scanText('Painting {"name":"set_map","arguments":{"file":"a.map","note":"a } brace"', names);
    expect(s.calls).toEqual([]);
    expect(s.pending).toBe(true);
    expect(s.shown).toBe('Painting');
    expect(scanText('Painting {"na', names).shown).toBe('Painting');
  });
});
