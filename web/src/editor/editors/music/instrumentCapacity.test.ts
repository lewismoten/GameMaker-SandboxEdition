// Exercise the instrument-bank render in Node with lightweight element records.
import { expect, it, vi } from 'vitest';
import { song as composeSong, INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/music/compose';
import { readSong, writeSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { InstrumentPanel } from './instrument';
import type { MusicDoc } from './doc';

vi.mock('../../core/ui', () => ({
  h: (tag: string, attrs: unknown, ...children: unknown[]) => ({ tag, attrs, children }),
  clear: (el: { children: unknown[] }, ...children: unknown[]) => {
    el.children = children;
  },
}));
vi.mock('./instrumentLook', () => ({ instrumentLook: () => ({ icon: '', exact: false }) }));
vi.mock('./presetPicker', () => ({ pickPreset: vi.fn() }));

it('shows the 128-instrument reason beside New without changing CMF bytes, and clears below the limit', () => {
  const song = readSong(composeSong(120, [{ channel: 0, instrument: INSTRUMENTS.piano, notes: 'C4 q' }]));
  const patch = song.instruments[0];
  song.instruments = Array.from({ length: 127 }, () => patch.slice());
  const list = { children: [] as unknown[] };
  const doc = { song, track: 0, tracks: () => [0], trackName: () => 'Melody 1', trackColor: () => '#fff' } as unknown as MusicDoc;
  // Only the bank renderer is needed; constructing the whole editor would require a canvas.
  const panel = { doc, list } as unknown as InstrumentPanel;
  const render = () => {
    InstrumentPanel.prototype['renderList'].call(panel);
    return JSON.stringify(list);
  };
  expect(render()).not.toContain('this one is full');
  song.instruments.push(patch.slice());
  const bytes = writeSong(song);
  expect(render()).toContain('DOS Game-Maker holds 128 instruments in a song; this one is full.');
  expect(JSON.stringify(list)).toContain('"disabled":true');
  expect(writeSong(song)).toEqual(bytes);
  song.instruments.pop();
  expect(render()).not.toContain('this one is full');
});
