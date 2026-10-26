// PLAYHACK.EXE: a DiGiTAL DUNE release from the BBS's Warez area (playHackText.ts) that edits a
// game of yours' DOS player choices on the desk PC, in 80x25 text mode like SAVEHACK. Pick a game,
// then the words, colors, frames, positions, times and keys of XFERPLAY.EXE (dosPlayer/
// patchTable.ts), each checked by the same rules as the editor's DOS player panel; F2 saves them
// into the game's companion data, so its next DOS export patches XFERPLAY.EXE and Play shows them.
import type { RetroHost } from '../host';
import { attr, ROWS } from '../text/textScreen';
import { listProjects } from '../../project/storage';
import { dosDirName } from '../dos/hardDisk';
import { PATCHES, COLOR_TARGETS, type ColorName, type PatchEntry, type PatchGroup } from '../../dosPlayer/patchTable';
import { isStock, patchProblem, type PatchValue, type PlayerPatches } from '../../dosPlayer/patchRules';
import { loadProjectPatches, saveProjectPatches } from '../../dosPlayer/projectPatches';
import { PLAYER_PRESETS } from '../../dosPlayer/presets';
import { COLOR_LABELS, SCREEN_NAMES } from '../../dosPlayer/describePatches';
import { playerLook } from '../../engine/playerLook';
import { PLAYHACK_VERSION } from './playHackText';
import { BG, BRIGHT, DIM, GREEN, HEAD, RED, TEXT, YELLOW, cell, confirm, editLine, frame, keyBar, pickList, put, statusLine, type ListRow } from './dosUi';

const RULE = '='.repeat(79);
const HEADER = [
  RULE,
  `                PLAYHACK v${PLAYHACK_VERSION} - XFERPLAY.EXE Patcher for Game-Maker 3.00`,
  '                      DiGiTAL DUNE * code: vesuvian * 1995',
  '              Your words, your colors, your player. (Your games only.)',
  RULE,
];
const TOP = 6;
const BOTTOM = ROWS - 3;

const GROUPS: [PatchGroup, string][] = [
  ['words', 'Words'],
  ['colors', 'Colors'],
  ['frames', 'Frames'],
  ['positions', 'Positions'],
  ['times', 'Times'],
  ['keys', 'Keys'],
];

/** The 16 text-mode colors (6-bit levels), for a swatch of the nearest. */
const EGA = [
  [0, 0, 0],
  [0, 0, 42],
  [0, 42, 0],
  [0, 42, 42],
  [42, 0, 0],
  [42, 0, 42],
  [42, 21, 0],
  [42, 42, 42],
  [21, 21, 21],
  [21, 21, 63],
  [21, 63, 21],
  [21, 63, 63],
  [63, 21, 21],
  [63, 21, 63],
  [63, 63, 21],
  [63, 63, 63],
];
const nearest16 = ([r, g, b]: number[]) =>
  EGA.reduce(
    (best, c, i) =>
      (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2 < (EGA[best][0] - r) ** 2 + (EGA[best][1] - g) ** 2 + (EGA[best][2] - b) ** 2 ? i : best,
    0,
  );

/** A value as PLAYHACK shows and types it. */
function shown(e: PatchEntry, v: PatchValue): string {
  if (e.kind === 'text' || e.kind === 'format') return (v as string).trim() ? (v as string) : '(blank)';
  if (e.kind === 'select') return COLOR_LABELS[v as ColorName];
  if (e.kind === 'fkey') return v === 'off' ? 'OFF' : 'on';
  if (e.kind === 'number' && (v as number) < 0) return `${v as number} (until a key)`;
  return Array.isArray(v) ? v.join(',') : String(v);
}

/** What the typed text means for this entry (numbers, lists of numbers or the text itself). */
function parse(e: PatchEntry, typed: string): PatchValue {
  if (e.kind === 'text' || e.kind === 'format') return typed;
  if (e.kind === 'number') return Number(typed.trim());
  return typed.split(/[ ,]+/).filter(Boolean).map(Number);
}

export async function runPlayHack(h: RetroHost): Promise<void> {
  const s = h.screen;
  s.resetPalette();
  s.cursorVisible = false;
  const chrome = (keys: string) => {
    s.fill(0, 0, 79, ROWS - 1, BG);
    HEADER.forEach((l, i) => put(h, 0, i, i === 0 || i === 4 ? HEAD : i === 1 ? YELLOW : BRIGHT, l));
    keyBar(h, keys);
  };
  chrome('~Enter~ Select  ~Esc~ Quit');
  statusLine(h, 'Looking for your games...');
  const games = (await listProjects().catch(() => [])).filter((p) => !p.id.startsWith('hd-'));
  let gi = 0;
  for (;;) {
    chrome('~\x18\x19~ Choose  ~Enter~ Select game  ~Esc~ Quit');
    frame(h, 1, TOP, 78, BOTTOM, 'Select one of your games');
    if (!games.length) {
      put(h, 3, TOP + 2, BRIGHT, 'No games of yours on this PC yet.');
      put(h, 3, TOP + 3, TEXT, 'Make one in Game-Maker (or on the web side), then patch its player here.');
      statusLine(h, 'PLAYHACK only patches your own games: shareware belongs to its authors.');
      await h.keys.next();
      break;
    }
    put(h, 3, TOP + 1, HEAD, cell('Name', 10) + cell('Game', 50) + 'Patches');
    statusLine(h, `${games.length} game${games.length === 1 ? '' : 's'} of yours found.`);
    const counts = await Promise.all(games.map(async (g) => Object.keys(await loadProjectPatches(g.id)).length));
    const rows: ListRow[] = games.map((g, i) => ({ text: cell(dosDirName(g.gam), 10) + cell(g.name, 50) + (counts[i] ? String(counts[i]) : '-') }));
    const pick = await pickList(h, rows, { x: 2, y: TOP + 2, w: 75, h: BOTTOM - TOP - 3, cur: gi });
    if (pick.key === 'Escape') break;
    gi = pick.i;
    await editGame(h, games[gi].id, dosDirName(games[gi].gam), chrome);
  }
  s.fill(0, 0, 79, ROWS - 1, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  h.screen.print('Thank you for using PLAYHACK! Greetings to all SYSOPs. Call 412-555-SAND.\n');
}

async function editGame(h: RetroHost, projectId: string, dos: string, chrome: (keys: string) => void): Promise<void> {
  const patches: PlayerPatches = { ...(await loadProjectPatches(projectId)) };
  let dirty = false;
  let gi = 0;
  let cur = 0;
  const KEYS = '~Tab~ Group ~Enter~ Edit ~Del~ Undo ~F5~ Builder ~F6~ Rodip ~F8~ Reset ~F2~ Save ~Esc~ Back';
  for (;;) {
    const [group, name] = GROUPS[gi];
    chrome(KEYS);
    frame(h, 1, TOP, 78, BOTTOM, `${dos}: ${name}`);
    // the groups, as tabs along the top of the frame's inside
    let x = 3;
    for (const [g, label] of GROUPS) {
      put(h, x, TOP + 1, g === group ? attr(0, 3) : DIM, ` ${label} `);
      x += label.length + 3;
    }
    const look = playerLook(patches);
    const entries = PATCHES.filter((e) => e.group === group);
    const rows: ListRow[] = [];
    const rowEntry: (PatchEntry | undefined)[] = [];
    let screen = '';
    for (const e of entries) {
      if (e.screen !== screen) {
        screen = e.screen;
        rows.push({ text: e.screen === 'all' ? "The player's colors" : SCREEN_NAMES[e.screen], selectable: false, a: HEAD });
        rowEntry.push(undefined);
      }
      const v = patches[e.id] ?? (e.kind === 'fkey' ? 'on' : e.kind === 'text' || e.kind === 'format' ? e.stock.trimEnd() : e.stock);
      const changed = e.id in patches;
      rows.push({ text: `${changed ? '*' : ' '} ${cell(e.label, 30)} ${cell(shown(e, v), 38)}`, a: changed ? YELLOW : BRIGHT });
      rowEntry.push(e);
    }
    statusLine(h, dirty ? 'Changed: F2 saves them for the DOS export and Play.' : `${Object.keys(patches).length} change(s) saved for ${dos}.`);
    // the chosen color's nearest text color, as a 1995 tool would show it
    const swatch = (i: number) => {
      const e = rowEntry[i];
      if (!e || (e.kind !== 'rgb' && e.kind !== 'select')) return;
      const rgb = e.kind === 'rgb' ? look.rgb(e.id) : look.rgb(`color.rgb.${(patches[e.id] as ColorName | undefined) ?? e.stock}`);
      statusLine(h, `${e.label}: ${rgb.join(', ')} of 63`);
      put(h, 74, ROWS - 2, attr(nearest16(rgb), 1), '\u2588\u2588\u2588');
    };
    const pick = await pickList(h, rows, {
      x: 2,
      y: TOP + 3,
      w: 71,
      h: BOTTOM - TOP - 4,
      cur,
      hotkeys: ['Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'F2', 'F5', 'F6', 'F8'],
      onMove: swatch,
    });
    cur = pick.i;
    const e = rowEntry[pick.i];
    switch (pick.key) {
      case 'Escape':
        if (dirty && (await confirm(h, ['Save your changes first?']))) await save();
        return;
      case 'Tab':
      case 'ArrowRight':
      case 'ArrowLeft':
        gi = (gi + (pick.key === 'ArrowLeft' ? GROUPS.length - 1 : 1)) % GROUPS.length;
        cur = 0;
        continue;
      case 'Delete':
        if (e && e.id in patches) {
          delete patches[e.id];
          dirty = true;
        }
        continue;
      case 'F2':
        await save();
        continue;
      case 'F5':
      case 'F6':
      case 'F8': {
        const preset = PLAYER_PRESETS[pick.key === 'F5' ? 0 : pick.key === 'F6' ? 1 : 2];
        if (preset.patches) Object.assign(patches, preset.patches);
        else for (const k of Object.keys(patches)) delete patches[k];
        dirty = true;
        continue;
      }
    }
    if (!e) continue;
    // Enter: a color choice or a key cycles; the rest are typed in place
    if (e.kind === 'select') {
      const names = Object.keys(COLOR_TARGETS) as ColorName[];
      const now = (patches[e.id] as ColorName | undefined) ?? e.stock;
      set(e, names[(names.indexOf(now) + 1) % names.length]);
      continue;
    }
    if (e.kind === 'fkey') {
      set(e, patches[e.id] === 'off' ? 'on' : 'off');
      continue;
    }
    const v = patches[e.id] ?? (e.kind === 'text' || e.kind === 'format' ? e.stock.trimEnd() : e.stock);
    const isText = e.kind === 'text' || e.kind === 'format';
    const width = isText ? e.length + 1 : 20;
    const prompt = `${e.label}: `.slice(0, 30);
    statusLine(h, '');
    put(h, 1, ROWS - 2, HEAD, prompt);
    keyBar(
      h,
      isText
        ? `~Enter~ Keep  ~Esc~ Cancel   Up to ${e.length} characters${e.kind === 'format' ? '; keep every % code' : '; blank hides it'}`
        : `~Enter~ Keep  ~Esc~ Cancel   ${e.note ?? 'Type the new value'}`,
    );
    const typed = await editLine(
      h,
      1 + prompt.length,
      ROWS - 2,
      Math.min(width, 78 - prompt.length),
      Array.isArray(v) ? v.join(',') : String(v),
      isText ? /^[\x20-\x7e]$/ : /^[-0-9, ]$/,
    );
    if (typed === null) continue;
    const problem = set(e, parse(e, isText ? typed.slice(0, e.length) : typed));
    if (problem) {
      statusLine(h, `Not changed: ${problem}.`, RED);
      await h.keys.next();
    }
  }

  function set(e: PatchEntry, v: PatchValue): string | undefined {
    const problem = patchProblem(e, v);
    if (problem) return problem;
    if (isStock(e, v)) delete patches[e.id];
    else patches[e.id] = v;
    dirty = true;
    return undefined;
  }

  async function save(): Promise<void> {
    const ok = await saveProjectPatches(projectId, patches);
    dirty = !ok;
    statusLine(h, ok ? `Saved. ${dos}'s next DOS export and Play use them.` : 'That game is gone!', ok ? GREEN : RED);
    await new Promise((r) => setTimeout(r, 700));
  }
}
