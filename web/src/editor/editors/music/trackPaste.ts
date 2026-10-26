// Copying a track to the track clipboard, and adding a copied track to the song being edited
// as one undo step, with a toast that says what happened (Paste track, and Add a track from
// another song…, which share this).
import { toast } from '../../core/ui';
import { channelNotes } from '../../../formats/cmfEdit';
import type { MusicDoc } from './doc';
import { copyTrack, pasteTrack, type TrackClip } from './trackClip';
import { saveTrackClip } from './trackClipboard';

/** How a clip is named on the Paste button and in messages: Bass (from TITLE.CMF). */
export const clipLabel = (clip: TrackClip): string => `${clip.name} (from ${clip.from.toUpperCase()})`;

export function copyToClipboard(doc: MusicDoc, ch: number): void {
  const clip = copyTrack(doc.song, ch, doc.file, doc.trackName(ch));
  const kept = saveTrackClip(clip);
  const n = clip.notes.length;
  toast(
    `Copied ${clip.name} (${n} note${n === 1 ? '' : 's'}). Open any song and use Paste track.${kept ? '' : ' This browser can’t store it, so it lasts until the page reloads.'}`,
  );
}

/** Adds the clip as a new track; returns its channel, or undefined when the song can't take it. */
export function pasteIntoDoc(doc: MusicDoc, clip: TrackClip): number | undefined {
  doc.begin();
  const r = pasteTrack(doc.song, clip, doc.tracks());
  if ('error' in r) {
    doc.undoDiscard();
    toast(`Can’t add ${clip.name}. ${r.error}`, 'error');
    return undefined;
  }
  doc.commit();
  doc.selectTrack(r.ch);
  const parts = [`Added ${clipLabel(clip)} as track ${r.ch + 1}: ${doc.trackName(r.ch)}, ${channelNotes(doc.song, r.ch).length} notes.`];
  if (r.scale !== 1)
    parts.push(
      `Its timing was rescaled from ${clip.ticksPerBeat} to ${doc.beat} ticks a beat, so it lands on the same beats (and plays at this song’s speed).`,
    );
  if (r.drumKitOn) parts.push('The drum kit is now on for it (tracks 7-9 were empty).');
  if (r.drumAsMelody) parts.push(`This song has no drum kit and uses tracks 7-9, so the ${clip.name.toLowerCase()} came in as a melody track.`);
  if (r.piano) parts.push('It came with no instrument, so it plays the piano.');
  if (r.longer) parts.push(`The song is now ${doc.seconds(doc.song.end.tick)} long.`);
  toast(parts.join(' '));
  return r.ch;
}
