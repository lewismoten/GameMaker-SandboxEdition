// A new, empty song (compose.ts blankSong, offered by "Add a file"): one PLAYGAME and the music editor read.
import { describe, expect, it } from 'vitest';
import { readSong, writeSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { loadSong } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfLoad';
import { blankSong } from '@lewismoten/gamemaker-sandbox-tools/music/compose';

describe('blankSong', () => {
  it('is a 146-tick CMF with an instrument for every channel, no notes and one silent bar', () => {
    const bytes = blankSong();
    expect(loadSong(bytes)).toBeDefined();
    const s = readSong(bytes);
    expect(s.clockTicks).toBe(146);
    expect(s.instruments).toHaveLength(16);
    expect(s.notes).toHaveLength(0);
    expect(readSong(writeSong(s)).notes).toHaveLength(0);
  });
});
