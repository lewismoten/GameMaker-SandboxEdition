// Every line the wall phone can say has a recorded clip in public/phone/voice (so the browser's
// speech is only ever the fallback for a clip that fails to load), and no phone file says words
// that phoneScript.ts doesn't know.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { captionPieces } from '../../src/desk/room/phone/captionPieces';
import { CAST } from '../../src/audio/phone/phoneCast';
import { castOf, clipsFor, sentences } from '../../src/audio/phone/phoneClips';
import { SCRIPT, billSentence, timeSentence, TIME_LEAD, HINT_KENNEL, HINT_RATE } from '../../src/audio/phone/phoneScript';
import { HINT_CENTS_PER_MINUTE, MAX_MINUTES } from '../../src/desk/room/phone/hintBill';
import { phoneLines } from './phoneLines';

const VOICE = join(__dirname, '../../public/phone/voice');
const clipFile = (path: string) => join(VOICE, `${path}.ogg`);

describe('the phone’s recorded lines', () => {
  const lines = phoneLines();
  it('casts every caller', () => {
    for (const l of lines) expect(l.voice?.sample, l.id).toBe(CAST[l.chapter].sample);
    for (const s of SCRIPT) expect(CAST[s.voice], s.id).toBeDefined();
  });

  it('has a clip file for every line it can generate', () => {
    const index = JSON.parse(readFileSync(join(VOICE, 'index.json'), 'utf8')) as Record<string, unknown>;
    const missing = lines.filter((l) => !existsSync(clipFile(`${l.chapter}/${l.id}`)) || !index[l.id]).map((l) => l.id);
    expect(missing).toEqual([]);
  });

  it('finds clips for every fixed line, in every caption piece', () => {
    for (const s of SCRIPT) for (const piece of captionPieces(s.text)) expect(clipsFor(piece, s.text), s.id).toBeDefined();
  });

  const have = new Set(lines.map((l) => `${l.chapter}/${l.id}`));
  it('splices every time of day from clips that exist', () => {
    for (let h = 1; h <= 12; h++)
      for (let m = 0; m < 60; m++)
        for (let s = 0; s < 60; s += 10) {
          const text = `${TIME_LEAD} ${timeSentence(h, m, s)}`;
          expect(castOf(text)).toBe('time-lady');
          const clips = clipsFor(text, text);
          expect(clips, text).toBeDefined();
          for (const c of clips!) expect(have.has(c), `${text}: ${c}`).toBe(true);
        }
  });

  it('splices the pretend bill from clips that exist, up to $99.99', () => {
    for (let cents = 0; cents < 10000; cents++) {
      const amount = `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
      const text = `${HINT_KENNEL} ${billSentence(amount)} ${HINT_RATE}`;
      for (const piece of captionPieces(text)) {
        const clips = clipsFor(piece, text);
        expect(clips, text).toBeDefined();
        for (const c of clips!) expect(have.has(c), `${amount}: ${c}`).toBe(true);
      }
    }
  });

  it('says every bill the per-minute billing can reach (multiples of the price, up to the cap) in the Hint Giant’s voice', () => {
    for (let minutes = 1; minutes <= MAX_MINUTES; minutes++) {
      const cents = minutes * HINT_CENTS_PER_MINUTE;
      const amount = `$${(cents / 100).toFixed(2)}`;
      const text = billSentence(amount);
      expect(castOf(text), amount).toBe('giant');
      expect(cents, amount).toBeLessThan(10000);
      for (const c of clipsFor(text, text)!) expect(have.has(c), `${amount}: ${c}`).toBe(true);
    }
  });

  it('leaves a bill over $99.99 to the browser’s speech', () => {
    const text = billSentence('$100.00');
    expect(clipsFor(text, `${HINT_KENNEL} ${text}`)).toBeUndefined();
  });

  it('keeps sentences whole', () => {
    expect(sentences('Hello? … Hello? Who is this?')).toEqual(['Hello? …', 'Hello?', 'Who is this?']);
  });

  it('has no phone file that speaks a quoted string of its own', () => {
    for (const f of ['calls.ts', 'hintLine.ts', 'phone.ts']) {
      const src = readFileSync(join(__dirname, '../../src/desk/room/phone', f), 'utf8');
      expect(src.match(/\.say\(\s*(?:VOICES\.\w+|giant),\s*['"]/g) ?? [], f).toEqual([]);
    }
  });
});
