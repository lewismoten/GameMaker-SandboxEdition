// The level check's "help names the right keys": the keys the game's text screens tell the
// player to press, read against the keys its characters' sequences are bound to (and PLAYGAME's
// own function keys). A key the help names that nothing uses sends players mashing a dead key.
// Only a key written as a key counts: "Press P", "the P key", "P to pick up", "P picks things
// up", or a legend line ("Z Plasma Lance"), so ordinary words and the letters A and I are left alone.
import type { Game } from '../../../formats/game';
import { SCAN } from '../../../input/scancodes';
import type { GameFiles } from '../../../project/files';
import { GLOBAL_KEYS, gameKeyMap } from '../../keymap/keyMap';
import type { Finding } from '../findings';
import { textPages, type TextRole } from '../textScreens';

/** Key words as players write them, and their scan codes. */
const NAMED: Record<string, number> = {
  space: SCAN.Space,
  spacebar: SCAN.Space,
  enter: SCAN.Enter,
  return: SCAN.Enter,
  ctrl: SCAN.ControlLeft,
  control: SCAN.ControlLeft,
  alt: SCAN.AltLeft,
  shift: SCAN.ShiftLeft,
  tab: SCAN.Tab,
  backspace: SCAN.Backspace,
};

/** The scan code of a key token ("P", "7", "Space", "F7"), or undefined. */
function scanOf(token: string): number | undefined {
  if (/^[A-Z]$/.test(token)) return SCAN[`Key${token}`];
  if (/^[0-9]$/.test(token)) return SCAN[`Digit${token}`];
  if (/^F([1-9]|1[0-2])$/.test(token)) return SCAN[token];
  return NAMED[token.toLowerCase()];
}

// a key token: a capital letter or digit standing alone, F1-F12, or a key word
const KEY = String.raw`(?:F1[0-2]|F[1-9]|[A-Z0-9]|Space(?:bar)?|SPACE(?:BAR)?|Enter|ENTER|Ctrl|CTRL|Alt|ALT|Shift|SHIFT|Tab|TAB|Backspace|BACKSPACE)`;
// keys joined: "Q/E", "Z or X", "4, 6 and 8"
const GROUP = String.raw`${KEY}(?:\s*(?:/|,|\bor\b|\band\b|&)\s*${KEY})*`;
const B = String.raw`(?<![A-Za-z0-9'’])`;
const E = String.raw`(?![A-Za-z0-9'’])`;
/** Each word written lower case, capitalized or in capitals. */
const anyCase = (words: string) =>
  words
    .split('|')
    .flatMap((w) => [w, w[0].toUpperCase() + w.slice(1), w.toUpperCase()])
    .join('|');
const VERBS =
  'picks|drops|fires|shoots|jumps|uses|digs|throws|swings|grabs|takes|gets|opens|turns|switches|lays|places|puts|casts|swims|flies|runs|walks|moves|climbs|ducks|crouches|hops|kicks|punches|hits|attacks|strikes|blocks|dashes|rolls|talks|says|activates|toggles|selects|launches|drinks|eats|heals|brakes|boosts|honks|barks|zaps|blasts|lifts|carries|pushes|pulls|hides|shows';
const PATTERNS = [
  // "Press P", "hold the Space bar"
  new RegExp(String.raw`\b(?:${anyCase('press|presses|pressing|hit|hitting|tap|tapping|hold|holding|push|use')})\s+(?:the\s+|THE\s+)?(${GROUP})${E}`, 'g'),
  // "press space", "the space bar"
  new RegExp(String.raw`\b(?:${anyCase('press|hit|tap|hold|push|use')})\s+(?:the\s+)?(space|spacebar|enter|ctrl|alt|shift|tab)\b`, 'g'),
  new RegExp(String.raw`\b(space|enter|ctrl|alt|shift|tab)\s+(?:bar|key)\b`, 'g'),
  // "the P key", "Space bar"
  new RegExp(String.raw`${B}(${GROUP})\s+(?:${anyCase('key|keys|button|bar')})\b`, 'g'),
  // "P to pick up"
  new RegExp(String.raw`${B}(${GROUP})\s+to\s+[a-z]`, 'g'),
  // "P picks things up"
  new RegExp(String.raw`${B}(${GROUP})\s+(?:${anyCase(VERBS)})\b`, 'g'),
  // "P: pick up", "P - pick up", "P = jump"
  new RegExp(String.raw`${B}(${GROUP})\s*(?::|=|-{1,2}|–|—)\s+[A-Za-z]`, 'g'),
  // a legend line: "Z Plasma Lance", "Q/E Dash Boots"
  new RegExp(String.raw`^\s*(${GROUP})\s+[A-Za-z]`, 'gm'),
];

/** Context that names a key but not one for play ("press Space to go on", the number pad). */
const NOT_PLAY = /\bto\s+(?:continue|go on|start|begin|skip|return|play|read|see|leave)\b|\bany key\b/i;

interface NamedKey {
  scan: number;
  token: string;
  line: string;
}

/** A page cut where a blank line or a heading in capitals starts something new. */
function blocks(text: string): string[] {
  const out: string[][] = [[]];
  for (const line of text.split('\n')) {
    const heading = /^[^a-z]*[A-Z]{3}[^a-z]*$/.test(line) && !/[:=]/.test(line) && line.trim().split(/\s+/).length <= 4;
    if (!line.trim() || heading) out.push([]);
    if (line.trim()) out[out.length - 1].push(line);
  }
  return out.filter((b) => b.length).map((b) => b.join('\n'));
}

/** Every key the text tells the player to press. */
export function namedKeys(text: string): NamedKey[] {
  const out: NamedKey[] = [];
  const seen = new Set<number>();
  for (const block of blocks(text)) {
    // a legend line counts where the block is about keys
    const aboutKeys = /\b(?:keys?|controls?|press|buttons?)\b/i.test(block);
    for (const re of PATTERNS) {
      const legend = re === PATTERNS[PATTERNS.length - 1];
      if (legend && !aboutKeys) continue;
      re.lastIndex = 0;
      for (let m = re.exec(block); m; m = re.exec(block)) {
        const from = block.lastIndexOf('\n', m.index + m[0].search(/\S/)) + 1;
        const to = block.indexOf('\n', m.index + m[0].length);
        const line = block
          .slice(from, to < 0 ? undefined : to)
          .replace(/\s+/g, ' ')
          .trim();
        const rest = block.slice(m.index, m.index + 60);
        // a number pad's digits are the arrows
        const pad = /\b(?:number|num|key)\s*pad\b|\bkeypad\b|\bnumpad\b/i.test(block.slice(Math.max(0, m.index - 40), m.index + 40));
        for (const token of m[1].split(/\s*(?:\/|,|\bor\b|\band\b|&)\s*/i)) {
          if (!token) continue;
          const word = /^[A-Za-z]{2,}$/.test(token);
          const named = word ? token[0].toUpperCase() + token.slice(1).toLowerCase() : token;
          // a capital A or I on its own is a word, unless pressed or called a key
          if ((token === 'A' || token === 'I') && re !== PATTERNS[0] && re !== PATTERNS[3]) continue;
          if (/^[0-9]$/.test(token) && (pad || legend || re === PATTERNS[5])) continue;
          if (legend && word) continue;
          if (word && NOT_PLAY.test(rest)) continue;
          const scan = scanOf(named);
          if (scan === undefined || seen.has(scan)) continue;
          seen.add(scan);
          out.push({ scan, token: named, line });
        }
      }
    }
  }
  return out;
}

const ARROWS = new Set([72, 75, 77, 80, 71, 73, 79, 81]);

/** The roles whose pages tell players how to play. */
const HELP_ROLES = new Set<TextRole>(['instructions', 'story', 'intro', 'exit']);

const ROLE_WORD: Record<TextRole, string> = {
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

/** Keys a text screen names that no character's sequence and no PLAYGAME function key uses. */
export function helpKeys(game: Game, files: GameFiles): Finding[] {
  const km = gameKeyMap(files);
  if (!km.levels.length || km.missing.length === km.levels.length) return [];
  const bound = new Set<number>([...km.keys.map((k) => k.scan), ...GLOBAL_KEYS.map((g) => g.scan)]);
  const out: Finding[] = [];
  const reported = new Set<number>();
  for (const p of textPages(game, files)) {
    if (!HELP_ROLES.has(p.role)) continue;
    for (const n of namedKeys(p.lines.join('\n'))) {
      if (bound.has(n.scan) || reported.has(n.scan)) continue;
      // the right Shift is the left one's twin
      if (n.scan === SCAN.ShiftLeft && bound.has(SCAN.ShiftRight)) continue;
      reported.add(n.scan);
      const keyName = n.token;
      const used = km.keys.filter((k) => !ARROWS.has(k.scan) && k.uses.some((u) => u.action.kind !== 'nothing')).map((k) => k.name);
      out.push({
        check: 'help-keys',
        severity: 'warning',
        title: `The ${ROLE_WORD[p.role]} name${p.role === 'instructions' || p.role === 'credits' ? '' : 's'} the ${keyName} key, which nothing in the game uses`,
        detail: `“${n.line}” (${p.file}${p.pages > 1 ? `, page ${p.page + 1}` : ''}). No character’s sequence is on ${keyName}${used.length ? `; the keys in use beyond the arrows are ${used.join(', ')}` : ''}. Fix the text, or put the move on the key it names.`,
        where: { scene: p.scene, file: p.file },
      });
    }
  }
  return out;
}
