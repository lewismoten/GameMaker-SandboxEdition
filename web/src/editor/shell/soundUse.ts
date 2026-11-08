// Which sound slots a game's sound sets hold and what plays them, for Overview › Controls › Sounds.
// Only a character's sequences name a slot (Sequence.sound); PLAYGAME plays the first nine itself.
// Read from the game's files; a damaged file is skipped.
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { LASTSND, parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import type { Project } from '../core/project';

interface SoundUse {
  /** Sound-set files that have the slot: "NEBULA.SND". */
  sets: string[];
  /** Characters whose sequences play it: "HERO.CHR (sequences 3, 4)". */
  characters: string[];
}

/** Every slot found in a sound set (or played by a sequence), with its uses. */
export function soundUses(project: Pick<Project, 'files'>): Map<number, SoundUse> {
  const uses = new Map<number, SoundUse>();
  const at = (slot: number) => uses.get(slot) ?? (uses.set(slot, { sets: [], characters: [] }), uses.get(slot)!);
  for (const file of project.files.names()) {
    const ext = file.slice(file.lastIndexOf('.') + 1).toLowerCase();
    const bytes = project.files.get(file);
    if (!bytes) continue;
    try {
      if (ext === 'snd') parseSoundSet(bytes).freqs.forEach((_, slot) => at(slot).sets.push(file.toUpperCase()));
      else if (ext === 'chr') {
        const bySlot = new Map<number, number[]>();
        parseCharacter(bytes).sequences.forEach((s, i) => {
          if (s.sound >= 0 && s.sound < LASTSND) bySlot.set(s.sound, [...(bySlot.get(s.sound) ?? []), i]);
        });
        for (const [slot, seqs] of bySlot) at(slot).characters.push(`${file.toUpperCase()} (sequence${seqs.length > 1 ? 's' : ''} ${seqs.join(', ')})`);
      }
    } catch {
      /* a damaged file has no uses to show */
    }
  }
  return uses;
}
