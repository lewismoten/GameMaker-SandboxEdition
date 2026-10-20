import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  addNote,
  buildPreview,
  channelNotes,
  deleteNotes,
  musicOf,
  readSong,
  removeChannel,
  scaleTime,
  setNote,
  setStartMode,
  setStartProgram,
  startMode,
  startProgram,
  stripIgnored,
  traceMusic,
  writeSong,
} from '../src/formats/cmfEdit';
import { ENVELOPE, FLAGS, getOp, setOp, setFeedback, getFeedback, presetName, MULT } from '../src/editor/music/sbi';
import { INSTRUMENTS, song as composeSong } from '../src/audio/compose';

const root = resolve(__dirname, '../../cd/gameware');

function cmfFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...cmfFiles(p));
    else if (/\.cmf$/i.test(f)) out.push(p);
  }
  return out;
}

const files = cmfFiles(root);
const unique = [...new Map(files.map((f) => [readFileSync(f).toString('base64'), f])).values()];

/** Ticks enough to play the song through twice. */
const span = (bytes: Uint8Array) => {
  const s = readSong(bytes);
  return (s.end.tick + s.leadIn) * 2 + 10;
};

const small = () =>
  composeSong(120, [
    { channel: 0, instrument: INSTRUMENTS.lead, notes: 'C4 q, E4 q, G4 h' },
    { channel: 1, instrument: INSTRUMENTS.bass, notes: 'C2 h, G2 h' },
  ]);

describe('CMF editing model', () => {
  it.skipIf(!unique.length)('writes every song on the CD back byte for byte', () => {
    for (const f of unique) {
      const bytes = new Uint8Array(readFileSync(f));
      const out = writeSong(readSong(bytes));
      expect(out, f).toEqual(bytes);
    }
  });

  it.skipIf(!unique.length)('plays the same after a round trip through the model', () => {
    for (const f of unique) {
      const bytes = new Uint8Array(readFileSync(f));
      const song = readSong(bytes);
      // force a fresh encoding of every event (no reuse of the original bytes)
      for (const n of song.notes) {
        n.on.status = undefined;
        n.on.delta = undefined;
        if (n.off) {
          n.off.status = undefined;
          n.off.delta = undefined;
        }
      }
      for (const e of song.events) e.delta = undefined;
      const out = writeSong(song);
      const ticks = span(bytes);
      expect(traceMusic(musicOf(out), ticks), f).toEqual(traceMusic(musicOf(bytes), ticks));
    }
  });

  it.skipIf(!unique.length)('removing ignored events changes nothing that plays', () => {
    for (const f of unique) {
      const bytes = new Uint8Array(readFileSync(f));
      const song = readSong(bytes);
      stripIgnored(song);
      const out = writeSong(song);
      const ticks = span(bytes);
      const effective = (t: string[]) => t.filter((x) => !/:off /.test(x));
      expect(effective(traceMusic(musicOf(out), ticks)), f).toEqual(effective(traceMusic(musicOf(bytes), ticks)));
    }
  });

  it('reads notes with their lengths and instruments', () => {
    const song = readSong(small());
    const lead = channelNotes(song, 0);
    expect(lead.map((n) => n.on.a)).toEqual([60, 64, 67]);
    expect(lead[1].on.tick).toBe(73);
    expect(startProgram(song, 0)).toBe(0);
    expect(startMode(song)).toBe(false);
  });

  it('adds, moves and deletes notes', () => {
    const song = readSong(small());
    const n = addNote(song, 2, 48, 10, 20);
    let trace = traceMusic(musicOf(writeSong(song)), 400);
    expect(trace).toContain('10:on 2 48');
    expect(trace).toContain('30:off 2 48');
    setNote(song, n, 50, 5, 50);
    trace = traceMusic(musicOf(writeSong(song)), 400);
    expect(trace).toContain('50:on 2 50');
    expect(trace).toContain('55:off 2 50');
    expect(trace.join()).not.toContain('on 2 48');
    deleteNotes(song, [n]);
    trace = traceMusic(musicOf(writeSong(song)), 400);
    expect(trace.join()).not.toContain(' 2 50');
  });

  it('plays a note that ends where the next one starts', () => {
    const song = readSong(small());
    removeChannel(song, 0);
    removeChannel(song, 1);
    addNote(song, 0, 60, 0, 10);
    addNote(song, 0, 60, 10, 10);
    const trace = traceMusic(musicOf(writeSong(song)), 30);
    expect(trace.slice(0, 4)).toEqual(['0:on 0 60', '10:off 0 60', '10:on 0 60', '20:off 0 60']);
  });

  it('keeps the first note in place when the song starts later', () => {
    const song = readSong(small());
    removeChannel(song, 0);
    removeChannel(song, 1);
    addNote(song, 3, 60, 40, 10);
    const trace = traceMusic(musicOf(writeSong(song)), 60);
    expect(trace).toContain('40:on 3 60');
  });

  it('sets instruments and rhythm mode at the start', () => {
    const song = readSong(small());
    setStartProgram(song, 1, 5);
    setStartMode(song, true);
    const again = readSong(writeSong(song));
    expect(startProgram(again, 1)).toBe(5);
    expect(startMode(again)).toBe(true);
    const trace = traceMusic(musicOf(writeSong(again)), 5);
    expect(trace.indexOf('0:mode 1')).toBeLessThan(trace.indexOf('0:on 0 60'));
    expect(trace.indexOf('0:program 1 5')).toBeLessThan(trace.indexOf('0:on 1 36'));
  });

  it('changes speed', () => {
    const song = readSong(small());
    scaleTime(song, 2);
    expect(song.ticksPerBeat).toBe(146);
    expect(channelNotes(song, 0)[1].on.tick).toBe(146);
  });

  it('previews with muted channels, from a point and in a loop', () => {
    const song = readSong(small());
    const muted = buildPreview(song, { muted: new Set([1]) });
    const t = traceMusic(musicOf(muted.bytes), 300);
    expect(t.join()).not.toContain('on 1 ');
    expect(t).toContain('0:on 0 60');

    const from = buildPreview(song, { from: 73 });
    const f = traceMusic(musicOf(from.bytes), 10);
    expect(f).toContain('0:on 0 64');
    expect(f).toContain('0:on 1 36'); // the held bass note starts again
    expect(from.songTick(0)).toBe(73);
    expect(from.songTick(song.end.tick - 73 + 5)).toBe(5);

    const loop = buildPreview(song, { loop: [73, 146] });
    expect(loop.length).toBe(73);
    expect(loop.songTick(80)).toBe(80);
    const l = traceMusic(musicOf(loop.bytes), 160);
    expect(l.filter((x) => x.endsWith('on 0 64')).length).toBe(3);
  });
});

describe('SBI instrument settings', () => {
  it('reads and writes operator fields without touching the others', () => {
    const inst = INSTRUMENTS.piano.slice();
    const level = ENVELOPE[0];
    expect(getOp(inst, level, 1)).toBe(63); // carrier level 0x00 attenuation = loudest
    setOp(inst, level, 0, 0);
    expect(inst[2]).toBe(0x7f); // KSL bits kept (0x4f has KSL 1)
    setOp(inst, ENVELOPE[1], 1, 3);
    expect(inst[5]).toBe(0x32);
    setOp(inst, FLAGS[1], 0, 1);
    expect(inst[0]).toBe(0x81);
    setOp(inst, MULT, 1, 4);
    expect(inst[1]).toBe(0x04);
    setFeedback(inst, 5);
    expect(getFeedback(inst)).toBe(5);
    expect(inst[10] & 1).toBe(0);
    expect(presetName(INSTRUMENTS.bass)).toBe('bass');
  });
});
