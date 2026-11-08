// Exercise the real document history without starting audio playback or persistence.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { song, INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/music/compose';
import { writeSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { MusicDoc } from './doc';
import type { Project } from '../../core/project';

vi.mock('../../widgets/mediaShared', () => ({ audio: {} }));

function document(): MusicDoc {
  const bytes = song(120, [{ channel: 0, instrument: INSTRUMENTS.lead, notes: 'C4 q, E4 q' }]);
  const project = {
    files: new Map([['song.cmf', bytes]]),
    extras: (_file: string, _section: string, fallback: unknown) => fallback,
    setExtras: vi.fn(),
  } as unknown as Project;
  return new MusicDoc(project, 'song.cmf');
}

describe('MusicDoc history', () => {
  it('restores added and removed empty tracks through undo and redo', () => {
    const doc = document();
    const before = doc.tracks();
    const added = doc.freeChannels()[0];
    doc.edit(() => {
      doc.extra.add(added);
    });
    expect(doc.tracks()).toContain(added);
    doc.undo();
    expect(doc.tracks()).toEqual(before);
    doc.redo();
    expect(doc.tracks()).toContain(added);
    doc.edit(() => {
      doc.extra.delete(added);
    });
    doc.undo();
    expect(doc.tracks()).toContain(added);
    doc.redo();
    expect(doc.tracks()).toEqual(before);
  });

  it('does not evict a history entry when a gesture at capacity is discarded', () => {
    const doc = document();
    for (let i = 1; i <= 200; i++)
      doc.edit(() => {
        doc.song.ticksPerBeat = i + 48;
      });
    doc.begin();
    doc.undoDiscard();
    let count = 0;
    while (doc.canUndo) {
      doc.undo();
      count++;
    }
    expect(count).toBe(200);
  });

  it('bounds track-order history to the same 200 steps as song edits', () => {
    const doc = document();
    doc.extra.add(1);
    for (let i = 0; i < 210; i++) doc.setOrder(i % 2 ? [0, 1] : [1, 0]);
    let count = 0;
    while (doc.canUndo) {
      doc.undo();
      count++;
    }
    expect(count).toBe(200);
  });
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps redo when a gesture is discarded and invalidates it on a new committed edit', () => {
    const doc = document();
    const before = writeSong(doc.song);
    doc.edit(() => {
      doc.song.ticksPerBeat = 96;
    });
    const edited = writeSong(doc.song);
    doc.undo();
    expect(writeSong(doc.song)).toEqual(before);
    expect(doc.canRedo).toBe(true);
    doc.begin();
    doc.undoDiscard();
    expect(doc.canUndo).toBe(false);
    expect(doc.canRedo).toBe(true);
    doc.redo();
    expect(writeSong(doc.song)).toEqual(edited);
    doc.undo();
    doc.edit(() => {
      doc.song.ticksPerBeat = 192;
    });
    expect(doc.canRedo).toBe(false);
    doc.undo();
    expect(writeSong(doc.song)).toEqual(before);
  });
});
