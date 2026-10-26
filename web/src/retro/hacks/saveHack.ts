// SAVEHACK.EXE: a save game editor of the kind passed around BBSes in the 90s, downloaded from
// THE -= S A N D B O X =- BBS onto the desk PC. Pick a game, then a saved game (or the
// high-score table), and change the score, hit points, lives, money, counters and inventory,
// with each value's limits checked and warnings at the edges; "Max all" sets every stat to the
// most the game handles well. Before the first change to a game it backs up the saves as they
// were ("Original", by SAVEHACK, in the shared backups store) and can put them back. An empty
// slot can get a new saved game, the game as Play starts it (project/saveData newGameSave), so
// a game never saved can be hacked too, and a save can be moved to another level (entered at its
// start, as the game enters it: project/saveData changeSaveLevel).
//
// Its real job is debugging and testing games (setting up a save at any level or with any
// stats); the 90s BBS dress is for fun.
//
// The saves and their fields come from project/saveData (the same ones the web's "Saves &
// scores" panel edits); the game's own files name the levels, items and sequences.
import type { RetroHost } from '../host';
import { attr, ROWS } from '../text/textScreen';
import { wrapWords } from '../bbs/fileId';
import { BACKBL, type Block } from '../../formats/blocks';
import type { Palette } from '../../formats/palette';
import {
  GROUP_LABELS,
  HIGH_SCORE_NAME_MAX,
  SCORE_MAX,
  SCORE_MIN,
  UNLIMITED,
  backupNow,
  changeSaveLevel,
  cloneSave,
  fieldWarnings,
  gameLabels,
  getField,
  highScoreFileName,
  highScoreWarnings,
  levelLabel,
  listBackups,
  loadGameSaves,
  maxAll,
  newGameSave,
  NEW_SAVE_NAME,
  restoreBackup,
  saveFields,
  saveFileName,
  saveLevels,
  sequenceLabel,
  serializeSave,
  setField,
  sortHighScores,
  writeHighScores,
  writeSlot,
  SLOT_NAME_LENGTH,
  type GameLabels,
  type GameSaves,
  type SaveField,
  type SavedGame,
} from '../../project/saveData';
import type { GameFiles } from '../../project/files';
import { gameFilesOf, gamesAndSaves, hackGames, type GameWithSaves } from './saveGames';
import {
  BG,
  BRIGHT,
  DIM,
  GREEN,
  HEAD,
  RED,
  TEXT,
  YELLOW,
  cell,
  confirm,
  dosStamp,
  editLine,
  frame,
  keyBar,
  messageBox,
  num,
  pickList,
  put,
  statusLine,
  type ListRow,
} from './dosUi';
import { deskDate } from '../dos/vfs';

const RULE = '='.repeat(79);
const SAVEHACK_HEADER = [
  RULE,
  '                       SAVEHACK v1.2a - DOS Save Game Editor',
  '                          Written by: vesuvian',
  '                     Uploaded to: The -= S A N D B O X =- BBS',
  RULE,
];
/** Callers of the BBS (sandbox.ts's last callers, The Sofa's regulars) the author greets. */
const SAVEHACK_GREETINGS = ['PIXEL WIZARD', 'THE BLOCKSMITH', 'NIGHT OWL'];
const SAVEHACK_BYE = `Thank you for using SAVEHACK! Greetings to: ${SAVEHACK_GREETINGS.join(', ')}, and all SYSOPs!`;
/** The label of the backup taken before SAVEHACK's first change to a game. */
const ORIGINAL = 'Original';

const TOP = 6; // first row under the header
const BOTTOM = ROWS - 3; // last row above the status line

/** What is open: a game, its saves and what its files say about them. */
interface Open {
  game: GameWithSaves;
  saves: GameSaves;
  labels?: GameLabels;
  /** The .gam as the game's files name it, and those files (for the high scores it came with). */
  gam?: string;
  disk?: GameFiles;
}

export async function runSaveHack(h: RetroHost): Promise<void> {
  const s = h.screen;
  s.resetPalette();
  s.cursorVisible = false;
  /** Games whose original saves were backed up in this run. */
  const backedUp = new Set<string>();
  const chrome = (keys: string) => {
    s.fill(0, 0, 79, ROWS - 1, BG);
    SAVEHACK_HEADER.forEach((l, i) => put(h, 0, i, i === 0 || i === 4 ? HEAD : i === 1 ? YELLOW : BRIGHT, l));
    keyBar(h, keys);
  };

  /** Backs up a game's saves as they were opened, once, before the first change is written. */
  const original = async (o: Open): Promise<string> => {
    if (backedUp.has(o.game.save)) return '';
    const b = await backupNow(o.game.save, { label: ORIGINAL, files: o.saves.files, auto: true, by: 'SAVEHACK' });
    backedUp.add(o.game.save);
    return b ? ' Original saves backed up.' : '';
  };

  chrome('~Enter~ Select  ~Esc~ Quit');
  statusLine(h, 'Scanning for saved games...');
  // every game, the ones with saved data first (an empty slot can get a new save)
  const all = await gamesAndSaves(await hackGames(await h.catalog()));
  const has = (g: GameWithSaves) => Object.keys(g.files).length > 0;
  const games = [...all.filter(has), ...all.filter((g) => !has(g))];
  const withData = games.filter(has).length;
  let gi = 0;
  while (games.length) {
    chrome('~\x18\x19~ Choose  ~Enter~ Select game  ~Esc~ Quit');
    frame(h, 1, TOP, 78, BOTTOM, 'Select a game');
    put(h, 3, TOP + 1, HEAD, cell('Name', 10) + cell('Game', 40) + cell('Saves', 8) + 'Scores');
    statusLine(
      h,
      withData
        ? `${withData} game${withData === 1 ? '' : 's'} with saved data found. Pick any game to start a new save.`
        : 'No saved games found! Pick a game to start a new save in it.',
    );
    const rows: ListRow[] = games.map((g) => {
      const saves = Object.keys(g.files).filter((n) => /^game\d\.sav$/i.test(n)).length;
      const his = Object.keys(g.files).some((n) => /\.his$/i.test(n));
      return { text: cell(g.dos, 10) + cell(g.title, 40) + cell(saves ? String(saves) : '-', 8) + (his ? 'Yes' : '-'), a: has(g) ? BRIGHT : DIM };
    });
    const pick = await pickList(h, rows, { x: 2, y: TOP + 2, w: 75, h: BOTTOM - TOP - 3, cur: gi });
    if (pick.key === 'Escape') break;
    gi = pick.i;
    const g = games[gi];
    statusLine(h, `Loading ${g.dos}...`);
    const files = await gameFilesOf(g);
    const gam = g.gam && files ? (files.mainGame(g.gam) ?? g.gam) : g.gam;
    const o: Open = {
      game: g,
      gam,
      disk: files,
      saves: await loadGameSaves(g.save, { gam, disk: files }),
      labels: files && gam ? gameLabels(files, gam) : undefined,
    };
    await slotMenu(h, o, chrome, original);
    g.files = o.saves.files;
  }
  s.resetPalette();
  s.clear();
  s.print(`${SAVEHACK_BYE}\n`);
}

type Chrome = (keys: string) => void;
type Original = (o: Open) => Promise<string>;

async function reload(o: Open): Promise<void> {
  o.saves = await loadGameSaves(o.game.save, { gam: o.gam, disk: o.disk });
}

/** The ten slots, the high-score table and Restore original. */
async function slotMenu(h: RetroHost, o: Open, chrome: Chrome, original: Original): Promise<void> {
  let cur = 0;
  let note = '';
  for (;;) {
    chrome('~\x18\x19~ Choose  ~Enter~ Edit  ~N~ New save  ~R~ Restore original  ~Esc~ Back');
    frame(h, 1, TOP, 78, BOTTOM, `${o.game.title} - select a saved game`);
    put(h, 3, TOP + 1, HEAD, cell('File', 13) + cell('Name', 21) + cell('Level', 21) + cell('Score', 12) + 'Lives');
    const rows: ListRow[] = o.saves.slots.map((sl) => {
      const file = cell(saveFileName(sl.slot).toUpperCase(), 13);
      if (sl.error) return { text: file + cell(sl.name || '(no name)', 21) + 'Damaged: ' + sl.error, a: RED, selectable: false };
      if (!sl.save) return { text: file + cell('(empty)', 21) + 'Enter: start a new save here', a: DIM };
      const sv = sl.save;
      const lvl = o.labels?.sceneName(sv.doscene);
      return {
        text:
          file +
          cell(sl.name || '(no name)', 21) +
          cell(`${sv.doscene}${lvl ? ` ${lvl}` : ''}`, 21) +
          cell(num(sv.world.ci.score), 12) +
          num(sv.world.ci.lives),
      };
    });
    const hsName = (o.saves.highScoreFile ?? (o.game.gam ? highScoreFileName(o.game.gam) : 'scores.his')).toUpperCase();
    const orig = (await listBackups(o.game.save)).find((b) => b.by === 'SAVEHACK' && b.label === ORIGINAL);
    rows.push({ text: '', selectable: false });
    rows.push({ text: `High-score table (${hsName})${o.saves.highScoresFromDisk ? ' - as it came on the disk' : ''}`, a: YELLOW });
    rows.push(
      orig
        ? { text: `Restore original saves (backed up ${dosStamp(deskDate(orig.when))})`, a: YELLOW }
        : { text: 'Restore original saves (nothing changed yet)', a: DIM, selectable: false },
    );
    statusLine(
      h,
      note ||
        (o.saves.slots.some((sl) => sl.save)
          ? 'Pick a saved game to edit, or an empty slot for a new save.'
          : 'No saved games yet: pick an empty slot to start one.'),
      note.startsWith('ERROR') ? RED : note ? GREEN : TEXT,
    );
    note = '';
    const first = rows.findIndex((r) => r.selectable !== false);
    const pick = await pickList(h, rows, { x: 2, y: TOP + 2, w: 75, h: BOTTOM - TOP - 3, cur: cur || first, hotkeys: ['R', 'N'] });
    if (pick.key === 'Escape') return;
    cur = pick.i;
    if (pick.key === 'N' || (pick.i < 10 && pick.key === 'Enter' && !o.saves.slots[pick.i].save && !o.saves.slots[pick.i].error)) {
      // N on a full slot: the first empty one
      const slot = pick.i < 10 && !o.saves.slots[pick.i].bytes ? pick.i : o.saves.slots.findIndex((sl) => !sl.bytes);
      if (slot < 0) {
        note = 'ERROR: every slot holds a save. Pick one to edit instead.';
        continue;
      }
      note = await newSave(h, o, slot, original);
      if (o.saves.slots[slot].save) {
        cur = slot;
        const edited = await editSave(h, o, slot, chrome, original);
        note = edited || note;
      }
    } else if (pick.key === 'R' || pick.i === rows.length - 1) {
      if (!orig) {
        note = 'Nothing to restore: SAVEHACK has not changed this game.';
        continue;
      }
      if (!(await confirm(h, [`Put back ${o.game.title}'s saves as they were`, `on ${dosStamp(deskDate(orig.when))}? Everything saved since is lost.`])))
        continue;
      await restoreBackup(orig.id, { by: 'SAVEHACK' });
      await reload(o);
      note = 'Original saves restored.';
    } else if (pick.i === rows.length - 2) note = await highScores(h, o, chrome, original);
    else if (pick.i < 10) note = await editSave(h, o, pick.i, chrome, original);
  }
}

/** Fills an empty slot with the game as it starts, named; returns a note for the slot list. */
async function newSave(h: RetroHost, o: Open, slot: number, original: Original): Promise<string> {
  if (!o.disk || !o.gam) return `ERROR: ${o.game.dos}'s game files can't be read, so SAVEHACK can't start a game.`;
  let save: SavedGame;
  try {
    save = newGameSave(o.disk, o.gam);
  } catch (e) {
    return `ERROR: ${(e as Error).message}`.slice(0, 77);
  }
  const file = saveFileName(slot).toUpperCase();
  const ask = `Name for the new ${file}: `;
  statusLine(h, ask, YELLOW);
  const name = await editLine(h, 1 + ask.length, ROWS - 2, SLOT_NAME_LENGTH + 1, NEW_SAVE_NAME);
  if (name === null) return 'No new save made.';
  const backed = await original(o);
  await writeSlot(o.game.save, slot, save, name.trim().slice(0, SLOT_NAME_LENGTH));
  await reload(o);
  const lvl = o.labels?.sceneName(save.doscene);
  return `${file} created: level ${save.doscene}${lvl ? ` ${lvl}` : ''}, as the game starts.${backed}`.slice(0, 77);
}

// ---------------------------------------------------------------- the editor

function valueText(f: SaveField, save: SavedGame): string {
  const v = getField(save, f.id);
  if (v === UNLIMITED) return 'UNLIMITED';
  if (v === null) return '--';
  if (f.type === 'item') return v === BACKBL ? '(empty)' : `Block ${v}`;
  return f.id === 'scene' || f.id === 'x' || f.id === 'y' ? String(v) : num(v);
}

/** What a block does, in a few words, for the item list. */
function blockText(b: Block | undefined, n: number, labels: GameLabels | undefined, scene: number): string {
  if (!b) return `Block ${n}`;
  const bits: string[] = [b.obj ? 'pick-up' : 'scenery'];
  if (b.scorePts) bits.push(`${b.scorePts > 0 ? '+' : ''}${num(b.scorePts)} pts`);
  if (b.chHitPt) bits.push(`${b.chHitPt > 0 ? '+' : ''}${b.chHitPt} HP`);
  if (b.effect && b.eamt) {
    const what = b.effect === 1 ? 'lives' : b.effect === 3 ? 'money' : b.effect >= 20 ? `counter ${b.effect - 19}` : `uses`;
    bits.push(`${b.eamt > 0 ? '+' : ''}${b.eamt} ${what}`);
  }
  const chr = labels?.character(scene);
  chr?.sequences.forEach((q, i) => {
    if (q.bloc === n) bits.push(`unlocks ${sequenceLabel(i, chr)}`);
  });
  return `Block ${String(n).padStart(3)}  ${bits.join(', ')}`;
}

// the 16 text colors (6-bit), for drawing a block in half-block characters
const VGA16 = [
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

function nearest16(pal: Palette, i: number): number {
  const [r, g, b] = [pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2]];
  let best = 0;
  let bd = Infinity;
  VGA16.forEach(([R, G, B], c) => {
    const d = (r - R) ** 2 * 3 + (g - G) ** 2 * 4 + (b - B) ** 2 * 2;
    if (d < bd) {
      bd = d;
      best = c;
    }
  });
  return best;
}

/** A 20x20 block as 20x10 half-block characters (each character two pixels tall). */
function drawBlock(h: RetroHost, x: number, y: number, b: Block | undefined, pal: Palette | undefined): void {
  for (let cy = 0; cy < 10; cy++)
    for (let cx = 0; cx < 20; cx++) {
      if (!b || !pal) {
        h.screen.put(x + cx, y + cy, 176, attr(8, 1));
        continue;
      }
      const top = nearest16(pal, b.pixels[cy * 40 + cx]);
      const bot = nearest16(pal, b.pixels[cy * 40 + 20 + cx]);
      h.screen.put(x + cx, y + cy, 223, attr(top, bot));
    }
}

/** A counter no block of the game uses: its value means nothing, so no warnings. */
const isUnused = (f: SaveField, labels: GameLabels | undefined) => f.group === 'counters' && !!labels && !labels.counterUse.get(f.meter!);

const PANE = 52; // the details pane's left column
const PANE_W = 25;

/** The details pane: the field's limits, what the engine does with it, and warnings. */
function details(h: RetroHost, f: SaveField | undefined, save: SavedGame, labels: GameLabels | undefined): void {
  const s = h.screen;
  s.fill(PANE, TOP + 1, PANE + PANE_W, BOTTOM - 1, BG);
  if (!f) return;
  let y = TOP + 1;
  const line = (text: string, a = TEXT) => {
    if (y < BOTTOM) put(h, PANE, y++, a, cell(text, PANE_W));
  };
  line(f.label, YELLOW);
  if (f.type === 'item') {
    const v = getField(save, f.id);
    const blocks = labels?.blocks(save.doscene);
    if (typeof v === 'number' && v !== BACKBL) {
      drawBlock(h, PANE + 2, y, blocks?.[v], labels?.palette(save.doscene));
      y += 10;
      for (const l of wrapWords(blockText(blocks?.[v], v, labels, save.doscene).replace(/^Block +\d+ +/, ''), PANE_W)) line(l);
    } else line('(empty slot)', DIM);
  } else {
    line(`Value: ${valueText(f, save)}`, BRIGHT);
    if (f.id === 'scene') line('Enter picks another level', GREEN);
    if (f.editable) {
      line(`Range: ${num(f.min)} to`);
      line(`       ${num(f.max)}`);
      line(`Safe up to ${num(f.safeMax)}`, GREEN);
      if (f.canBeUnlimited) line('U makes it unlimited', GREEN);
    }
    y++;
    for (const l of wrapWords(f.note, PANE_W)) line(l, DIM);
  }
  const warn = isUnused(f, labels) ? [] : fieldWarnings(save, f, labels);
  if (warn.length) {
    y++;
    for (const w of warn) for (const l of wrapWords(`! ${w}`, PANE_W)) line(l, RED);
  }
}

/** Edits one saved game; returns a note for the slot list. */
async function editSave(h: RetroHost, o: Open, slot: number, chrome: Chrome, original: Original): Promise<string> {
  const sl = o.saves.slots[slot];
  if (!sl.save) return '';
  const before = sl.save;
  const save = cloneSave(before);
  const labels = o.labels;
  const file = saveFileName(slot).toUpperCase();
  let cur = 0;
  let note = '';
  const dirty = () => serializeSave(save).join() !== serializeSave(before).join();
  const write = async (): Promise<string> => {
    const backed = await original(o);
    await writeSlot(o.game.save, slot, save);
    sl.save = cloneSave(save);
    o.saves.files[saveFileName(slot)] = serializeSave(save);
    Object.assign(before, cloneSave(save));
    return `${file} saved.${backed}`;
  };
  for (;;) {
    chrome('~Enter~ Edit  ~M~ Max all stats  ~U~ Unlimited  ~Del~ Empty  ~F2~ Save  ~Esc~ Back');
    frame(h, 1, TOP, 78, BOTTOM, `${o.game.dos} ${file}${sl.name ? ` "${sl.name}"` : ''}`);
    scr(h).fill(PANE - 2, TOP + 1, PANE - 2, BOTTOM - 1, BG, 179);
    const fields = saveFields(save, labels);
    const edited = new Set(
      saveFields(before, labels)
        .filter((f) => getField(before, f.id) !== getField(save, f.id))
        .map((f) => f.id),
    );
    const rows: ListRow[] = [];
    const rowField: (SaveField | undefined)[] = [];
    let group = '';
    for (const f of fields) {
      if (f.group !== group) {
        group = f.group;
        rows.push({ text: `── ${GROUP_LABELS[f.group]} `.padEnd(46, '─'), a: HEAD, selectable: false });
        rowField.push(undefined);
      }
      const unused = isUnused(f, labels);
      const warn = !unused && fieldWarnings(save, f, labels).length ? '!' : ' ';
      const mark = edited.has(f.id) ? '*' : ' ';
      const fixed = !f.editable && f.id !== 'scene';
      rows.push({
        text: cell(f.label, 30) + valueText(f, save).padStart(13) + mark + warn,
        a: fixed || unused ? DIM : warn === '!' ? RED : edited.has(f.id) ? YELLOW : BRIGHT,
      });
      rowField.push(f);
    }
    statusLine(
      h,
      note || (dirty() ? 'Changed (*). F2 saves.' : 'Pick a value and press Enter.'),
      note.startsWith('WARNING') || note.startsWith('ERROR') ? RED : dirty() ? YELLOW : TEXT,
    );
    note = '';
    const pick = await pickList(h, rows, {
      x: 2,
      y: TOP + 1,
      w: PANE - 5,
      h: BOTTOM - TOP - 1,
      cur: cur || 1,
      hotkeys: ['M', 'U', 'Delete', 'F2', 'S'],
      onMove: (i) => details(h, rowField[i], save, labels),
    });
    cur = pick.i;
    const f = rowField[pick.i];
    if (pick.key === 'Escape') {
      if (!dirty()) return '';
      const k = await messageBox(h, [`Save the changes to ${file}?`, '', '(Y)es   (N)o   (Esc) keep editing'], undefined, ['Y', 'N', 'Escape']);
      if (k === 'Y') return write();
      if (k === 'N') return 'Changes thrown away.';
      continue;
    }
    if (pick.key === 'F2' || pick.key === 'S') {
      note = dirty() ? await write() : 'Nothing changed.';
      continue;
    }
    if (pick.key === 'M') {
      const changed = maxAll(save, labels);
      note = changed.length
        ? `Max all: ${changed.length} stat${changed.length === 1 ? '' : 's'} set as high as the game handles well.`
        : 'Every stat is at its maximum already.';
      continue;
    }
    if (f?.id === 'scene' && pick.key === 'Enter') {
      const next = await pickLevel(h, o, save);
      if (typeof next === 'string') note = next;
      else {
        // the save is changed in place (the list and Save read this object)
        for (const k of Object.keys(save)) delete (save as Record<string, unknown>)[k];
        Object.assign(save, next);
        const lvl = o.labels?.sceneName(save.doscene);
        note = `Level ${save.doscene}${lvl ? ` ${lvl}` : ''}: the hero starts at ${save.world.chr.x[0]},${save.world.chr.y[0]}.`.slice(0, 77);
      }
      continue;
    }
    if (!f || !f.editable) {
      note = f ? `${f.label} can't be changed here.` : '';
      continue;
    }
    if (pick.key === 'U') {
      if (!f.canBeUnlimited) note = `ERROR: ${f.label} can't be unlimited.`;
      else setField(save, f.id, UNLIMITED, labels);
      continue;
    }
    if (pick.key === 'Delete') {
      if (f.type === 'item') setField(save, f.id, BACKBL, labels);
      continue;
    }
    note = f.type === 'item' ? await pickItem(h, o, save, f) : await editNumber(h, save, f, labels);
  }
}

const scr = (h: RetroHost) => h.screen;

/** Types a new value over the old, with the range checked and a warning past the safe maximum. */
async function editNumber(h: RetroHost, save: SavedGame, f: SaveField, labels: GameLabels | undefined): Promise<string> {
  const v = getField(save, f.id);
  const ask = `New ${f.label} (${num(f.min)} to ${num(f.max)}${f.canBeUnlimited ? ', U unlimited' : ''}): `.slice(0, 62);
  statusLine(h, ask, YELLOW);
  const text = await editLine(h, 1 + ask.length, ROWS - 2, 14, typeof v === 'number' ? String(v) : '', f.canBeUnlimited ? /^[-0-9uU]$/ : /^[-0-9]$/);
  if (text === null || !text.trim()) return '';
  if (/^u$/i.test(text.trim())) {
    if (!f.canBeUnlimited) return `ERROR: ${f.label} can't be unlimited.`;
    setField(save, f.id, UNLIMITED, labels);
    return `${f.label} is now UNLIMITED.`;
  }
  if (!/^-?\d+$/.test(text.trim())) return 'ERROR: Not a number!';
  const n = Number(text.trim());
  if (n < f.min || n > f.max) {
    await messageBox(h, [`ERROR: ${f.label} must be between`, `${num(f.min)} and ${num(f.max)}.`, '', 'Press any key.']);
    return `ERROR: ${num(n)} is out of range; ${f.label} not changed.`;
  }
  if (n > f.safeMax && !(await confirm(h, [`WARNING: values above ${num(f.safeMax)} may overflow!`, ...wrapWords(f.note, 60)]))) return 'Not changed.';
  setField(save, f.id, n, labels);
  const warn = fieldWarnings(save, f, labels);
  return warn.length ? `WARNING: ${warn[0]}` : `${f.label} set to ${num(n)}.`;
}

/** Picks an inventory item: any background block of the level, or empty. */
async function pickItem(h: RetroHost, o: Open, save: SavedGame, f: SaveField): Promise<string> {
  const labels = o.labels;
  const scene = save.doscene;
  const blocks = labels?.blocks(scene);
  const pal = labels?.palette(scene);
  const v = getField(save, f.id);
  const held = typeof v === 'number' ? v : BACKBL;
  const every = Array.from({ length: BACKBL }, (_, n) => n);
  // the level's pick-ups (and what the slot holds) first; Tab shows every block
  const pickUps = every.filter((n) => blocks?.[n]?.obj || n === held);
  let all = !blocks || pickUps.length < 2;
  for (;;) {
    const values = [BACKBL, ...(all ? every : pickUps)];
    const rows: ListRow[] = values.map((n) =>
      n === BACKBL ? { text: '(empty)' } : { text: blockText(blocks?.[n], n, labels, scene), a: blocks?.[n]?.obj ? BRIGHT : DIM },
    );
    frame(h, 1, TOP, 78, BOTTOM, `${f.label}: choose an item`);
    scr(h).fill(PANE - 2, TOP + 1, PANE - 2, BOTTOM - 1, BG, 179);
    keyBar(h, `~\x18\x19~ Choose  ~Enter~ Put in the slot  ~Tab~ ${all ? 'Pick-ups only' : 'Every block'}  ~Esc~ Cancel`);
    statusLine(h, all ? 'White blocks can be picked up in the game; cyan ones are scenery.' : `The level's ${pickUps.length} pick-ups. Tab shows every block.`);
    const pick = await pickList(h, rows, {
      x: 2,
      y: TOP + 1,
      w: PANE - 5,
      h: BOTTOM - TOP - 1,
      cur: Math.max(0, values.indexOf(held)),
      hotkeys: ['Tab'],
      onMove: (i) => {
        scr(h).fill(PANE, TOP + 1, PANE + PANE_W, BOTTOM - 1, BG);
        if (!i) return put(h, PANE, TOP + 1, DIM, 'An empty slot');
        drawBlock(h, PANE + 2, TOP + 2, blocks?.[values[i]], pal);
        wrapWords(blockText(blocks?.[values[i]], values[i], labels, scene).replace(/^Block +\d+ +/, ''), PANE_W).forEach((l, k) =>
          put(h, PANE, TOP + 13 + k, TEXT, l),
        );
      },
    });
    if (pick.key === 'Tab') {
      all = !all;
      continue;
    }
    if (pick.key !== 'Enter') return '';
    const n = values[pick.i];
    const b = blocks?.[n];
    if (
      n !== BACKBL &&
      b &&
      !b.obj &&
      !(await confirm(h, ['WARNING: this block is not one the hero can pick up.', 'It shows on the F2 screen, and dropping it', 'puts it on the map.']))
    )
      return 'Not changed.';
    setField(save, f.id, n, labels);
    return n === BACKBL ? `${f.label} emptied.` : `${f.label}: block ${n}.`;
  }
}

/** Picks a level for the save: the game's levels, the hero put at the start of the one chosen. */
async function pickLevel(h: RetroHost, o: Open, save: SavedGame): Promise<SavedGame | string> {
  if (!o.disk || !o.gam || !o.labels) return `ERROR: ${o.game.dos}'s game files can't be read, so SAVEHACK can't change the level.`;
  const levels = saveLevels(o.labels.game);
  if (!levels.length) return 'ERROR: no level of this game is linked to.';
  frame(h, 1, TOP, 78, BOTTOM, 'Level: choose where the saved game goes');
  keyBar(h, '~\x18\x19~ Choose  ~Enter~ Go there  ~Esc~ Cancel');
  statusLine(h, 'The hero starts where the game enters the level. Score, lives, items stay.');
  put(h, 3, TOP + 1, HEAD, cell('Level', 50) + 'Starts at');
  const rows: ListRow[] = levels.map((l) => ({ text: cell(levelLabel(l), 50) + `${l.to.x},${l.to.y}`, a: l.scene === save.doscene ? YELLOW : BRIGHT }));
  const pick = await pickList(h, rows, {
    x: 2,
    y: TOP + 2,
    w: 75,
    h: BOTTOM - TOP - 3,
    cur: Math.max(
      0,
      levels.findIndex((l) => l.scene === save.doscene),
    ),
  });
  if (pick.key !== 'Enter') return '';
  try {
    return changeSaveLevel(o.disk, o.gam, save, levels[pick.i].scene);
  } catch (e) {
    return `ERROR: ${(e as Error).message}`.slice(0, 77);
  }
}

// ---------------------------------------------------------------- high scores

async function highScores(h: RetroHost, o: Open, chrome: Chrome, original: Original): Promise<string> {
  const file = o.saves.highScoreFile ?? (o.game.gam ? highScoreFileName(o.game.gam) : undefined);
  if (!file) return 'ERROR: this game has no high-score file.';
  const table = { ...o.saves.highScores, entries: o.saves.highScores.entries.map((e) => ({ ...e })) };
  let start = JSON.stringify(table.entries);
  let cur = 0;
  let note = '';
  const dirty = () => JSON.stringify(table.entries) !== start;
  const write = async () => {
    const backed = await original(o);
    table.entries = sortHighScores(table.entries);
    await writeHighScores(o.game.save, file, table);
    await reload(o);
    start = JSON.stringify(table.entries);
    return `${file.toUpperCase()} saved, highest first.${backed}`;
  };
  for (;;) {
    chrome('~Enter~ Edit  ~Del~ Clear  ~F2~ Save  ~Esc~ Back');
    frame(h, 1, TOP, 78, BOTTOM, `${o.game.title} - ${file.toUpperCase()}`);
    put(h, 4, TOP + 2, HEAD, cell('#', 5) + cell('Name', HIGH_SCORE_NAME_MAX + 4) + 'Score'.padStart(14));
    const rows: ListRow[] = table.entries.map((e, i) => {
      const warn = highScoreWarnings(e);
      return {
        text: cell(`${i + 1}.`, 5) + cell(e.name || '(none)', HIGH_SCORE_NAME_MAX + 4) + num(e.score).padStart(14) + (warn.length ? '  !' : ''),
        a: warn.length ? RED : e.name ? BRIGHT : DIM,
      };
    });
    statusLine(
      h,
      note || (dirty() ? 'Changed. F2 saves.' : 'Pick an entry and press Enter.'),
      note.startsWith('WARNING') || note.startsWith('ERROR') ? RED : TEXT,
    );
    note = '';
    const pick = await pickList(h, rows, {
      x: 3,
      y: TOP + 4,
      w: 52,
      h: 10,
      cur,
      hotkeys: ['Delete', 'F2', 'S'],
      onMove: (i) => {
        scr(h).fill(58, TOP + 2, 77, BOTTOM - 1, BG);
        highScoreWarnings(table.entries[i])
          .flatMap((w) => wrapWords(`! ${w}`, 19))
          .forEach((l, k) => put(h, 58, TOP + 2 + k, RED, l));
      },
    });
    cur = pick.i;
    const e = table.entries[cur];
    if (pick.key === 'Escape') {
      if (!dirty()) return '';
      const k = await messageBox(h, [`Save the changes to ${file.toUpperCase()}?`, '', '(Y)es   (N)o   (Esc) keep editing'], undefined, ['Y', 'N', 'Escape']);
      if (k === 'Y') return write();
      if (k === 'N') return 'Changes thrown away.';
      continue;
    }
    if (pick.key === 'F2' || pick.key === 'S') {
      note = dirty() ? await write() : 'Nothing changed.';
      continue;
    }
    if (pick.key === 'Delete') {
      e.name = '';
      e.score = 0;
      continue;
    }
    const row = TOP + 4 + cur;
    const name = await editLine(h, 9, row, HIGH_SCORE_NAME_MAX + 1, e.name);
    if (name === null) continue;
    const score = await editLine(h, 36, row, 14, String(e.score), /^[-0-9]$/);
    if (score === null) continue;
    if (!/^-?\d+$/.test(score.trim())) {
      note = 'ERROR: Not a number!';
      continue;
    }
    const n = Number(score.trim());
    if (n < SCORE_MIN || n > SCORE_MAX) {
      await messageBox(h, ['ERROR: a score must be between', `${num(SCORE_MIN)} and ${num(SCORE_MAX)}.`, '', 'Press any key.']);
      continue;
    }
    if (n > 999_999_999 && !(await confirm(h, ['WARNING: values above 999,999,999 may overflow', 'the 10 columns the Top Ten screen gives a score.'])))
      continue;
    e.name = name.slice(0, HIGH_SCORE_NAME_MAX);
    e.score = n;
    const warn = highScoreWarnings(e);
    note = warn.length ? `WARNING: ${warn[0]}` : '';
  }
}
