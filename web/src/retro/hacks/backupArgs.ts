// BACKUP.EXE's command line, as DOS utilities read theirs: switches with / (or -), any case,
// and "/R TEDDY 2" or "/R:TEDDY" alike.
//
//   BACKUP                 the menus
//   BACKUP *               back up every game's saves
//   BACKUP game [game…]    back up those games
//   BACKUP /L [game]       list the backups (of one game)
//   BACKUP /R game [n]     restore the newest backup (or the nth, 1 = newest)
//   BACKUP /D game n       delete the nth backup
//   BACKUP /?              help

type BackupCommand =
  | { kind: 'ui' }
  | { kind: 'help' }
  | { kind: 'all' }
  | { kind: 'games'; games: string[] }
  | { kind: 'list'; game?: string }
  | { kind: 'restore'; game: string; n?: number }
  | { kind: 'delete'; game: string; n: number }
  | { kind: 'error'; message: string };

export function parseBackupArgs(args: string[]): BackupCommand {
  // a switch's value may follow a colon: /R:TEDDY
  const words = args.flatMap((a) => {
    const m = /^[/-]([A-Za-z?]):(.+)$/.exec(a);
    return m ? [`/${m[1]}`, m[2]] : [a];
  });
  if (!words.length) return { kind: 'ui' };
  const sw = words.filter((w) => /^[/-]/.test(w)).map((w) => w.slice(1).toUpperCase());
  const rest = words.filter((w) => !/^[/-]/.test(w));
  const bad = sw.find((s) => !['?', 'R', 'L', 'D'].includes(s));
  if (bad !== undefined) return { kind: 'error', message: `Invalid switch - /${bad}` };
  if (sw.includes('?')) return { kind: 'help' };
  if (sw.length > 1) return { kind: 'error', message: 'Too many parameters' };
  const num = (s: string | undefined): number | undefined | false => {
    if (s === undefined) return undefined;
    if (!/^\d+$/.test(s) || Number(s) < 1) return false;
    return Number(s);
  };
  switch (sw[0]) {
    case 'L':
      if (rest.length > 1) return { kind: 'error', message: 'Too many parameters' };
      return rest[0] && rest[0] !== '*' ? { kind: 'list', game: rest[0] } : { kind: 'list' };
    case 'R':
    case 'D': {
      if (!rest[0]) return { kind: 'error', message: 'Required parameter missing' };
      if (rest.length > 2) return { kind: 'error', message: 'Too many parameters' };
      const n = num(rest[1]);
      if (n === false) return { kind: 'error', message: `Invalid parameter - ${rest[1]}` };
      if (sw[0] === 'R') return { kind: 'restore', game: rest[0], n };
      if (n === undefined) return { kind: 'error', message: 'Required parameter missing' };
      return { kind: 'delete', game: rest[0], n };
    }
  }
  if (rest.includes('*') || rest.includes('*.*')) return rest.length === 1 ? { kind: 'all' } : { kind: 'error', message: 'Too many parameters' };
  return { kind: 'games', games: rest };
}

export const BACKUP_HELP = [
  'Backs up and restores saved games and high scores.',
  '',
  'BACKUP [* | game [game...]]',
  'BACKUP /L [game]',
  'BACKUP /R game [n]',
  'BACKUP /D game n',
  '',
  '  *       Backs up the saved games of every game that has any.',
  '  game    A game by its DOS name (TEDDY, ORB) or its id.',
  '  /L      Lists the backups, newest first, numbered.',
  '  /R      Restores backup n of a game (1, the newest, if no n).',
  '  /D      Deletes backup n of a game.',
  '',
  'BACKUP with no parameters starts the menus.',
];
