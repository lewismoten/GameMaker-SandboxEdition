// HEXEDIT.EXE in C:\DOS on the desk PC: a 1994-style hex viewer and editor for looking at how
// Game-Maker's files are built. Offset, sixteen bytes in hex and the same as text on each
// line (printable ASCII, dots for the rest); for Game-Maker's formats (and the media files it plays) a structure panel names the
// field under the cursor, colors each field's bytes and lists the sections to jump to
// (structure.ts, structureMedia.ts). It views first, as HIEW did: E starts typing over bytes
// in hex or ASCII, F10 writes the file back where DOS could (hexFiles.ts), with a .BAK first.
//
//   HEXEDIT                 picks a file in the current folder
//   HEXEDIT C:\GM\TEDDY\TEDDY.GAM
import type { RetroHost } from '../host';
import { attr, COLS, ROWS } from '../text/textScreen';
import { toCp437 } from '../text/cp437';
import { resolvePath } from '../dos/vfs';
import { BAR, BG, BRIGHT, DIM, FRAME, GREEN, HEAD, RED, TEXT, WARN, YELLOW, cell, editLine, frame, keyBar, messageBox, num, pickList, put, statusLine, type ListRow } from '../hacks/dosUi';
import { leafAt, sectionAt, type Leaf, type Structure } from './structure';
import { describe } from './structureMedia';
import { listFolder, openFile, pathOf, type HexFile } from './hexFiles';

export const HEXEDIT_TITLE = 'HEXEDIT 1.1';
const COPYRIGHT = 'HEXEDIT 1.1  Hex file editor.  (C) 1994 Sandbox Software.  Freeware.';

export const HEXEDIT_HELP = [
  COPYRIGHT,
  '',
  'Views and edits any file byte by byte.  For Game-Maker files it names the',
  'field under the cursor (scenes, links, map cells, blocks, frames...).',
  '',
  'HEXEDIT [d:][path][filename]',
  '',
  '  With no file name HEXEDIT lists the current folder to pick one.',
];

/** Field colors on blue, cycled field by field. */
const COLORS = [11, 14, 10, 13, 15];
const HEX_X = 11;
const ASC_X = 61;
const TOP = 2;

const hex = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, '0');
const hexX = (i: number) => HEX_X + i * 3 + (i >= 8 ? 1 : 0);

export async function runHexEdit(h: RetroHost, args: string[]): Promise<void> {
  const s = h.screen;
  const out = (t = '') => s.print(`${toCp437(t)}\n`);
  if (args.some((a) => a === '/?' || a === '-?')) return HEXEDIT_HELP.forEach((l) => out(l));
  const wd = h.workDir();
  const cwdOf = (d: string) => (d === wd.drive ? wd.parts : []);
  const name = args.find((a) => !a.startsWith('/'));
  let file: HexFile | undefined;
  let start = wd;
  if (name) {
    const { drive, parts } = resolvePath(name, wd.drive, cwdOf);
    const isDir = (await h.fs.find(drive, parts).catch(() => undefined))?.dir;
    if (isDir || !parts.length) start = { drive, parts };
    else {
      const leaf = parts.pop()!;
      file = await openFile(h, drive, parts, leaf).catch(() => undefined);
      if (!file) {
        out(`${HEXEDIT_TITLE}`);
        out(`File not found - ${name.toUpperCase()}`);
        return;
      }
    }
  }
  s.resetPalette();
  s.cursorVisible = false;
  try {
    for (;;) {
      file ??= await pickFile(h, start);
      if (!file) break;
      const next = await edit(h, file);
      if (!next) break;
      // back to the list of the folder the file was in
      const p = file.path.split('\\');
      start = { drive: p[0][0], parts: p.slice(1, -1) };
      file = undefined;
    }
  } finally {
    s.cursorVisible = false;
    s.resetPalette();
    s.clear();
    s.cursorVisible = true;
  }
}

// ---------------------------------------------------------------- picking a file

function chrome(h: RetroHost, title: string, keys: string): void {
  const s = h.screen;
  s.fill(0, 0, COLS - 1, ROWS - 1, BG);
  s.fill(0, 0, COLS - 1, 0, BAR);
  put(h, 1, 0, BAR, `${HEXEDIT_TITLE}  ${title}`.slice(0, 62));
  put(h, COLS - 17, 0, BAR, 'Sandbox Software');
  keyBar(h, keys);
}

async function pickFile(h: RetroHost, start: { drive: string; parts: string[] }): Promise<HexFile | undefined> {
  let { drive, parts } = start;
  let note = '';
  let cur = 0;
  for (;;) {
    const where = pathOf(drive, parts);
    chrome(h, 'Open a file', '~Enter~ Open  ~Esc~ Quit');
    frame(h, 1, 2, 78, ROWS - 3, where);
    const list = await listFolder(h, drive, parts).catch(() => undefined);
    if (list === null || list === undefined) {
      note = list === null ? `Not ready reading drive ${drive}` : `Invalid directory - ${where}`;
      if (drive === 'C' && !parts.length) return undefined;
      drive = 'C';
      parts = [];
      continue;
    }
    type Entry = { label: string; kind: 'up' | 'dir' | 'file' | 'drive'; name: string };
    const entries: Entry[] = [
      ...(parts.length ? [{ label: `${cell('..', 13)}  <UP-DIR>`, kind: 'up' as const, name: '..' }] : []),
      ...list.filter((x) => x.dir).map((e) => ({ label: `${cell(e.name, 13)}  <DIR>`, kind: 'dir' as const, name: e.name })),
      ...list.filter((x) => !x.dir).map((e) => ({ label: `${cell(e.name, 13)}${num(e.size).padStart(10)}${e.save ? '  saved by the game' : ''}`, kind: 'file' as const, name: e.name })),
      ...['A', 'C', 'D'].map((d) => ({ label: `[-${d}-]`, kind: 'drive' as const, name: d })),
    ];
    const rows: ListRow[] = entries.map((e) => ({ text: e.label, a: e.kind === 'file' ? BRIGHT : YELLOW }));
    statusLine(h, note || `${num(list.filter((x) => !x.dir).length)} files.  Pick one to look inside.`, note ? RED : TEXT);
    note = '';
    const pick = await pickList(h, rows, { x: 2, y: 3, w: 75, h: ROWS - 7, cur: Math.min(cur, rows.length - 1) });
    if (pick.key === 'Escape') return undefined;
    const e = entries[pick.i];
    cur = 0;
    if (e.kind === 'up') parts.pop();
    else if (e.kind === 'dir') parts.push(e.name);
    else if (e.kind === 'drive') {
      drive = e.name;
      parts = [];
    } else {
      const got = await openFile(h, drive, parts, e.name).catch(() => undefined);
      if (got) return got;
      note = `File not found - ${e.name}`;
      cur = pick.i;
    }
  }
}

// ---------------------------------------------------------------- the editor

interface State {
  file: HexFile;
  buf: Uint8Array;
  /** The bytes as on disk (as opened, or as last saved). */
  orig: Uint8Array;
  st?: Structure;
  pos: number;
  top: number;
  ascii: boolean;
  editing: boolean;
  /** The high nibble typed in the hex pane, waiting for the low one. */
  nibble?: number;
  structure: boolean;
  undo: { at: number; was: number }[];
  find?: Uint8Array;
  note: string;
  noteAttr: number;
}

const rowsShown = (t: State) => (t.structure ? 15 : 21);

/** Edits a file; true to go back to the file list, false to quit. */
async function edit(h: RetroHost, file: HexFile): Promise<boolean> {
  const t: State = {
    file,
    buf: file.bytes.slice(),
    orig: file.bytes.slice(),
    st: describe(file.name, file.bytes),
    pos: 0,
    top: 0,
    ascii: false,
    editing: false,
    structure: true,
    undo: [],
    note: '',
    noteAttr: TEXT,
  };
  t.note = t.st ? `${t.st.format}: ${num(t.st.sections.length)} sections.  F3 lists them.` : `No structure known for ${file.name}: plain bytes.`;
  for (;;) {
    draw(h, t);
    const k = await h.keys.next();
    const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
    const len = t.buf.length;
    const page = rowsShown(t) * 16;
    const move = (to: number) => {
      t.pos = Math.max(0, Math.min(Math.max(0, len - 1), to));
      t.nibble = undefined;
    };
    t.note = '';
    if (key === 'ArrowRight') move(t.pos + 1);
    else if (key === 'ArrowLeft') move(t.pos - 1);
    else if (key === 'ArrowDown') move(t.pos + 16 < len ? t.pos + 16 : t.pos);
    else if (key === 'ArrowUp') move(t.pos >= 16 ? t.pos - 16 : t.pos);
    else if (key === 'PageDown') {
      move(Math.min(t.pos + page, len - 1));
      t.top += page;
    } else if (key === 'PageUp') {
      move(t.pos - page);
      t.top -= page;
    } else if (key === 'Home') move(k.ctrl || t.pos % 16 === 0 ? 0 : t.pos - (t.pos % 16));
    else if (key === 'End') move(k.ctrl || t.pos % 16 === 15 || t.pos === len - 1 ? len - 1 : t.pos - (t.pos % 16) + 15);
    else if (key === 'Tab') {
      t.ascii = !t.ascii;
      t.nibble = undefined;
    } else if (key === 'F2') {
      t.structure = !t.structure;
      if (t.structure) t.st = describe(file.name, t.buf);
    } else if (key === 'F1' || (!t.editing && key === '?')) await help(h);
    else if (key === 'F9' || (!t.editing && key === 'U')) undo(t);
    else if (key === 'F10') await save(h, t);
    else if (key === 'F3' || (!t.editing && key === 'J')) await jump(h, t);
    else if (key === 'F5' || (k.ctrl && key === 'G') || (!t.editing && key === 'G')) await goTo(h, t);
    else if (key === 'F7' || (k.ctrl && key === 'F') || (!t.editing && key === 'F')) await find(h, t, true);
    else if (key === 'F8' || (!t.editing && key === 'N')) await find(h, t, false);
    else if (key === 'Escape') {
      if (t.editing) {
        t.editing = false;
        t.nibble = undefined;
        continue;
      }
      if (!(await leave(h, t))) continue;
      return false;
    } else if (!t.editing && (key === 'E' || key === 'Enter' || key === 'F4')) {
      if (!len) t.note = 'The file is empty: nothing to type over.';
      else {
        t.editing = true;
        if (t.file.readOnly) {
          t.note = `${t.file.readOnly[0]}: you can type, but F10 can't write it back.`;
          t.noteAttr = YELLOW;
        }
      }
    } else if (!t.editing && key === 'Q') {
      if (await leave(h, t)) return false;
    } else if (!t.editing && key === 'O') {
      if (await leave(h, t)) return true;
    } else if (t.editing && key === 'Backspace') move(t.pos - 1);
    else if (t.editing && k.key.length === 1 && !k.ctrl && !k.alt && len) type(t, k.key);
    if (t.pos < t.top) t.top = t.pos - (t.pos % 16);
    if (t.pos >= t.top + page) t.top = t.pos - (t.pos % 16) - page + 16;
    t.top = Math.max(0, Math.min(t.top, Math.max(0, Math.ceil(len / 16) * 16 - page)));
    t.top -= t.top % 16;
  }
}

function setByte(t: State, at: number, v: number): void {
  if (t.buf[at] === v) return;
  t.undo.push({ at, was: t.buf[at] });
  t.buf[at] = v;
}

function type(t: State, ch: string): void {
  if (t.ascii) {
    const c = toCp437(ch).charCodeAt(0);
    setByte(t, t.pos, c & 255);
    t.pos = Math.min(t.buf.length - 1, t.pos + 1);
    return;
  }
  if (!/^[0-9a-f]$/i.test(ch)) {
    t.note = 'Type 0-9 or A-F in the hex column (Tab for ASCII).';
    t.noteAttr = YELLOW;
    return;
  }
  const v = parseInt(ch, 16);
  if (t.nibble === undefined) {
    setByte(t, t.pos, (v << 4) | (t.buf[t.pos] & 15));
    t.nibble = v;
  } else {
    setByte(t, t.pos, (t.nibble << 4) | v);
    t.nibble = undefined;
    t.pos = Math.min(t.buf.length - 1, t.pos + 1);
  }
}

function undo(t: State): void {
  const u = t.undo.pop();
  if (!u) {
    t.note = 'Nothing to undo.';
    return;
  }
  t.buf[u.at] = u.was;
  t.pos = u.at;
  t.nibble = undefined;
  t.note = `Undone: ${hex(u.at, 8)}h is ${hex(u.was)}h again.`;
}

const changed = (t: State) => t.buf.some((b, i) => b !== t.orig[i]);

async function save(h: RetroHost, t: State): Promise<boolean> {
  if (!changed(t)) {
    t.note = 'No changes to save.';
    return true;
  }
  const ro = t.file.readOnly;
  if (ro || !t.file.write) {
    await messageBox(h, [ro?.[0] ?? 'Access denied', '', ro?.[1] ?? `${t.file.path} can't be written to.`, '', 'Press any key.']);
    return false;
  }
  statusLine(h, `Writing ${t.file.path}...`, YELLOW);
  try {
    const note = await t.file.write(t.buf.slice());
    t.orig = t.buf.slice();
    t.file.bytes = t.orig;
    t.undo = [];
    if (t.structure) t.st = describe(t.file.name, t.buf);
    t.note = note;
    t.noteAttr = GREEN;
    return true;
  } catch (e) {
    await messageBox(h, [(e as Error).message || 'General failure writing the disk', '', 'Press any key.']);
    return false;
  }
}

/** Asks about unsaved changes before leaving; false to stay. */
async function leave(h: RetroHost, t: State): Promise<boolean> {
  if (!changed(t)) return true;
  const k = await messageBox(h, [`${t.file.name} has changed.`, '', 'Save the changes (Y/N)?  Esc goes back.'], WARN, ['Y', 'N', 'Escape']);
  if (k === 'Escape') return false;
  if (k === 'N') return true;
  return save(h, t);
}

async function ask(h: RetroHost, question: string, w = 30): Promise<string | null> {
  statusLine(h, question, YELLOW);
  return editLine(h, question.length + 2, ROWS - 2, w, '');
}

async function goTo(h: RetroHost, t: State): Promise<void> {
  const a = (await ask(h, 'Goto offset (hex, or #decimal):', 12))?.trim();
  if (!a) return;
  const n = a.startsWith('#') ? parseInt(a.slice(1), 10) : parseInt(a.replace(/^0x|h$/i, ''), 16);
  if (!Number.isFinite(n) || n < 0) t.note = `Not an offset: ${a}`;
  else if (n >= t.buf.length) t.note = `Past the end of the file (${hex(Math.max(0, t.buf.length - 1), 8)}h is the last byte).`;
  else {
    t.pos = n;
    t.nibble = undefined;
    t.top = n - (n % 16) - 16 * 4;
    return;
  }
  t.noteAttr = RED;
}

/** Text, or hex bytes typed as pairs ("47 4D"); quotes force text. */
export function searchBytes(a: string): Uint8Array {
  const q = /^"(.*)"?$/.exec(a);
  if (!q && /^[0-9a-f]{2}( ?[0-9a-f]{2})*$/i.test(a)) return Uint8Array.from(a.replace(/ /g, '').match(/../g)!, (x) => parseInt(x, 16));
  const text = toCp437(q ? q[1].replace(/"$/, '') : a);
  return Uint8Array.from(text, (c) => c.charCodeAt(0) & 255);
}

/** Where `want` is next found after `from` (wrapping around), or -1. */
export function findNext(buf: Uint8Array, want: Uint8Array, from: number): number {
  if (!want.length || want.length > buf.length) return -1;
  const n = buf.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (i + want.length > n) continue;
    let j = 0;
    while (j < want.length && buf[i + j] === want[j]) j++;
    if (j === want.length) return i;
  }
  return -1;
}

async function find(h: RetroHost, t: State, askFirst: boolean): Promise<void> {
  if (askFirst || !t.find) {
    const a = await ask(h, 'Find text, or hex bytes (47 4D):', 40);
    if (!a) return;
    t.find = searchBytes(a);
  }
  const at = findNext(t.buf, t.find, t.pos);
  if (at < 0) {
    t.note = 'Not found.';
    t.noteAttr = RED;
    return;
  }
  t.note = `Found at ${hex(at, 8)}h${at <= t.pos ? ' (from the top)' : ''}.  N finds the next.`;
  t.noteAttr = GREEN;
  t.pos = at;
  t.nibble = undefined;
  t.top = at - (at % 16) - 16 * 4;
}

async function jump(h: RetroHost, t: State): Promise<void> {
  const st = t.st;
  if (!st?.sections.length) {
    t.note = 'No fields to list: HEXEDIT knows no structure for this file.';
    return;
  }
  const s = h.screen;
  const saved = s.save(8, 2, 66, ROWS - 3);
  frame(h, 8, 2, 72, ROWS - 4, `${st.format} - ${num(st.sections.length)} sections`.slice(0, 58));
  const rows: ListRow[] = st.sections.map((x) => ({ text: `${hex(x.off, 8)}h  ${x.name}` }));
  const pick = await pickList(h, rows, { x: 9, y: 3, w: 62, h: ROWS - 8, cur: Math.max(0, sectionAt(st, t.pos)) });
  s.restore(saved);
  if (pick.key !== 'Enter') return;
  const to = st.sections[pick.i].off;
  t.pos = to;
  t.nibble = undefined;
  t.top = to - (to % 16);
}

async function help(h: RetroHost): Promise<void> {
  await messageBox(
    h,
    [
      COPYRIGHT,
      '',
      'Arrows, PgUp PgDn    Move          Home End    Line start/end (twice: file)',
      'Tab                  Hex or ASCII  F2          Structure panel on/off',
      'F3 or J              Jump to a section of the file (scenes, blocks...)',
      'G or F5              Goto offset   F or F7     Find text or hex   N  Next',
      'E or Enter           Edit: type over bytes in hex (0-9 A-F) or ASCII',
      'Esc                  Stop editing  U or F9     Undo the last byte typed',
      'F10                  Save (the file as it was is kept as NAME.BAK)',
      'O                    Open another file          Q or Esc   Quit',
      '',
      'Bytes in color belong to one field; changed bytes are red.',
      '',
      'Press any key.',
    ],
    BG,
  );
}

// ---------------------------------------------------------------- drawing

function draw(h: RetroHost, t: State): void {
  const s = h.screen;
  const len = t.buf.length;
  const dirty = changed(t);
  s.fill(0, 0, COLS - 1, ROWS - 1, BG);
  s.fill(0, 0, COLS - 1, 0, BAR);
  const mode = t.editing ? (t.ascii ? 'EDIT ASCII' : 'EDIT HEX') : 'VIEW';
  const right = `${dirty ? '*' : ' '}${mode.padEnd(10)} ${num(len).padStart(9)} bytes`;
  put(h, 1, 0, BAR, `${HEXEDIT_TITLE}  ${t.file.path}`.slice(0, COLS - right.length - 3));
  put(h, COLS - right.length - 1, 0, BAR, right);
  // column heads
  put(h, 1, 1, HEAD, 'Offset');
  for (let i = 0; i < 16; i++) put(h, hexX(i), 1, HEAD, hex(i));
  put(h, ASC_X, 1, HEAD, '0123456789ABCDEF');
  const rows = rowsShown(t);
  const st = t.structure ? t.st : undefined;
  const cur = st ? leafAt(st, t.buf, t.pos) : undefined;
  // color of each byte: by field when the structure is shown
  let leaf: Leaf | undefined;
  for (let r = 0; r < rows; r++) {
    const y = TOP + r;
    const line = t.top + r * 16;
    if (line >= len && !(len === 0 && r === 0)) break;
    put(h, 1, y, TEXT, `${hex(line, 8)}`);
    s.put(9, y, 0xb3, FRAME);
    s.put(59, y, 0xb3, FRAME);
    for (let i = 0; i < 16; i++) {
      const at = line + i;
      if (at >= len) break;
      const b = t.buf[at];
      let fg = b ? 15 : 7;
      if (st) {
        if (!leaf || at >= leaf.off + leaf.len || at < leaf.off) leaf = leafAt(st, t.buf, at);
        fg = leaf ? COLORS[leaf.color % COLORS.length] : 7;
      }
      if (b !== t.orig[at]) fg = 12;
      const inField = cur && at >= cur.off && at < cur.off + cur.len;
      let a = attr(fg, inField ? 0 : 1);
      let aa = a;
      if (at === t.pos) {
        a = t.ascii ? attr(0, 7) : attr(0, 15);
        aa = t.ascii ? attr(0, 15) : attr(0, 7);
      }
      s.write(hexX(i), y, a, hex(b));
      // printable ASCII as itself; the rest (which the 8x8 font draws as boxes) as a dot
      const shown = b >= 0x20 && b < 0x7f;
      s.put(ASC_X + i, y, shown ? b : 0xfa, at === t.pos ? aa : inField ? attr(shown ? fg : 7, 0) : shown ? attr(fg, 1) : attr(8, 1));
    }
  }
  // where in the file: a scroll bar on the right
  const lines = Math.max(1, Math.ceil(len / 16));
  for (let r = 0; r < rows; r++) s.put(78, TOP + r, 0xb0, DIM);
  if (lines > rows) s.put(78, TOP + Math.min(rows - 1, Math.floor((t.pos / 16 / lines) * rows)), 0xdb, FRAME);
  if (t.structure) panel(h, t, cur);
  // hardware cursor on the nibble being typed
  s.cursorVisible = t.editing && len > 0;
  if (s.cursorVisible) {
    const r = Math.floor((t.pos - t.top) / 16);
    s.cursorY = TOP + r;
    s.cursorX = t.ascii ? ASC_X + (t.pos % 16) : hexX(t.pos % 16) + (t.nibble === undefined ? 0 : 1);
  }
  statusLine(h, t.note || position(t), t.note ? t.noteAttr : TEXT);
  t.noteAttr = TEXT;
  keyBar(h, t.editing ? '~Esc~ View  ~Tab~ Hex/ASCII  ~0-9 A-F~ Type over  ~Bksp~ Back  ~F9~ Undo  ~F10~ Save' : '~F1~ Help ~F2~ Struct ~F3~ Fields ~G~ Goto ~F~ Find ~Tab~ Pane ~E~ Edit ~F10~ Save ~Esc~ Quit');
}

function position(t: State): string {
  if (!t.buf.length) return 'The file is empty.';
  const b = t.buf[t.pos];
  return `Offset ${hex(t.pos, 8)}h (${num(t.pos)})   Byte ${hex(b)}h = ${b}${b > 127 ? ` (${b - 256})` : ''}   ${t.undo.length ? `${num(t.undo.length)} byte${t.undo.length === 1 ? '' : 's'} typed` : ''}`;
}

function panel(h: RetroHost, t: State, cur: Leaf | undefined): void {
  const st = t.st;
  const y = TOP + rowsShown(t);
  frame(h, 1, y, 78, ROWS - 3, st ? `Structure: ${st.format}` : 'Structure');
  const line = (r: number, label: string, value: string, a = BRIGHT) => {
    put(h, 3, y + 1 + r, HEAD, label.padEnd(9));
    put(h, 12, y + 1 + r, a, cell(value, 65));
  };
  const b = t.buf;
  const p = t.pos;
  const ints = () => {
    const at = (o: number) => b[p + o] ?? 0;
    const w = at(0) | (at(1) << 8);
    const d = (w | (at(2) << 16) | (at(3) << 24)) >>> 0;
    return `byte ${at(0)}   word ${w} (${(w << 16) >> 16})   dword ${d}`;
  };
  if (!st) {
    line(0, 'Format', `Not one HEXEDIT knows (${t.file.name}): plain bytes.`, DIM);
    line(1, 'At', b.length ? `${hex(p, 8)}h` : '');
    line(2, 'Reads as', b.length ? ints() : '');
    return;
  }
  if (!cur) {
    line(0, 'Section', st.sections[sectionAt(st, p)]?.name ?? '');
    line(1, 'Field', '(not part of any field)', DIM);
    line(2, 'Reads as', b.length ? ints() : '');
    return;
  }
  line(0, 'Section', st.sections[cur.sect]?.name ?? '');
  line(1, 'Field', cur.name ? `${cur.group} ► ${cur.name}` : cur.group, attr(COLORS[cur.color % COLORS.length], 1));
  line(2, 'Offset', `${hex(cur.off, 8)}h (${num(cur.off)})  ${num(cur.len)} byte${cur.len === 1 ? '' : 's'}  ${TYPE_NAMES[cur.type]}`);
  const v = cur.value;
  const shown = v === undefined ? `${cur.len > 16 ? `${num(cur.len)} raw bytes` : [...b.subarray(cur.off, cur.off + cur.len)].map((x) => hex(x)).join(' ')}` : typeof v === 'string' ? `"${v}"` : `${v}  (${hex(v < 0 ? v + 2 ** (8 * Math.min(cur.len, 4)) : v, cur.len * 2)}h)`;
  line(3, 'Value', `${shown}${cur.note ? `  - ${cur.note}` : ''}`, YELLOW);
}

const TYPE_NAMES: Record<string, string> = {
  u8: 'unsigned char',
  i8: 'signed char',
  u16: 'unsigned int (16-bit)',
  i16: 'int (16-bit)',
  u24: '24-bit length',
  u32: 'unsigned long',
  i32: 'long',
  vlq: 'variable-length number',
  str: 'string (NUL ends it)',
  text: 'text line',
  raw: 'bytes',
};
