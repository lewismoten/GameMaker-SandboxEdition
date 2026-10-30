// On-demand character-block auditions reuse the block editor's sequence player and DOS timing.
import { h, modal } from '../../core/ui';
import { Project } from '../../core/project';
import { GameFiles } from '../../../project/files';
import { CHARBL, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter, SEQUENCE_NAMES } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { defaultPalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { partners } from '../../core/uses';
import type { ThumbSource } from '../../widgets/thumbs';
import { characterClips } from './animClip';
import { animPlayer } from './animPlayer';

/** Auditions sequences using this CBL without changing the source game's files or callbacks. */
export async function previewCharacterBlocks(name: string, bytes: Uint8Array, source: ThumbSource): Promise<void> {
  const files = new GameFiles();
  for (const file of source.files.names()) files.set(file, source.files.get(file)!);
  files.set(name, bytes);
  const project = Project.fromFiles(files, 'Character-block preview', 'block-preview');
  const associated = partners(project, name, 6, 5).map(({ file }) => file);
  const paired = name.replace(/\.[^.]+$/, '.chr');
  const characters = associated.length ? associated : files.has(paired) ? [paired] : [];
  const clips = characters.flatMap((file) => {
    try {
      return characterClips(parseCharacter(files.get(file)!), undefined, (i) => `${file.toUpperCase()} · ${SEQUENCE_NAMES[i] ?? `Sequence ${i}`}`);
    } catch {
      return [];
    }
  });
  const blocks = parseBlocks(bytes, CHARBL);
  const player = animPlayer({
    blocks: () => blocks,
    pal: () => source.palette ?? defaultPalette(),
    transparent: true,
    label: 'Character-block animation',
    scale: 4,
  });
  try {
    await modal<void>(`Animations in ${name.toUpperCase()}`, () => {
      player.show(clips);
      return h(
        'div',
        { class: 'modal-body' },
        clips.length
          ? player.el
          : h('p', { class: 'hint' }, 'No matching character sequences accompany this block set. Add a character and choose this set to animate it.'),
      );
    });
  } finally {
    player.dispose();
  }
}
