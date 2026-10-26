// "Add a track from another song…": the game's other songs and their tracks; the one picked is
// added the way Paste track adds one (trackPaste.ts), without touching the clipboard.
import { h, clear, modal } from '../../core/ui';
import { channelNotes, channelSounds, startMode, usedChannels } from '../../../formats/cmfEdit';
import { RHYTHM_CHANNELS, readSong } from '../../../formats/cmfSong';
import { trackNameOf, type MusicDoc } from './doc';
import { copyTrack, type TrackClip } from './trackClip';
import { pasteIntoDoc } from './trackPaste';

/** Returns the channel the track went on (undefined when none was added). */
export async function trackPickDialog(doc: MusicDoc): Promise<number | undefined> {
  const files = doc.project.files;
  const names = files.byExtension('cmf').filter((n) => n !== doc.file.toLowerCase());
  await files.stream?.need(names);
  const songs = names.map((file) => {
    try {
      return { file, song: readSong(files.get(file)!) };
    } catch {
      return { file, song: undefined };
    }
  });
  const pickSong = h('select', null, ...songs.map((s) => h('option', { value: s.file }, s.file.toUpperCase())));
  const list = h('div', { class: 'mus-pick-tracks', role: 'group', 'aria-label': 'Its tracks' });
  const clip = await modal<TrackClip>('Add a track from another song', (close) => {
    const show = () => {
      const s = songs.find((x) => x.file === pickSong.value);
      if (!s?.song) return clear(list, h('p', { class: 'hint' }, 'This song could not be read.'));
      const song = s.song;
      const rhythm = startMode(song);
      const tracks = usedChannels(song).filter((ch) => channelNotes(song, ch).length);
      if (!tracks.length) return clear(list, h('p', { class: 'hint' }, 'This song has no notes yet.'));
      clear(
        list,
        ...tracks.map((ch) => {
          const name = trackNameOf(song, ch);
          const n = channelNotes(song, ch).length;
          const drum = rhythm && RHYTHM_CHANNELS.includes(ch);
          return h(
            'button',
            { type: 'button', onclick: () => close(copyTrack(song, ch, s.file, name)) },
            `${drum ? '🥁' : `${ch + 1}.`} ${name} · ${n} note${n === 1 ? '' : 's'}${channelSounds(ch, rhythm) ? '' : ' (silent there)'}`,
          );
        }),
      );
    };
    pickSong.addEventListener('change', show);
    if (!songs.length) {
      return [
        h('p', null, 'This game has no other songs yet. Copy a track (⧉) from a song in another game, then use Paste track here.'),
        h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'OK')),
      ];
    }
    show();
    return h(
      'div',
      { class: 'stack mus-acc' },
      h('p', { class: 'hint' }, 'Pick a track to add to this song with its notes and instrument. The other song stays as it is.'),
      h('label', { class: 'field' }, h('span', null, 'Song'), pickSong),
      list,
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
    );
  });
  return clip ? pasteIntoDoc(doc, clip) : undefined;
}
