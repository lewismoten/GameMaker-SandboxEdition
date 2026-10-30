// Linked character animations and oriented painter views, without changing native definitions.
import type { Project } from '../../core/project';
import { normalize } from '../../../project/files';
import { ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { CHARBL, MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { frameCount, parseCharacter, SEQUENCE_NAMES, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { scanName } from '@lewismoten/gamemaker-sandbox-engine/input/scancodes';
import { characterClips, type Clip } from './animClip';
import type { BlockGroup } from './blockGroups';

export interface CharacterAnimation {
  file: string;
  sequence: number;
  label: string;
  frames: { index: number; frame: Frame; tick: number }[];
  blocks: number[];
  clip: Clip;
}
export interface CharacterFrameView {
  key: string;
  current: number;
  group: BlockGroup;
  orientations: number[];
}

export function characterAnimations(project: Pick<Project, 'game' | 'files'>, cbl: string): CharacterAnimation[] {
  const names = new Set<string>();
  let bound = false;
  for (const scene of project.game().scenes) {
    if (scene.gametype !== ADVTYPE || normalize(scene.files[6]) !== normalize(cbl)) continue;
    bound = true;
    const name = normalize(scene.files[5]);
    if (project.files.has(name)) names.add(name);
  }
  if (!bound) {
    const paired = normalize(cbl.replace(/\.cbl$/i, '.chr'));
    if (project.files.has(paired)) names.add(paired);
    else if (project.files.byExtension('cbl').length === 1) project.files.byExtension('chr').forEach((name) => names.add(name));
  }
  const out: CharacterAnimation[] = [];
  for (const file of names) {
    try {
      const chr = parseCharacter(project.files.get(file)!);
      chr.sequences.forEach((sequence, index) => {
        let tick = 0;
        const frames: CharacterAnimation['frames'] = [];
        sequence.frames.slice(0, frameCount(sequence)).forEach((frame, index) => {
          if (frame.pic2 === MONBL) return;
          if (frame.pic1 < CHARBL || frame.pic2 < CHARBL) frames.push({ index, frame, tick });
          tick += Math.max(1, frame.pause);
        });
        if (!frames.length) return;
        const label = `${file.toUpperCase()} · ${SEQUENCE_NAMES[index] ?? (sequence.key ? `Key ${scanName(sequence.key >> 8)}` : `Sequence ${index}`)}`;
        const clip = characterClips({ ...chr, sequences: [sequence] }, undefined, () => label)[0];
        out.push({
          file,
          sequence: index,
          label,
          frames,
          blocks: [...new Set(frames.flatMap(({ frame }) => [frame.pic1, frame.pic2].filter((pic) => pic < CHARBL)))],
          clip,
        });
      });
    } catch {
      /* An unreadable character does not hide the other linked characters. */
    }
  }
  return out;
}

export function characterFrameView(animation: CharacterAnimation, position: number, size: 1 | 2, half: 0 | 1): CharacterFrameView {
  const selected = animation.frames[position];
  if (!selected) throw new RangeError('Choose a frame in this animation');
  const frame = selected.frame;
  const cells = [frame.pic1, frame.pic2].map((pic) => (pic < CHARBL ? pic : -1));
  if (cells[half] < 0) half = cells[0] >= 0 ? 0 : 1;
  const orientations = [frame.orient & 15, (frame.orient >> 4) & 15];
  return {
    key: `character:${animation.file}:${animation.sequence}:${selected.index}:${size}:${size === 1 ? half : 'both'}`,
    current: cells[half],
    group: { name: `${animation.label}, frame ${selected.index + 1}`, cols: 1, rows: size, cells: size === 2 ? cells : [cells[half]] },
    orientations: size === 2 ? orientations : [orientations[half]],
  };
}
