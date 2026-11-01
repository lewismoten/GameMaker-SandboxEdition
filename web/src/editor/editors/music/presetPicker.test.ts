// The preset picker's rules: Classic sounds belong to the family they sound like, and a drum
// preset turns the drum kit on (the same CMF mode event the Settings checkbox writes), once.
import { describe, expect, it } from 'vitest';
import { song as composeSong, INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/music/compose';
import { setStartMode, startMode, startProgram } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfEdit';
import { readSong, writeSong, type CmfSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { CLASSIC_HOME, OPL_PRESETS, PRESET_GROUPS, presetById, soundGroup } from '../../../audio/oplPresets';
import { DRUM_SLOTS } from '../../../audio/oplDrumPresets';
import { applyToTrack, drumConfirmText, tracksLostToDrums } from './drumMode';
import type { MusicDoc } from './doc';

const fakeDoc = (song: CmfSong) => {
  const doc = {
    song,
    extra: new Set<number>(),
    track: 0,
    edits: 0,
    get rhythm() {
      return startMode(song);
    },
    tracks: () => [...new Set(song.notes.map((n) => n.on.ch))],
    edit(fn: () => void) {
      doc.edits++;
      fn();
    },
    selectTrack(c: number) {
      doc.track = c;
    },
  };
  return doc as unknown as MusicDoc & { edits: number };
};
const songWith = (...channels: number[]) =>
  readSong(
    composeSong(
      120,
      channels.map((channel) => ({ channel, instrument: INSTRUMENTS.piano, notes: 'C4 q, E4 q' })),
    ),
  );

describe('Classic presets', () => {
  const classic = OPL_PRESETS.filter((p) => p.group === 'classic');
  it('sound like a real family, and are listed in it', () => {
    expect(classic.length).toBe(9);
    for (const p of classic) {
      const home = soundGroup(p);
      expect(home).not.toBe('classic');
      expect(PRESET_GROUPS.some((g) => g.id === home)).toBe(true);
      expect(CLASSIC_HOME[p.id]).toBe(home);
    }
    expect(soundGroup(presetById('bell')!)).toBe('mallets');
    expect(soundGroup(presetById('bass')!)).toBe('bass');
    expect(OPL_PRESETS.filter((p) => soundGroup(p) === 'keys')).toContain(presetById('piano'));
  });
  it('leave other presets in their own group', () => {
    for (const p of OPL_PRESETS.filter((q) => q.group !== 'classic')) expect(soundGroup(p)).toBe(p.group);
  });
});

describe('a drum preset', () => {
  const kick = presetById('kick-punchy')!;
  it('says what the kit takes, and what would go silent', () => {
    const text = drumConfirmText(fakeDoc(songWith(0, 7)), kick);
    expect(text).toMatch(/6 melody tracks \(1-6\)/);
    expect(text).toMatch(/track 8; it will go silent/);
    expect(drumConfirmText(fakeDoc(songWith(0)), kick)).not.toMatch(/silent/);
    expect(tracksLostToDrums(fakeDoc(songWith(0, 6, 8)))).toEqual([6, 8]);
  });
  it('turns the kit on in one step, on its own drum track, as the Settings checkbox would', () => {
    const song = songWith(0);
    const doc = fakeDoc(song);
    applyToTrack(doc, 0, kick);
    expect(doc.edits).toBe(1);
    expect(doc.rhythm).toBe(true);
    expect(doc.track).toBe(DRUM_SLOTS[kick.drum!].ch);
    expect(doc.extra.has(11)).toBe(true);
    expect(song.instruments[startProgram(song, 11)].slice(0, 11)).toEqual(kick.patch.slice(0, 11));
    const viaSetting = songWith(0);
    setStartMode(viaSetting, true);
    expect(writeSong(song).slice(0, 8)).toEqual(writeSong(viaSetting).slice(0, 8));
    expect(song.events.filter((e) => e.type === 'mode').map((e) => e.a)).toEqual(viaSetting.events.filter((e) => e.type === 'mode').map((e) => e.a));
  });
  it('just applies when the kit is already on', () => {
    const song = songWith(0);
    setStartMode(song, true);
    const before = song.events.filter((e) => e.type === 'mode').length;
    applyToTrack(fakeDoc(song), 0, kick);
    expect(song.events.filter((e) => e.type === 'mode').length).toBe(before);
    expect(startMode(song)).toBe(true);
  });
});
