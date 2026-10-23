// BACKUP.EXE in C:\DOS on the desk PC: backs up the saved games and high scores of every game
// (or the ones chosen), keeps many dated backups of each, lists them, and puts one back. From
// the command line (BACKUP *, BACKUP TEDDY, /L, /R, /D, /? — see backupArgs.ts) it prints what
// it did, DOS style; with no parameters it has menus. The backups are the same ones the web's
// "Saves & scores" panel and SAVEHACK.EXE keep (project/saveData/backups.ts).
import type { RetroHost } from '../host';
import { toCp437 } from '../text/cp437';
import { ROWS } from '../text/textScreen';
import { deskDate } from '../dos/vfs';
import { backupNow, deleteBackup, listBackups, renameBackup, restoreBackup, type BackupSummary } from '../../project/saveData';
import { loadSaveData } from '../../project/storage';
import { BACKUP_HELP, parseBackupArgs } from './backupArgs';
import { findGame, gamesWithSaves, hackGames, type HackGame } from './saveGames';
import { BAR, BG, BRIGHT, DIM, GREEN, HEAD, RED, TEXT, YELLOW, cell, confirm, dosStamp, editLine, frame, keyBar, messageBox, num, pickList, put, statusLine, type ListRow } from './dosUi';

const TITLE = 'BACKUP 2.1  Saved-game backup for Game-Maker games';
const COPYRIGHT = 'Copyright (C) 1995 Sandbox Software.  Freeware.';
/** What BACKUP labels its backups (the date is kept beside the label). */
export const BACKUP_LABEL = 'BACKUP.EXE';

const stamp = (when: number) => dosStamp(deskDate(when));
const plural = (n: number, one: string, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;

export async function runBackup(h: RetroHost, args: string[]): Promise<void> {
  const out = (text = '') => h.screen.print(`${toCp437(text)}\n`);
  const cmd = parseBackupArgs(args);
  if (cmd.kind === 'ui') return backupUi(h);
  out(TITLE);
  out(COPYRIGHT);
  out();
  if (cmd.kind === 'help') return BACKUP_HELP.forEach((l) => out(l));
  if (cmd.kind === 'error') return out(cmd.message);
  const games = await hackGames(await h.catalog());
  const named = (name: string): HackGame | undefined => {
    const g = findGame(games, name);
    if (!g) out(`Game not found - ${name.toUpperCase()}`);
    return g;
  };

  if (cmd.kind === 'all' || cmd.kind === 'games') {
    const chosen = cmd.kind === 'all' ? games : cmd.games.map(named).filter((g): g is HackGame => !!g);
    if (cmd.kind === 'games' && !chosen.length) return;
    const withSaves = await gamesWithSaves(chosen);
    for (const g of chosen) if (cmd.kind === 'games' && !withSaves.some((w) => w.save === g.save)) out(`${g.dos} has no saved games to back up`);
    if (!withSaves.length) return cmd.kind === 'all' ? out('No saved games to back up.') : undefined;
    out('Backing up saved games...');
    out();
    let files = 0;
    let bytes = 0;
    for (const g of withSaves) {
      const b = await backupNow(g.save, { files: g.files, label: BACKUP_LABEL, by: 'BACKUP' });
      const n = Object.keys(g.files).length;
      files += n;
      bytes += g.bytes;
      out(`  ${cell(g.dos, 9)} ${cell(g.title, 32)}${plural(n, 'file').padStart(9)}${num(g.bytes).padStart(10)} bytes  ${b ? 'OK' : 'FAILED'}`);
    }
    out();
    out(`${plural(withSaves.length, 'game').padStart(11)} backed up, ${plural(files, 'file')}, ${num(bytes)} bytes`);
    return;
  }

  if (cmd.kind === 'list') {
    const g = cmd.game ? named(cmd.game) : undefined;
    if (cmd.game && !g) return;
    const all = await listBackups(g?.save);
    let shown = 0;
    for (const game of g ? [g] : games) {
      const list = all.filter((b) => b.game === game.save);
      if (!list.length) continue;
      if (shown) out();
      out(`Backups of ${game.dos} (${game.title})`);
      out();
      out('    #  Date     Time    Files      Bytes  Label');
      list.forEach((b, i) => out(`  ${String(i + 1).padStart(3)}  ${stamp(b.when)} ${String(b.names.length).padStart(5)}${num(b.bytes).padStart(11)}  ${b.label.slice(0, 32)}`));
      shown++;
      // a long list waits for a key a screen at a time, like DIR /P
      if (shown % 3 === 0) {
        out('Press any key to continue . . .');
        await h.keys.next();
      }
    }
    if (!shown) out(g ? `${g.dos} has no backups` : 'No backups found');
    return;
  }

  const g = named(cmd.game);
  if (!g) return;
  const list = await listBackups(g.save);
  const n = cmd.n ?? 1;
  const b = list[n - 1];
  if (!b) {
    out(list.length ? `${g.dos} has ${plural(list.length, 'backup')}: there is no backup ${n}` : `${g.dos} has no backups`);
    return;
  }
  if (cmd.kind === 'delete') {
    await deleteBackup(b.id);
    out(`Backup ${n} of ${g.dos} (${stamp(b.when)}, ${b.label}) deleted`);
    return;
  }
  out(`Restoring ${g.dos} from backup ${n} of ${stamp(b.when)} (${b.label})...`);
  const safety = await restoreBackup(b.id, { safety: true, by: 'BACKUP' });
  for (const name of b.names) out(`  ${name.toUpperCase()}`);
  out(`${plural(b.names.length, 'file').padStart(11)} restored`);
  if (safety) out(`The saves it replaced are backup 1 now: BACKUP /R ${g.dos} puts them back.`);
}

// ---------------------------------------------------------------- the menus

interface UiGame extends HackGame {
  files: number;
  bytes: number;
  backups: BackupSummary[];
}

async function uiGames(h: RetroHost): Promise<UiGame[]> {
  const games = await hackGames(await h.catalog());
  const backups = await listBackups();
  const rows = await Promise.all(
    games.map(async (g) => {
      const files = await loadSaveData(g.save);
      return { ...g, files: Object.keys(files).length, bytes: Object.values(files).reduce((n, b) => n + b.length, 0), backups: backups.filter((b) => b.game === g.save) };
    }),
  );
  return rows.filter((g) => g.files || g.backups.length);
}

function uiChrome(h: RetroHost, keys: string): void {
  const s = h.screen;
  s.fill(0, 0, 79, ROWS - 1, BG);
  s.fill(0, 0, 79, 0, BAR);
  put(h, 1, 0, BAR, TITLE);
  put(h, 79 - 17, 0, BAR, 'Sandbox Software');
  keyBar(h, keys);
}

const TOP = 2;
const BOTTOM = ROWS - 3;

async function backupUi(h: RetroHost): Promise<void> {
  const s = h.screen;
  s.resetPalette();
  s.cursorVisible = false;
  const picked = new Set<string>();
  let cur = 0;
  let note = '';
  for (;;) {
    uiChrome(h, '~Space~ Mark  ~A~ Mark all  ~B~ Back up  ~Enter~ Backups  ~Esc~ Quit');
    statusLine(h, 'Reading saved games...');
    const games = await uiGames(h);
    frame(h, 1, TOP, 78, BOTTOM, 'Games with saved data');
    put(h, 3, TOP + 1, HEAD, `    ${cell('Name', 10)}${cell('Game', 26)}${'Files'.padStart(6)}${'Bytes'.padStart(10)}${'Backups'.padStart(8)}  Newest`);
    if (!games.length) {
      statusLine(h, '');
      await messageBox(h, ['No saved games yet.', '', 'Play a game and save it (F5), then run BACKUP.', '', 'Press any key.'], BG);
      break;
    }
    const rows: ListRow[] = games.map((g) => ({
      text: `${picked.has(g.save) ? '[\xfb]' : '[ ]'} ${cell(g.dos, 10)}${cell(g.title, 26)}${String(g.files).padStart(6)}${num(g.bytes).padStart(10)}${String(g.backups.length).padStart(8)}  ${g.backups[0] ? stamp(g.backups[0].when).slice(0, 8) : '--'}`,
      a: g.files ? BRIGHT : DIM,
    }));
    statusLine(h, note || `${plural(games.length, 'game')}; ${picked.size ? `${picked.size} marked` : 'none marked (B backs up the one chosen)'}.`, note ? GREEN : TEXT);
    note = '';
    const pick = await pickList(h, rows, { x: 2, y: TOP + 2, w: 75, h: BOTTOM - TOP - 3, cur, hotkeys: [' ', 'A', 'B', 'F2'] });
    cur = pick.i;
    const g = games[cur];
    if (pick.key === 'Escape') break;
    if (pick.key === ' ') {
      if (picked.has(g.save)) picked.delete(g.save);
      else picked.add(g.save);
      cur = Math.min(games.length - 1, cur + 1);
    } else if (pick.key === 'A') {
      const all = games.filter((x) => x.files).every((x) => picked.has(x.save));
      picked.clear();
      if (!all) for (const x of games) if (x.files) picked.add(x.save);
    } else if (pick.key === 'B' || pick.key === 'F2') {
      const chosen = picked.size ? games.filter((x) => picked.has(x.save)) : [g];
      const label = await askLabel(h);
      if (label === null) continue;
      let done = 0;
      for (const x of chosen) {
        statusLine(h, `Backing up ${x.dos}...`);
        if (await backupNow(x.save, { label: label || BACKUP_LABEL, by: 'BACKUP' })) done++;
      }
      picked.clear();
      note = done ? `${plural(done, 'game')} backed up.` : 'Nothing to back up: no saved games there.';
    } else if (pick.key === 'Enter') note = await gameBackups(h, g);
  }
  s.resetPalette();
  s.clear();
}

async function askLabel(h: RetroHost): Promise<string | null> {
  statusLine(h, 'Label for the backup (Enter for BACKUP.EXE):', YELLOW);
  return editLine(h, 47, ROWS - 2, 30, '');
}

/** One game's backups: restore, delete, relabel, back up now. */
async function gameBackups(h: RetroHost, g: UiGame): Promise<string> {
  let cur = 0;
  let note = '';
  for (;;) {
    uiChrome(h, '~Enter~ Restore  ~Del~ Delete  ~L~ Label  ~B~ Back up now  ~Esc~ Back');
    const list = await listBackups(g.save);
    frame(h, 1, TOP, 78, BOTTOM, `Backups of ${g.dos} - ${g.title}`.slice(0, 70));
    put(h, 3, TOP + 1, HEAD, `${'#'.padStart(3)}  ${cell('Date     Time', 16)}${'Files'.padStart(5)}${'Bytes'.padStart(10)}  ${cell('Label', 26)}By`);
    const rows: ListRow[] = list.length
      ? list.map((b, i) => ({ text: `${String(i + 1).padStart(3)}  ${cell(stamp(b.when), 16)}${String(b.names.length).padStart(5)}${num(b.bytes).padStart(10)}  ${cell(b.label, 26)}${b.by ?? 'web'}`, a: b.auto ? YELLOW : BRIGHT }))
      : [{ text: '(no backups yet: B backs up the saves now)', a: DIM }];
    const b = list[Math.min(cur, list.length - 1)];
    statusLine(h, note || (b ? `Holds ${b.names.map((n) => n.toUpperCase()).join(' ')}`.slice(0, 78) : ''), note.startsWith('ERROR') ? RED : note ? GREEN : TEXT);
    note = '';
    const pick = await pickList(h, rows, {
      x: 2,
      y: TOP + 2,
      w: 75,
      h: BOTTOM - TOP - 3,
      cur,
      hotkeys: ['Delete', 'L', 'B', 'R'],
      onMove: (i) => list[i] && statusLine(h, `Holds ${list[i].names.map((n) => n.toUpperCase()).join(' ')}`.slice(0, 78)),
    });
    cur = pick.i;
    const sel = list[cur];
    if (pick.key === 'Escape') return '';
    if (pick.key === 'B') {
      const label = await askLabel(h);
      if (label === null) continue;
      note = (await backupNow(g.save, { label: label || BACKUP_LABEL, by: 'BACKUP' })) ? 'Backed up.' : 'ERROR: no saved games to back up.';
      cur = 0;
      continue;
    }
    if (!sel) continue;
    if (pick.key === 'Delete') {
      if (await confirm(h, [`Delete backup ${cur + 1} of ${g.dos}`, `(${stamp(sel.when)}, ${sel.label})?`])) {
        await deleteBackup(sel.id);
        note = 'Backup deleted.';
      }
    } else if (pick.key === 'L') {
      statusLine(h, 'New label:', YELLOW);
      const label = await editLine(h, 13, ROWS - 2, 40, sel.label);
      if (label?.trim()) {
        await renameBackup(sel.id, label);
        note = 'Label changed.';
      }
    } else if (await confirm(h, [`Put back ${g.dos}'s saves from ${stamp(sel.when)}?`, 'The saves there now are backed up first.'])) {
      await restoreBackup(sel.id, { safety: true, by: 'BACKUP' });
      note = `Restored. The saves it replaced are backup 1 now.`;
      cur = 0;
    }
  }
}
