// Drum presets and the drum kit: what turning the kit on costs, and giving a drum its preset.
// Rhythm mode is CMF controller 0x67 (PLAYGAME: code/GM/SBMUSIC.C, sbfd_setmode): FM voices 6-8
// become the five drums on MIDI channels 11-15, so 6 melody tracks (1-6) remain and tracks 7-9
// go silent. This writes the same event the Settings checkbox does (setStartMode).
import { programChanges, setStartMode, setStartProgram, startProgram } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfEdit';
import { DRUM_SLOTS } from '../../../audio/oplDrumPresets';
import type { OplPreset } from '../../../audio/oplPatch';
import type { MusicDoc } from './doc';

/** Tracks 7-9 (channels 6-8) the song uses: they stop sounding in drum mode. */
export const tracksLostToDrums = (doc: MusicDoc): number[] =>
  [...new Set(doc.song.notes.map((n) => n.on.ch))].filter((c) => c >= 6 && c <= 8).sort((a, b) => a - b);

/** What to tell the player before the drum kit is switched on for a drum preset. */
export function drumConfirmText(doc: MusicDoc, p: OplPreset): string {
  const lost = tracksLostToDrums(doc).map((c) => c + 1);
  const gone = lost.length
    ? ` Your song has notes on track${lost.length === 1 ? '' : 's'} ${lost.join(' and ')}; ${lost.length === 1 ? 'it' : 'they'} will go silent.`
    : '';
  return (
    `${p.name} is a drum sound, so the drum kit has to be on for this song. ` +
    `The kit takes FM voices 7-9 and turns them into five drums (bass drum, snare, tom-tom, cymbal and hi-hat on tracks 12-16), ` +
    `so the song keeps 6 melody tracks (1-6), and the snare and hi-hat share a voice, as do the tom-tom and cymbal.${gone} ` +
    `Ctrl+Z undoes it, and the Settings tab turns the kit off again.`
  );
}

/** The track a drum preset belongs to (its drum's channel), or the given one for a melodic preset. */
export const trackForPreset = (p: OplPreset, ch: number): number => (p.drum ? DRUM_SLOTS[p.drum].ch : ch);

/**
 * Gives track ch a preset's sound, as one undo step: in the instrument it starts with, or in
 * a new copy when other tracks use that instrument too (so they keep their sound). A drum
 * preset goes to its own drum track, and switches the drum kit on first when it was off.
 */
export function applyToTrack(doc: MusicDoc, ch0: number, p: OplPreset): void {
  const song = doc.song;
  const ch = trackForPreset(p, ch0);
  const prog = startProgram(song, ch);
  const inst = song.instruments[prog];
  const shared = doc.tracks().some((c) => c !== ch && (startProgram(song, c) === prog || programChanges(song, c).some((e) => e.a === prog)));
  if (p.drum) doc.extra.add(ch);
  doc.edit(() => {
    if (p.drum && !doc.rhythm) setStartMode(song, true);
    if (inst && (!shared || song.instruments.length >= 128)) inst.set(p.patch.subarray(0, 11));
    else if (song.instruments.length < 128) {
      song.instruments.push(p.patch.slice());
      setStartProgram(song, ch, song.instruments.length - 1);
    }
  });
  if (p.drum) doc.selectTrack(ch);
}
