// Starting contents for new files, shared by the web workspace and the DOS-look Game-Maker.
import { KIND_LABELS, type FileKind, type Project } from '../core/project';
import { newBlockSet, serializeBlocks, type BlockKind } from '../../formats/blocks';
import { defaultPalette, serializePalette } from '../../formats/palette';
import { newMonsterSet, serializeMonsters } from '../../formats/monster';
import { newCharacter, serializeCharacter } from '../../formats/character';
import { newMap, serializeMap } from '../../formats/map';
import { newSoundSet, serializeSoundSet } from '../../formats/sound';
import { serializeBackdrop, serializeSlideList } from '../../formats/graphicScripts';
import { textBytes } from '../../formats/binary';

export interface FileTemplate {
  kind: FileKind;
  label: string;
  make: (p: Project) => Uint8Array;
}

export const TEMPLATES: FileTemplate[] = [
  { kind: 'pal', label: 'Palette', make: (p) => serializePalette(p.paletteFor('').palette.slice() || defaultPalette()) },
  ...(['bbl', 'mbl', 'cbl'] as BlockKind[]).map((k) => ({ kind: k, label: KIND_LABELS[k], make: () => serializeBlocks(newBlockSet(k)) })),
  { kind: 'mon', label: 'Monsters', make: () => serializeMonsters(newMonsterSet()) },
  { kind: 'chr', label: 'Character', make: () => serializeCharacter(newCharacter()) },
  { kind: 'map', label: 'Map', make: () => serializeMap(newMap()) },
  { kind: 'snd', label: 'Sound set', make: () => serializeSoundSet(newSoundSet()) },
  { kind: 'txt', label: 'Text screen', make: () => textBytes('Write your text here.\r\nLines are 31 characters wide.\r\n') },
  { kind: 'lst', label: 'Slide show', make: () => serializeSlideList([]) },
  { kind: 'bkd', label: 'Backdrop', make: () => serializeBackdrop({ x: 0, y: 0, gif: '' }) },
];

export function templateFor(kind: FileKind): FileTemplate | undefined {
  return TEMPLATES.find((t) => t.kind === kind);
}
