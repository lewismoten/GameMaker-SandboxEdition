// Every backup section, in the order the dialogs list them and an import applies them (My games
// first, so the saves of a game kept as a second copy follow it).
import type { SectionId } from '../inventory';
import { achievements } from './achievements';
import { desk } from './desk';
import { eggs } from './eggs';
import { hearts } from './hearts';
import { notes } from './notes';
import { projects } from './projects';
import { saves } from './saves';
import { ai, prefs } from './settings';
import { trophies } from './trophies';
import type { Section } from './types';

export const SECTIONS: readonly Section[] = [projects, saves, trophies, achievements, eggs, hearts, desk, notes, prefs, ai] as Section[];

export const sectionById = (id: string): Section | undefined => SECTIONS.find((s) => s.id === id);

export const SECTION_IDS: readonly SectionId[] = SECTIONS.map((s) => s.id);
