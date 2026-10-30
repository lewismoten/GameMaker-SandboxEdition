// Native character frames on an audition clock; birth commands emit events without display pauses.
import type { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { CHARBL, MONBL, TRANSPARENT, parseBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { frameCount, parseCharacter, SEQUENCE_NAMES, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMonsters, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { scanName } from '@lewismoten/gamemaker-sandbox-engine/input/scancodes';
import { charactersForBlocks } from './characterSets';

export interface AuditionEvent {
  tick: number;
  frame: Frame;
}
export interface CharacterAudition {
  label: string;
  sequence: number;
  events: AuditionEvent[];
  steps: AuditionEvent[];
  ticks: number;
  monsters?: Monster[];
  monsterBlocks?: Block[];
}
export interface CharacterAuditions {
  blocks: Block[];
  sequences: CharacterAudition[];
  pose?: Frame;
}
const optional = <T>(read: () => T): T | undefined => {
  try {
    return read();
  } catch {
    return undefined;
  }
};

export function characterAuditions(files: Pick<GameFiles, 'get' | 'names'>, name: string, bytes: Uint8Array): CharacterAuditions {
  const blocks = parseBlocks(bytes, CHARBL),
    sequences: CharacterAudition[] = [];
  for (const source of charactersForBlocks(files, name)) {
    const chr = optional(() => parseCharacter(source.bytes));
    if (!chr) continue;
    const mon = source.monsters && files.get(source.monsters),
      mbl = source.monsterBlocks && files.get(source.monsterBlocks);
    const monsters = mon ? optional(() => parseMonsters(mon)) : undefined,
      monsterBlocks = mbl ? optional(() => parseBlocks(mbl, MONBL)) : undefined;
    const order = [0, ...chr.sequences.slice(5).map((_, i) => i + 5), 3, 4, 2, 1];
    for (const index of order) {
      const sequence = chr.sequences[index],
        active = sequence.frames.slice(0, frameCount(sequence));
      if (!active.length) continue;
      let tick = 0;
      const events = active.map((frame) => {
        const event = { tick, frame };
        if (frame.pic2 !== MONBL) tick += Math.max(1, frame.pause);
        return event;
      });
      const label = SEQUENCE_NAMES[index] ?? (sequence.key ? `Key ${scanName(sequence.key >> 8)}` : `Sequence ${index}`);
      sequences.push({
        label: `${source.file.toUpperCase()} · ${label}`,
        sequence: index,
        events,
        steps: events.filter((event) => event.frame.pic2 !== MONBL),
        ticks: Math.max(1, tick),
        monsters,
        monsterBlocks,
      });
    }
  }
  const pose = sequences
    .flatMap((sequence) => sequence.steps)
    .find(({ frame }) => [frame.pic1, frame.pic2].some((index) => index < CHARBL && blocks[index].pixels.some((pixel) => pixel !== TRANSPARENT)))?.frame;
  return { blocks, sequences, pose };
}

export function auditionFrame(sequence: CharacterAudition, tick: number, fallback?: Frame): Frame | undefined {
  const phase = Math.max(0, tick) % sequence.ticks;
  for (let i = sequence.steps.length - 1; i >= 0; i--) if (sequence.steps[i].tick <= phase) return sequence.steps[i].frame;
  return fallback;
}

/** Commands at a loop boundary precede the next loop's first picture, just as PLAYGAME scans them. */
export function auditionEvents(sequence: CharacterAudition, from: number, to: number): AuditionEvent[] {
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return [];
  const out: AuditionEvent[] = [];
  const first = Math.max(0, Math.floor(from / sequence.ticks));
  const cycles = Math.min(129, Math.floor(to / sequence.ticks) - first + 1);
  for (let offset = 0; offset < cycles; offset++) {
    const cycle = first + offset;
    for (const event of sequence.events) {
      const tick = cycle * sequence.ticks + event.tick;
      if (tick > from && tick <= to) {
        out.push({ ...event, tick });
        if (out.length >= 128) return out;
      }
    }
  }
  return out;
}
