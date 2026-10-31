// ROOMFIX.EXE in C:\DOS on the desk PC: puts the desk room's small remembered states back the
// way they started (the toy safe's door, the lights, the lume paint, the mug, the mouse pad and
// the like). Never touches game saves, achievements, felt eggs or tin hearts. See roomFixItems.ts.
import type { RetroHost } from '../host';
import { toCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { ITEMS, type FixItem } from './roomFixItems';

const TITLE = 'ROOMFIX 1.0  Puts the desk room back the way it started';

export const ROOMFIX_HELP = [
  'ROOMFIX [what...] [/FULL]',
  'ROOMFIX /?',
  '',
  '  (nothing)  Shows each thing and what it is set to now.',
  "  /SAFE      Locks Teddy's toy safe again, as if it was never opened.",
  '             Coins spent and treats bought are kept.',
  '  /FULL      With /SAFE: gives the coins back and clears the treats too.',
  '  /ROOM      Puts back the lights, lume paint, mug, mouse pad, mouse and shelf.',
  '  /ALL       Does /SAFE and /ROOM.',
  '  /?         This help.',
  '',
  'Or name just what you want: ROOMFIX LIGHTS MUG',
  `  Names: ${ITEMS.map((i) => i.id).join(' ')}`,
  '',
  'Saved games, scores, trophies, eggs and hearts are never touched.',
  'The curtains and the window keep nothing, so there is nothing to fix.',
];

type Cmd = { kind: 'list' } | { kind: 'help' } | { kind: 'reset'; ids: string[]; full: boolean } | { kind: 'error'; message: string };

export function parseRoomFix(args: string[]): Cmd {
  const words = args.flatMap((a) => a.split(/(?=\/)/)).filter(Boolean);
  const sw = words.filter((w) => w.startsWith('/')).map((w) => w.slice(1).toUpperCase());
  const named = words.filter((w) => !w.startsWith('/')).map((w) => w.toUpperCase());
  const ids = new Set(ITEMS.map((i) => i.id));
  if (sw.includes('?')) return { kind: 'help' };
  const bad = sw.find((s) => !['SAFE', 'ROOM', 'ALL', 'FULL'].includes(s) && !ids.has(s));
  if (bad !== undefined) return { kind: 'error', message: `Invalid switch - /${bad}` };
  const unknown = named.find((n) => !ids.has(n));
  if (unknown !== undefined) return { kind: 'error', message: `Don't know "${unknown}" - ROOMFIX /? lists the names` };
  const picked = new Set<string>([...named, ...sw.filter((s) => ids.has(s))]);
  if (sw.includes('ALL')) ITEMS.forEach((i) => picked.add(i.id));
  if (sw.includes('SAFE')) picked.add('SAFE');
  if (sw.includes('ROOM')) ITEMS.filter((i) => i.group === 'room').forEach((i) => picked.add(i.id));
  const full = sw.includes('FULL');
  if (full && !picked.has('SAFE')) return { kind: 'error', message: '/FULL goes with /SAFE or /ALL' };
  if (!picked.size) return sw.length || named.length ? { kind: 'error', message: 'Nothing to do' } : { kind: 'list' };
  return { kind: 'reset', ids: ITEMS.filter((i) => picked.has(i.id)).map((i) => i.id), full };
}

const pad = (s: string, n: number) => s.padEnd(n);

export async function runRoomFix(h: RetroHost, args: string[]): Promise<void> {
  const out = (text = '') => h.screen.print(`${toCp437(text)}\n`);
  const cmd = parseRoomFix(args);
  out(TITLE);
  out('Copyright (C) 1995 Sandbox Software.  Freeware.');
  out();
  const list = async (items: readonly FixItem[]) => {
    for (const i of items) out(`${pad(i.id, 7)}${pad(i.label, 34)}${await i.show()}`);
  };
  if (cmd.kind === 'error') return out(`${cmd.message}. Type ROOMFIX /? for help.`);
  if (cmd.kind === 'help') {
    ROOMFIX_HELP.forEach((l) => out(l));
    out();
    out('Right now:');
    return list(ITEMS);
  }
  if (cmd.kind === 'list') {
    await list(ITEMS);
    out();
    out('Nothing was changed. ROOMFIX /? tells how to put things back.');
    return;
  }
  for (const i of ITEMS.filter((x) => cmd.ids.includes(x.id))) out(`${pad(i.id, 7)}${await i.reset(cmd.full)}`);
  out();
  out('Done. Game saves, scores, eggs and hearts were not touched.');
}
