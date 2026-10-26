// SAVEHACK.ZIP's words: its FILE_ID.DIZ (10 lines of at most 45 columns, as the BBS's file
// listing shows it) and SAVEHACK.DOC, the author's readme, which also tells EGG.EXE's unshown keys
// (eggs/eggExe.ts; the zine, manual/zine, only introduces EGG). vesuvian is Lewis's BBS handle,
// short for Vesuvian Doppelganger, a Magic: The Gathering card.

import { warezSignoff } from '../bbs/fileId';

export const SAVEHACK_DIZ: string[] = [
  'SAVEHACK v1.2a * SAVE GAME EDITOR       [1/1]',
  'by vesuvian, 1995                   Freeware',
  '---------------------------------------------',
  'Edit Game-Maker saved games: score, lives,',
  'hit points, money, counters and inventory.',
  'Max all stats with one key! New saves in',
  'empty slots. Range checks. Backs up first.',
  '   Stuck on a level? Not anymore. ;-)',
  '---------------------------------------------',
  warezSignoff(),
];

export const SAVEHACK_DOC: string[] = [
  'SAVEHACK v1.2a - DOS Save Game Editor',
  'Written by: vesuvian',
  '',
  'WHAT IT DOES',
  '  Edits the saved games (GAME0.SAV - GAME9.SAV) and the high-score',
  '  table (.HIS) of games made with Game-Maker.',
  '',
  'HOW TO USE IT',
  '  Type SAVEHACK. Pick a game, then a saved game or the high scores.',
  '  Arrow keys move, Enter changes a value, Esc goes back.',
  '    N     New save: an empty slot gets the game as it starts (first',
  '          level, starting hit points, lives and items). Name it, hack',
  '          it, then F6 in the game loads it. Never saved? No problem.',
  '    M     Max all stats (as high as the game handles well)',
  '    U     Unlimited (counters and sequence uses)',
  '    Del   Empty an inventory slot',
  '    F2    Save',
  '',
  'IS IT SAFE?',
  '  SAVEHACK checks every number against what the game can hold and',
  '  warns you before a value that may overflow. Before its first change',
  '  to a game it backs up your saves ("Original"); pick Restore original',
  '  saves to put them back. BACKUP /L lists the backups too.',
  '',
  'AND ONE MORE THING',
  "  Felt eggs? Not SAVEHACK's department.",
  '  But you know EGG, the egg inspector (type EGG anywhere)? Its key bar',
  "  leaves some out. On an egg's row:",
  "    Enter Add it if you don't have it, break it if you do",
  '    A     Add it          B     Break it',
  '  R puts it back the way your saves say. Like SAVEHACK, it never',
  '  touches a saved game. (Finding them for real is more fun. Just sayin.)',
  '',
  'Greetings to PIXEL WIZARD, THE BLOCKSMITH, NIGHT OWL and all SYSOPs.',
  'Call THE -= S A N D B O X =- BBS, 412-555-SAND.',
];
