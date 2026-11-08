// FLAGS.EXE in C:\DOS on the desk PC (and in the BBS's Warez area): lists, sets, clears and resets
// the browser state that is hard to reach by playing (merit badges, felt eggs, tin hearts, score
// trophy tiers, the hint line bill, the registration card's mail, the BBS caller file, the room
// clock), and backs it up to C:\DOS\FLAGS.BAK. A simulation and debugging aid for this pretend PC
// only: it never writes a game's save files (SAVEHACK's job). See flagsItems.ts.
import type { RetroHost } from '../host';
import { toCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { FlagError, ITEMS } from './flagsItems';
import { FLAGS_HELP, FLAGS_TITLE } from './flagsText';
import { makeBak, parseBak, readBak, restoreBak, writeBak, BAK_NAME } from './flagsBackup';

type FlagsCmd =
  | { kind: 'list' }
  | { kind: 'help' }
  | { kind: 'backup' }
  | { kind: 'restore' }
  | { kind: 'do'; verb: 'SET' | 'CLEAR' | 'RESET'; what: string; words: string[] }
  | { kind: 'error'; message: string };

export function parseFlags(args: string[]): FlagsCmd {
  const words = args.flatMap((a) => a.split(/(?=\/)/)).filter(Boolean);
  const up = words.map((w) => w.toUpperCase());
  if (up.includes('/?') || up.includes('HELP')) return { kind: 'help' };
  if (!words.length) return { kind: 'list' };
  const sw = up.filter((w) => w.startsWith('/'));
  if (sw.length) {
    if (sw.length > 1 || up.length > 1) return { kind: 'error', message: 'Use /BACKUP or /RESTORE alone' };
    if (sw[0] === '/BACKUP') return { kind: 'backup' };
    if (sw[0] === '/RESTORE') return { kind: 'restore' };
    return { kind: 'error', message: `Invalid switch - ${sw[0]}` };
  }
  const verb = up[0];
  if (verb !== 'SET' && verb !== 'CLEAR' && verb !== 'RESET') return { kind: 'error', message: `Don't know "${words[0]}" - SET, CLEAR or RESET` };
  const what = up[1];
  if (!what) return { kind: 'error', message: `${verb} what? Names are in FLAGS /?` };
  if (what !== 'ALL' && !ITEMS.some((i) => i.id === what)) return { kind: 'error', message: `Don't know "${words[1]}" - FLAGS /? lists the names` };
  if (what === 'ALL' && verb !== 'RESET') return { kind: 'error', message: `${verb} ALL isn't offered; only RESET ALL` };
  return { kind: 'do', verb, what, words: words.slice(2) };
}

const pad = (s: string, n: number) => s.padEnd(n);

export async function runFlags(h: RetroHost, args: string[]): Promise<void> {
  const out = (text = '') => h.screen.print(`${toCp437(text)}\n`);
  const cmd = parseFlags(args);
  out(FLAGS_TITLE);
  out();
  if (cmd.kind === 'error') return out(`${cmd.message}. Type FLAGS /? for help.`);
  const list = async () => {
    for (const i of ITEMS) {
      const v = await i.show();
      if (v !== undefined) out(`  ${pad(i.id, 7)}${v}`);
    }
  };
  if (cmd.kind === 'help') {
    return FLAGS_HELP.forEach((l) => out(l));
  }
  if (cmd.kind === 'list') {
    await list();
    const bak = parseBak(await readBak());
    out();
    out(bak ? `${BAK_NAME} holds a backup from ${new Date(bak.at).toLocaleString('en-US')}.` : `No ${BAK_NAME} yet. FLAGS /BACKUP makes one.`);
    out('Nothing was changed. FLAGS /? tells how.');
    return;
  }
  if (cmd.kind === 'backup') {
    await writeBak(await makeBak());
    return out(`Saved C:\\DOS\\${BAK_NAME}. FLAGS /RESTORE puts everything back as it is now.`);
  }
  if (cmd.kind === 'restore') {
    const bak = parseBak(await readBak());
    if (!bak) return out(`No usable ${BAK_NAME}. Make one with FLAGS /BACKUP.`);
    await restoreBak(bak);
    return out(`Restored from ${BAK_NAME} (${new Date(bak.at).toLocaleString('en-US')}).`);
  }
  // a change: keep a backup first when there is none
  const targets = cmd.what === 'ALL' ? ITEMS.filter((i) => i.reset) : ITEMS.filter((i) => i.id === cmd.what);
  const act = (i: (typeof ITEMS)[number]) => (cmd.verb === 'SET' ? i.set : cmd.verb === 'CLEAR' ? i.clear : i.reset);
  const none = targets.find((i) => !act(i));
  // Bonus games stay unnamed until one is open: before then BONUS answers like any unknown name.
  if (none?.id === 'BONUS' && (await none.show()) === undefined) return out(`Don't know "${none.id}" - FLAGS /? lists the names. Type FLAGS /? for help.`);
  if (none) return out(`${none.id} can't be ${cmd.verb === 'SET' ? 'set' : cmd.verb === 'CLEAR' ? 'cleared' : 'reset'} here. ${none.elsewhere ?? ''}`.trim());
  if (!parseBak(await readBak())) {
    await writeBak(await makeBak());
    out(`Kept ${BAK_NAME} first; FLAGS /RESTORE undoes this session.`);
  }
  let failed = false;
  for (const i of targets) {
    try {
      out(`  ${pad(i.id, 7)}${await act(i)!.call(i, cmd.words)}`);
    } catch (e) {
      if (!(e instanceof FlagError)) throw e;
      failed = true;
      out(`  ${pad(i.id, 7)}${e.message}. FLAGS /? tells how.`);
    }
  }
  out();
  out(failed ? 'Nothing was changed there. Game saves were not touched.' : 'Done. Game saves were not touched.');
}
