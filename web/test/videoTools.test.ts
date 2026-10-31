// The id check and tool check behind `npm run video:transcript` (scripts/videoTools.ts).
import { mkdtempSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { missing, parseId } from '../scripts/videoTools';

describe('parseId', () => {
  it('takes one YouTube id', () => {
    expect(parseId(['dQw4w9WgXcQ'])).toBe('dQw4w9WgXcQ');
    expect(parseId(['a_b-c_d-e_1'])).toBe('a_b-c_d-e_1');
  });
  it('refuses anything else', () => {
    for (const a of [[], ['short'], ['dQw4w9WgXcQ; rm'], ['dQw4w9WgXc/'], ['$(whoami)xx'], ['a', 'b']]) expect(parseId(a)).toBeNull();
  });
});

describe('missing', () => {
  it('names each missing tool and the model', () => {
    const empty = mkdtempSync(join(tmpdir(), 'vt-'));
    const out = missing(empty, join(empty, 'no.bin'));
    expect(out).toHaveLength(4);
    expect(out.join('\n')).toMatch(/yt-dlp[\s\S]*ffmpeg[\s\S]*whisper-cli[\s\S]*model/);
  });
  it('is quiet when everything is there', () => {
    const d = mkdtempSync(join(tmpdir(), 'vt-'));
    for (const t of ['yt-dlp', 'ffmpeg', 'whisper-cli']) {
      writeFileSync(join(d, t), '');
      chmodSync(join(d, t), 0o755);
    }
    writeFileSync(join(d, 'm.bin'), '');
    expect(missing(d, join(d, 'm.bin'))).toEqual([]);
  });
});
