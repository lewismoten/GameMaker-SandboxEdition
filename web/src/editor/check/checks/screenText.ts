// The level check's reading of the front screens' words: instructions or a story that runs past
// three pages (players skim, then skip), and pages left as placeholders (empty, or "pending").
import type { Game } from '../../../formats/game';
import type { Finding } from '../findings';
import type { FileSource } from '../sim';
import { textPages, type TextRole } from '../textScreens';

/** Pages of help or story most players read before they skip, and a length worth a suggestion. */
export const MOST_PAGES = 3;
const TOO_MANY = 6;

const LONG: Partial<Record<TextRole, string>> = { instructions: 'instructions', story: 'storyline' };
const PLACEHOLDER = /\b(?:pending|coming soon|to be written|under construction|lorem ipsum|todo|tbd|placeholder|fill (?:this )?in)\b/i;

const WORD: Record<TextRole, string> = {
  title: 'title screen',
  menu: 'menu',
  story: 'storyline',
  instructions: 'instructions',
  credits: 'credits',
  scores: 'high scores',
  won: 'won screen',
  lost: 'lost screen',
  intro: 'level card',
  exit: 'level exit screen',
};

export function screenText(game: Game, files: FileSource): Finding[] {
  const out: Finding[] = [];
  const pages = textPages(game, files);
  // pages of each slot's own files, counted once each
  const counted = new Map<TextRole, Set<string>>();
  for (const p of pages) if (LONG[p.role]) counted.set(p.role, (counted.get(p.role) ?? new Set()).add(`${p.file}|${p.page}`));
  for (const [role, set] of counted) {
    if (set.size <= MOST_PAGES) continue;
    out.push({
      check: 'help-length',
      severity: set.size >= TOO_MANY ? 'warning' : 'info',
      title: `The ${LONG[role]} run${role === 'instructions' ? '' : 's'} to ${set.size} pages`,
      detail: `Most players read ${MOST_PAGES} pages at most before they skip. Is every page needed? Put the goal and the keys first, and move the rest to the level cards where each thing is first met, or to the printed manual.`,
      where: { scene: 0, file: [...set][0].split('|')[0] },
    });
  }
  const seen = new Set<string>();
  for (const p of pages) {
    const key = `${p.file}|${p.page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const text = p.lines.join('\n');
    const blank = !text.trim();
    const holder = PLACEHOLDER.exec(text);
    if (!blank && !holder) continue;
    out.push({
      check: 'ending',
      severity: 'warning',
      title: blank
        ? `A page of the ${WORD[p.role]} is empty`
        : `The ${WORD[p.role]} say${p.role === 'instructions' || p.role === 'credits' ? '' : 's'} “${holder![0]}”`,
      detail: `${p.file}${p.pages > 1 ? `, page ${p.page + 1}` : ''}. A placeholder left in tells players the game isn’t finished. Fill it in, or take the page out.`,
      where: { scene: p.scene, file: p.file },
    });
  }
  return out;
}
