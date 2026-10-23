// "Saves & scores": a game's saved games and high-score table, opened and changed from the home
// page (a cheat sheet and an inspector in one). Each of the ten slots shows its fields with the
// engine's limits and plain warnings, Max all, Undo, export and import of the .sav, and delete;
// the high-score table can be edited; backups can be taken, restored and deleted. The first
// change in a visit backs the saves up first, as SAVEHACK does on the desk PC.
//
// The address keeps which part is open (#/game/<key>?saves=3, ?saves=scores, ?saves=backups).
import './savesPanel.css';
import { h, clear, download, modal, pickFiles } from '../editor/core/ui';
import { blockCanvas } from '../editor/core/draw';
import { chooseBlock } from '../editor/widgets/blockChooser';
import { setHashParams } from '../urlState';
import { SAVES_CHANGED } from '../project/storage';
import {
  backupNow,
  changeSaveLevel,
  changedFields,
  cloneSave,
  deleteBackup,
  deleteSlot,
  fieldWarnings,
  gameLabels,
  getField,
  GROUP_LABELS,
  levelLabel,
  moveSaveHero,
  saveLevels,
  saveMap,
  HIGH_SCORES,
  HIGH_SCORE_NAME_MAX,
  highScoreFileName,
  highScoreWarnings,
  listBackups,
  loadGameSaves,
  maxAll,
  newGameSave,
  NEW_SAVE_NAME,
  parseSave,
  putBackup,
  getBackup,
  renameBackup,
  restoreBackup,
  saveFields,
  SAVE_SLOTS,
  SCORE_MAX,
  SCORE_MIN,
  serializeSave,
  setField,
  SLOT_NAME_LENGTH,
  sortHighScores,
  UNLIMITED,
  watchBackups,
  writeHighScores,
  writeSlot,
  writeSlotBytes,
  type BackupSummary,
  type FieldGroup,
  type GameLabels,
  type GameSaves,
  type HighScore,
  type SavedGame,
  type SaveField,
  type SaveMap,
} from '../project/saveData';
import { saveMapView, type Camera, type MapView } from './saveMapView';
import { tip } from './tip';
import { BACKBL } from '../formats/blocks';
import { FOUND_FILE, heartOf, parseFound } from '../tinHearts/tinHearts';

export interface SavesTarget {
  /** The save id ('game:<catalog id>' or 'project:<id>'). */
  saveId: string;
  title: string;
  /** The game's .gam file name. */
  gam: string | null;
  /** All the game's files (for names, pictures, and the high-score table it came with). */
  files(): Promise<{ get(name: string): Uint8Array | undefined }>;
  /** The home page's game key, to keep the open part in the address. */
  key?: string;
}

type View = number | 'scores' | 'backups';

const fmt = (n: number) => n.toLocaleString('en-US');
const viewParam = (v: View) => (typeof v === 'number' ? String(v + 1) : v);
function parseView(s: string | undefined): View {
  if (s === 'scores' || s === 'backups') return s;
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= SAVE_SLOTS ? n - 1 : 0;
}
/** "0 to 32,767; the game handles up to 9,999 well." */
const rangeText = (f: SaveField, lower = false) => `${lower ? 'from' : 'From'} ${fmt(f.min)} to ${fmt(f.max)}${f.safeMax < f.max ? `; the game handles up to ${fmt(f.safeMax)} well` : ''}.`;
const kb = (n: number) => `${fmt(Math.max(1, Math.round(n / 1024)))} KB`;

async function confirmDialog(title: string, text: string, ok: string, danger = false): Promise<boolean> {
  return !!(await modal<boolean>(title, (close) => [
    h('p', { class: 'sv-confirm' }, text),
    h(
      'div',
      { class: 'buttons' },
      h('button', { type: 'button', onclick: () => close(false) }, 'Cancel'),
      h('button', { type: 'button', class: danger ? 'danger' : 'primary', autofocus: true, onclick: () => close(true) }, ok),
    ),
  ]));
}

/** Opens the panel for a game; `initial` is an address value (a slot number, 'scores', 'backups'). */
export async function openSaves(target: SavesTarget, initial?: string): Promise<void> {
  let view: View = parseView(initial);
  let saves: GameSaves | undefined;
  let labels: GameLabels | undefined;
  let backups: BackupSummary[] = [];
  /** Slots being edited: the working copy and name, until saved or undone. */
  const work = new Map<number, { save: SavedGame; name: string }>();
  let scores: HighScore[] | undefined;
  let backedUp = false;
  /** Slots whose unlimited sequences are shown. */
  const openUnlimited = new Set<number>();
  /** The last word on moving the hero in a slot (why he can't go there, or where he went). */
  const whereSay = new Map<number, { text: string; error: boolean }>();
  /** Each slot's map view (kept while the panel is drawn again), for its level. */
  const cameras = new Map<number, { scene: number; camera: Camera }>();
  /** A save's whole level, drawn once (moving the hero keeps it). */
  const mapCache = new WeakMap<SavedGame, SaveMap>();

  // messages show in the dialog's footer (a toast would sit under the dialog's backdrop)
  const sayEl = h('p', { class: 'sv-say', role: 'status', 'aria-live': 'polite' });
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  const toast = (message: string, kind: 'info' | 'error' = 'info') => {
    sayEl.textContent = message;
    sayEl.classList.toggle('error', kind === 'error');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => (sayEl.textContent = ''), kind === 'error' ? 10000 : 6000);
  };
  const nav = h('nav', { class: 'sv-nav', 'aria-label': 'Save slots, high scores and backups' });
  const main = h('section', { class: 'sv-main', 'aria-live': 'off' });
  const body = h('div', { class: 'sv' }, nav, main);
  const keepView = () => target.key && setHashParams({ saves: viewParam(view) }, ['game', target.key]);

  const reload = async () => {
    saves = await loadGameSaves(target.saveId, { gam: target.gam ?? undefined, disk: disk ?? undefined });
    backups = await listBackups(target.saveId);
  };
  let disk: { get(name: string): Uint8Array | undefined } | undefined;

  const dirtySlot = (slot: number): boolean => {
    const w = work.get(slot);
    const s = saves?.slots[slot];
    if (!w || !s?.save) return false;
    return w.name !== s.name || !sameBytes(serializeSave(w.save), s.bytes);
  };
  const dirtyScores = () => !!scores && !!saves && JSON.stringify(scores) !== JSON.stringify(saves.highScores.entries);
  const anyDirty = () => [...work.keys()].some(dirtySlot) || dirtyScores();

  /** Backs the saves up once, before the first change of this visit. */
  const safety = async () => {
    if (backedUp) return;
    backedUp = true;
    await backupNow(target.saveId, { label: 'Before changes in Saves & scores', auto: true, by: 'web' });
  };

  // ------------------------------------------------------------------ the list on the left
  const renderNav = () => {
    if (!saves) return;
    const item = (v: View, title: string, sub: string, extra?: string) => {
      const on = v === view;
      return h(
        'button',
        {
          type: 'button',
          class: `sv-nav-item${on ? ' on' : ''}`,
          'aria-current': on ? 'true' : undefined,
          onclick: () => go(v),
        },
        h('span', { class: 'sv-nav-title' }, title, extra ? h('span', { class: 'sv-dot', title: 'Unsaved changes', 'aria-label': '(unsaved changes)' }, '●') : null),
        h('span', { class: 'sv-nav-sub' }, sub),
      );
    };
    clear(
      nav,
      h('h3', { class: 'sv-nav-head' }, 'Saved games'),
      ...saves.slots.map((s) => {
        const save = work.get(s.slot)?.save ?? s.save;
        const sub = s.error ? 'Damaged' : save ? `${fmt(save.world.ci.score)} pts · ${labels?.sceneName(save.doscene) ?? `level ${save.doscene}`}` : 'Empty';
        return item(s.slot, `${s.slot + 1}. ${(work.get(s.slot)?.name ?? s.name) || (save ? 'Unnamed' : '—')}`, sub, dirtySlot(s.slot) ? '●' : undefined);
      }),
      h('h3', { class: 'sv-nav-head' }, 'More'),
      item('scores', 'High scores', `${saves.highScores.entries.filter((e) => e.score !== 0).length} of ${HIGH_SCORES}`, dirtyScores() ? '●' : undefined),
      item('backups', 'Backups', backups.length ? `${backups.length} · last ${new Date(backups[0].when).toLocaleDateString('en-US')}` : 'None yet'),
      heartNote(),
    );
  };

  /** The game's tin heart, once found (or still to find, in a game that hides one): kept with its saves. */
  const heartNote = () => {
    const found = parseFound(saves?.files[FOUND_FILE]);
    if (!found && !heartOf(target.saveId.replace(/^game:/, ''))) return null;
    const when = new Date(found?.found ?? '');
    const sub = found ? (isNaN(+when) ? 'Found' : `Found ${when.toLocaleDateString('en-US', { dateStyle: 'medium' })}`) : 'Not found yet';
    return h('div', { class: 'sv-nav-item sv-nav-note' }, h('span', { class: 'sv-nav-title' }, 'Tin heart'), h('span', { class: 'sv-nav-sub' }, sub));
  };

  const go = (v: View) => {
    view = v;
    keepView();
    render();
    main.querySelector<HTMLElement>('.sv-title')?.focus({ preventScroll: true });
  };

  // ------------------------------------------------------------------ a slot
  /** The ⓘ beside a field (its note and limits), or `groupTip` for a group whose fields share one. */
  const fieldRow = (slot: number, save: SavedGame, f: SaveField, refresh: (rebuild?: boolean) => void, groupTip?: string): HTMLElement => {
    const id = `sv-${slot}-${f.id.replace(':', '-')}`;
    const v = getField(save, f.id);
    const unused = f.group === 'counters' && /unused/.test(f.label);
    const warn = h('p', { class: 'sv-warn', id: `${id}-warn` });
    const showWarn = () => {
      // the limits are in the ⓘ beside the field
      // a counter no block uses can't block the way
      const w = unused ? [] : fieldWarnings(save, f, labels).map((x) => x.replace(/ \(see the note on its limit\)/, ''));
      // one line each (all of it on focus, and in the title)
      clear(warn, ...w.map((x) => h('span', { title: x }, '⚠ ', x)));
      warn.hidden = !w.length;
    };
    if (f.type === 'info')
      return h('div', { class: 'sv-field info' }, h('span', { class: 'sv-label' }, f.label), h('span', { class: 'sv-info' }, f.id === 'scene' ? f.note : String(v ?? '—')));
    if (f.type === 'item') {
      const blocks = labels?.blocks(save.doscene);
      const pal = labels?.palette(save.doscene);
      const n = typeof v === 'number' ? v : BACKBL;
      const pic = blocks?.[n] && pal && n !== BACKBL ? blockCanvas(blocks[n].pixels, pal, { className: 'sv-pic' }) : h('span', { class: 'sv-pic empty', 'aria-hidden': 'true' }, '·');
      const btn = h(
        'button',
        {
          type: 'button',
          class: 'sv-item',
          id,
          'aria-label': `${f.label}: ${n === BACKBL ? 'empty' : `block ${n}`}. Change`,
          'aria-describedby': [groupTip, `${id}-warn`].filter(Boolean).join(' '),
          onclick: async () => {
            let next: number | undefined;
            if (blocks && pal) next = await chooseBlock(`${f.label}: what the hero carries`, blocks, pal, n, [{ value: BACKBL, label: 'empty', icon: '·' }], false, (b, i) => !!b.obj || i === n);
            else {
              const s = await modal<string>(f.label, (close) => {
                const input = h('input', { type: 'number', min: 0, max: BACKBL, value: String(n), 'aria-label': 'Block number (150 = empty)' }) as HTMLInputElement;
                return [input, h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(input.value) }, 'OK'))];
              });
              next = s === undefined ? undefined : Number(s);
            }
            if (next === undefined || Number.isNaN(next)) return;
            setField(save, f.id, next, labels);
            refresh();
          },
        },
        pic,
        h('small', null, n === BACKBL ? 'empty' : `#${n}`),
      );
      const row = h('div', { class: 'sv-field item' }, h('span', { class: 'sv-label' }, f.label), btn, warn);
      showWarn();
      return row;
    }
    const unlimited = v === UNLIMITED;
    const own = groupTip ? undefined : tip(f.label, h('p', null, f.note), h('p', null, rangeText(f)));
    const input = h('input', {
      type: 'number',
      id,
      inputmode: 'numeric',
      min: f.min,
      max: f.max,
      step: 1,
      value: typeof v === 'number' ? String(v) : '',
      placeholder: v === null ? 'not set yet' : unlimited ? '∞' : '',
      disabled: unlimited,
      'aria-describedby': `${own?.id ?? groupTip ?? ''} ${id}-warn`.trim(),
      onchange: () => {
        const n = Number(input.value);
        if (input.value === '' || Number.isNaN(n)) return;
        setField(save, f.id, n, labels);
        const now = getField(save, f.id);
        if (typeof now === 'number' && now !== n) input.value = String(now);
        showWarn();
        refresh();
      },
    }) as HTMLInputElement;
    const box = f.canBeUnlimited
      ? h(
          'label',
          { class: 'sv-inf', title: 'Never counts down and never runs out' },
          h('input', {
            type: 'checkbox',
            checked: unlimited,
            onchange: (e: Event) => {
              const on = (e.target as HTMLInputElement).checked;
              // back to counting: start from the safe top (the engine's own unlimited is gone)
              setField(save, f.id, on ? UNLIMITED : Math.min(f.safeMax, 99), labels);
              refresh(true);
            },
          }),
          'Unlimited',
        )
      : null;
    const row = h(
      'div',
      { class: `sv-field${unused ? ' unused' : ''}` },
      h('span', { class: 'sv-label-row' }, h('label', { class: 'sv-label', for: id }, f.label), own?.el),
      h('div', { class: 'sv-input' }, input, box),
      warn,
    );
    showWarn();
    return row;
  };

  const renderSlot = (slot: number) => {
    const s = saves!.slots[slot];
    const title = h('h3', { class: 'sv-title', tabindex: -1 }, `Slot ${slot + 1}`);
    if (!s.save) {
      clear(
        main,
        h('header', { class: 'sv-head' }, title),
        s.error
          ? h('p', { class: 'sv-empty' }, `${s.error} `, 'You can download it as it is, or delete it.')
          : h('p', { class: 'sv-empty' }, 'Nothing saved here yet. In the game, press F5 to save into this slot, start a new save here as the game begins, or bring in a .sav file.'),
        h(
          'div',
          { class: 'sv-tools' },
          !s.bytes && disk && target.gam ? h('button', { type: 'button', class: 'primary', onclick: () => void newSave(slot), title: 'A saved game at the very start: the first level, with the hero’s starting hit points, lives and items' }, '＋ New save') : null,
          h('button', { type: 'button', onclick: () => void importSav(slot) }, '⇪ Import .sav…'),
          s.bytes ? h('button', { type: 'button', onclick: () => exportSav(slot, s.bytes!) }, '⇩ Download .sav') : null,
          s.bytes ? h('button', { type: 'button', class: 'danger', onclick: () => void removeSlot(slot) }, 'Delete') : null,
        ),
      );
      return;
    }
    if (!work.has(slot)) work.set(slot, { save: cloneSave(s.save), name: s.name });
    const w = work.get(slot)!;
    const save = w.save;
    const status = h('p', { class: 'sv-status', role: 'status' });
    const saveBtn = h('button', { type: 'button', class: 'primary', onclick: () => void commitSlot(slot) }, 'Save changes');
    const undoBtn = h(
      'button',
      {
        type: 'button',
        onclick: () => {
          work.delete(slot);
          whereSay.delete(slot);
          render();
        },
      },
      'Undo changes',
    );
    const refreshState = (rebuild = false) => {
      const dirty = dirtySlot(slot);
      saveBtn.disabled = !dirty;
      undoBtn.disabled = !dirty;
      const n = changedFields(s.save!, save, labels).length;
      const what = [n ? `${n} value${n === 1 ? '' : 's'}` : null, w.name !== s.name ? 'the name' : null].filter(Boolean).join(' and ');
      status.textContent = dirty ? `Changed ${what || 'the save'}: not saved yet.` : 'Saved. In the game, F6 loads it.';
      renderNav();
      if (rebuild) render();
    };
    const nameInput = h('input', {
      type: 'text',
      id: `sv-name-${slot}`,
      value: w.name,
      maxlength: SLOT_NAME_LENGTH,
      placeholder: 'Unnamed',
      spellcheck: false,
      oninput: () => {
        w.name = nameInput.value.replace(/[^\x20-\x7e]/g, '');
        refreshState();
      },
    }) as HTMLInputElement;

    const fields = saveFields(save, labels);
    const groups = new Map<FieldGroup, SaveField[]>();
    // money sits with score, health and lives (one short group, not two)
    for (const f of fields) {
      const g = f.group === 'money' ? 'player' : f.group;
      groups.set(g, [...(groups.get(g) ?? []), f]);
    }
    // these groups' fields share one note (and limits): an ⓘ by the group's name
    const groupTips = new Map<FieldGroup, ReturnType<typeof tip>>();
    for (const g of ['uses', 'counters', 'inventory'] as FieldGroup[]) {
      const first = groups.get(g)?.[0];
      if (first) groupTips.set(g, tip(GROUP_LABELS[g], h('p', null, first.note), g === 'inventory' ? null : h('p', null, `Each ${rangeText(first, true)}`)));
    }
    // where the hero is comes first: the picture shows the save at a glance
    const sets = [...groups].sort(([a], [b]) => Number(b === 'where') - Number(a === 'where')).map(([g, list]) =>
      g === 'where' ? whereGroup(slot, w, () => refreshState()) : h(
        'fieldset',
        { class: `sv-group sv-g-${g}` },
        h('legend', null, GROUP_LABELS[g], groupTips.get(g)?.el),
        (() => {
          const row = (f: SaveField) => fieldRow(slot, save, f, (rebuild) => refreshState(rebuild), groupTips.get(g)?.id);
          if (g !== 'uses') return h('div', { class: 'sv-fields' }, list.map(row));
          // the sequences that never count down are folded away
          const limited = list.filter((f) => getField(save, f.id) !== UNLIMITED);
          const free = list.filter((f) => getField(save, f.id) === UNLIMITED);
          return [
            limited.length ? h('div', { class: 'sv-fields' }, limited.map(row)) : h('p', { class: 'sv-group-note' }, 'Every sequence of this character is unlimited.'),
            free.length
              ? h(
                  'details',
                  { class: 'sv-more', open: openUnlimited.has(slot), ontoggle: (e: Event) => ((e.target as HTMLDetailsElement).open ? openUnlimited.add(slot) : openUnlimited.delete(slot)) },
                  h('summary', null, `${free.length} unlimited sequence${free.length === 1 ? '' : 's'}`),
                  h('div', { class: 'sv-fields' }, free.map(row)),
                )
              : null,
          ];
        })(),
      ),
    );

    clear(
      main,
      h(
        'header',
        { class: 'sv-head' },
        title,
        h('label', { class: 'sv-name', for: `sv-name-${slot}` }, h('span', null, 'Name'), nameInput),
        h('p', { class: 'sv-where' }, labels?.sceneName(save.doscene) ? `Level ${save.doscene}: ${labels.sceneName(save.doscene)}` : `Level ${save.doscene}`, ` · ${kb(s.bytes?.length ?? 0)}`),
        h('button', { type: 'button', class: 'sv-about-btn', onclick: () => void aboutSave(slot, fields), 'aria-haspopup': 'dialog' }, h('span', { class: 'sv-about-i', 'aria-hidden': 'true' }, 'i'), 'About this save'),
      ),
      h(
        'div',
        { class: 'sv-tools', role: 'toolbar', 'aria-label': `Slot ${slot + 1}` },
        saveBtn,
        undoBtn,
        h(
          'button',
          {
            type: 'button',
            title: 'Every counting value to the most the game handles well (items stay as they are)',
            onclick: () => {
              const changed = maxAll(save, labels);
              toast(changed.length ? `Raised ${changed.length} value${changed.length === 1 ? '' : 's'}. Save changes to keep them.` : 'Everything is already at its top.');
              render();
            },
          },
          '★ Max all',
        ),
        h('button', { type: 'button', onclick: () => exportSav(slot, serializeSave(save)), title: 'Download this save (with any changes) as a .sav file' }, '⇩ Download .sav'),
        h('button', { type: 'button', onclick: () => void importSav(slot) }, '⇪ Import .sav…'),
        h('button', { type: 'button', class: 'danger', onclick: () => void removeSlot(slot) }, 'Delete save'),
      ),
      status,
      h('div', { class: 'sv-groups' }, sets),
    );
    refreshState();
  };

  // ------------------------------------------------------------------ where the hero is
  /** How the map works, for its aria-describedby and the About dialog. */
  const MAP_HELP =
    'Drag the hero to move him: his feet snap to a block, and he fits where that block and the one above it are open (green; red where something solid is in the way). A click on the map puts him there too. Drag anywhere else (or with the middle button, or Shift+drag) to look around the whole level; it wraps around at its edges, as the game’s map does. Pinch or Ctrl+wheel zooms. Keys, with the map focused: the arrow keys move him to the next block he fits in that way, Shift+arrows look around (Ctrl+Shift+arrows by 8 blocks), C centers on him, + and − zoom, 0 shows the screen F6 opens on (the dashed frame).';
  const LEVEL_HELP = 'A new level starts where the game enters it, with its items and monsters fresh; score, lives, items and counters stay. Level start enters the level again from its start the same way.';

  /** The level picker, the whole level around the hero (drag him, or look around), and his block. */
  const whereGroup = (slot: number, w: { save: SavedGame; name: string }, changed: () => void): HTMLElement => {
    const save = w.save;
    const gam = target.gam;
    const levels = labels && disk && gam ? saveLevels(labels.game) : [];
    const id = `sv-${slot}-where`;
    const say = h('p', { class: 'sv-where-say', id: `${id}-say`, role: 'status' });
    const tell = (text: string, error = false) => {
      whereSay.set(slot, { text, error });
      say.textContent = text;
      say.classList.toggle('error', error);
    };
    const last = whereSay.get(slot);
    if (last) tell(last.text, last.error);
    /** Puts a changed save in and draws the slot again, keeping focus where it was. */
    const change = (make: () => SavedGame, done: (next: SavedGame) => string, focus: string) => {
      try {
        const next = make();
        w.save = next;
        cameras.delete(slot);
        tell(done(next));
      } catch (e) {
        tell((e as Error).message, true);
        return;
      }
      render();
      main.querySelector<HTMLElement>(`#${focus}`)?.focus({ preventScroll: true });
    };
    const levelName = (scene: number) => labels?.sceneName(scene) ?? `level ${scene}`;
    const who = w.name.trim() || 'The hero';
    const mapLabel = (s: SavedGame) => `${who} in ${levelName(s.doscene)} at block ${s.world.chr.x[0]}, ${s.world.chr.y[0]}`;

    const levelTip = tip('changing the level', LEVEL_HELP);
    const select = h(
      'select',
      {
        id: `${id}-level`,
        disabled: !levels.length,
        'aria-describedby': `${levelTip.id} ${id}-say`,
        onchange: () => {
          const scene = Number(select.value);
          change(
            () => changeSaveLevel(disk!, gam!, w.save, scene),
            (n) => `${who} is at the start of ${levelName(n.doscene)} (block ${n.world.chr.x[0]}, ${n.world.chr.y[0]}). Save changes to keep it.`,
            `${id}-level`,
          );
        },
      },
      ...levels.map((l) => h('option', { value: String(l.scene), selected: l.scene === save.doscene }, levelLabel(l))),
      levels.some((l) => l.scene === save.doscene) ? null : h('option', { value: String(save.doscene), selected: true, disabled: true }, labels?.sceneName(save.doscene) ? `Level ${save.doscene}: ${labels.sceneName(save.doscene)}` : `Level ${save.doscene}`),
    ) as HTMLSelectElement;
    const restart = h(
      'button',
      {
        type: 'button',
        id: `${id}-restart`,
        disabled: !levels.some((l) => l.scene === save.doscene),
        title: 'Enter this level again from its start, as the game does: its items and monsters come back',
        onclick: () =>
          change(
            () => changeSaveLevel(disk!, gam!, w.save, w.save.doscene),
            (n) => `${who} is back at the start of ${levelName(n.doscene)} (block ${n.world.chr.x[0]}, ${n.world.chr.y[0]}). Save changes to keep it.`,
            `${id}-restart`,
          ),
      },
      '↺ Level start',
    );

    let view: MapView | undefined;
    /** Moves the hero without drawing the panel again (the level's picture stays as it is). */
    const moveTo = (bx: number, by: number): string | undefined => {
      let next: SavedGame;
      try {
        next = moveSaveHero(disk!, gam!, w.save, bx, by);
      } catch (e) {
        tell((e as Error).message, true);
        return (e as Error).message;
      }
      const m = mapCache.get(w.save);
      w.save = next;
      const hero = { x: next.world.chr.x[0], y: next.world.chr.y[0] };
      const screen = { x: next.world.mx, y: next.world.my };
      if (m) mapCache.set(next, { ...m, hero, view: screen, heroOffset: { x: next.world.chr.x[1], y: next.world.chr.y[1] - 20 } });
      view?.setHero(hero, screen, mapLabel(next));
      (form.querySelector(`#${id}-x`) as HTMLInputElement).value = String(hero.x);
      (form.querySelector(`#${id}-y`) as HTMLInputElement).value = String(hero.y);
      tell(`${who} moved to block ${hero.x}, ${hero.y}. Save changes to keep it.`);
      changed();
      return undefined;
    };
    const coord = (axis: 'x' | 'y', v: number, label: string) =>
      h(
        'label',
        { class: 'sv-coord', for: `${id}-${axis}` },
        h('span', null, label),
        h('input', { type: 'number', id: `${id}-${axis}`, inputmode: 'numeric', min: 0, max: 99, step: 1, value: String(v), 'aria-describedby': `${id}-say` }),
      );
    const form = h(
      'form',
      {
        class: 'sv-move',
        onsubmit: (e: Event) => {
          e.preventDefault();
          const bx = Number((form.querySelector(`#${id}-x`) as HTMLInputElement).value);
          const by = Number((form.querySelector(`#${id}-y`) as HTMLInputElement).value);
          moveTo(bx, by);
        },
      },
      coord('x', save.world.chr.x[0], 'Column'),
      coord('y', save.world.chr.y[0], 'Row'),
      h('button', { id: `${id}-go`, disabled: !disk || !gam }, 'Move hero'),
    );

    let shot: HTMLElement;
    try {
      if (!disk || !gam) throw new Error('The game’s files are not here to draw the level.');
      let map = mapCache.get(save);
      if (!map) mapCache.set(save, (map = saveMap(disk, gam, save)));
      const cam = cameras.get(slot);
      view = saveMapView({
        map,
        label: mapLabel(save),
        describedBy: `${id}-help`,
        camera: cam?.scene === save.doscene ? cam.camera : undefined,
        onCamera: (camera) => cameras.set(slot, { scene: w.save.doscene, camera }),
        onMove: moveTo,
      });
      shot = h('div', { class: 'sv-shot-box' }, view.el, h('p', { class: 'sv-sr', id: `${id}-help` }, MAP_HELP));
    } catch (e) {
      shot = h('p', { class: 'sv-empty' }, `No picture: ${(e as Error).message}`);
    }
    const mapTip = tip('the map', MAP_HELP);

    return h(
      'fieldset',
      { class: 'sv-group sv-g-where' },
      h('legend', null, GROUP_LABELS.where, mapTip.el),
      h(
        'div',
        { class: 'sv-where-grid' },
        shot,
        h(
          'div',
          { class: 'sv-where-tools' },
          h('span', { class: 'sv-label-row' }, h('label', { class: 'sv-label', for: `${id}-level` }, 'Level'), levelTip.el),
          h('div', { class: 'sv-input' }, select, restart),
          levels.length ? null : h('p', { class: 'sv-group-note' }, 'The game’s files are needed to change the level.'),
          h('span', { class: 'sv-label' }, 'Where the hero stands'),
          form,
          say,
        ),
      ),
    );
  };

  /** Every note of a save's fields, the map's keys and what saving does, in one place. */
  const aboutSave = (slot: number, fields: SaveField[]) =>
    modal<void>(`About slot ${slot + 1}`, (close) => {
      const byGroup = new Map<FieldGroup, SaveField[]>();
      for (const f of fields) if (f.group !== 'where') byGroup.set(f.group, [...(byGroup.get(f.group) ?? []), f]);
      const shared = (g: FieldGroup) => g === 'uses' || g === 'counters' || g === 'inventory';
      return [
        h(
          'div',
          { class: 'sv-about', tabindex: 0, role: 'region', 'aria-label': 'About this save' },
          h('h3', null, 'Saving'),
          h('p', null, 'Changes stay here until Save changes; Undo changes drops them. The first change of a visit backs every save up first (see Backups). In the game, F6 loads the save. Download .sav gives the file with any changes; Import .sav… puts a file in this slot.'),
          h('p', null, '★ Max all raises every counting value to the most the game handles well; the items stay as they are.'),
          h('h3', null, GROUP_LABELS.where),
          h('p', null, LEVEL_HELP),
          h('p', null, MAP_HELP),
          ...[...byGroup].flatMap(([g, list]) => [
            h('h3', null, GROUP_LABELS[g]),
            shared(g)
              ? h('p', null, list[0].note, g === 'inventory' ? '' : ` Each ${rangeText(list[0], true)}`)
              : h('dl', null, list.flatMap((f) => [h('dt', null, f.label), h('dd', null, `${f.note} ${rangeText(f)}`)])),
          ]),
        ),
        h('div', { class: 'buttons' }, h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(undefined) }, 'Close')),
      ];
    });

  const commitSlot = async (slot: number) => {
    const w = work.get(slot);
    if (!w) return;
    try {
      await safety();
      await writeSlot(target.saveId, slot, w.save, w.name);
      work.delete(slot);
      whereSay.delete(slot);
      await reload();
      toast(`Slot ${slot + 1} saved. In the game, F6 loads it.`);
      render();
    } catch (e) {
      toast(`Could not save: ${(e as Error).message}`, 'error');
    }
  };

  const fileBase = () => (target.gam ?? target.title).replace(/\.[^.]*$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const exportSav = (slot: number, bytes: Uint8Array) => download(`${fileBase()}-game${slot}.sav`, bytes);

  const importSav = async (slot: number) => {
    const [file] = await pickFiles({ multiple: false, accept: '.sav,application/json' });
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      parseSave(bytes);
    } catch (e) {
      toast(`${file.name}: ${(e as Error).message}`, 'error');
      return;
    }
    if (saves?.slots[slot].bytes && !(await confirmDialog('Replace this save?', `Slot ${slot + 1} already holds a saved game. Replace it with ${file.name}? (A backup is taken first.)`, 'Replace'))) return;
    backedUp = false; // a fresh backup for each replace
    await safety();
    await writeSlotBytes(target.saveId, slot, bytes);
    work.delete(slot);
    await reload();
    toast(`${file.name} is in slot ${slot + 1}.`);
    render();
  };

  /** An empty slot gets the game as it starts (saveData newGameSave), named; then it can be edited. */
  const newSave = async (slot: number) => {
    if (!disk || !target.gam) return;
    try {
      const save = newGameSave(disk, target.gam);
      await safety();
      await writeSlot(target.saveId, slot, save, NEW_SAVE_NAME);
      work.delete(slot);
      await reload();
      toast(`Slot ${slot + 1}: a new game, as it starts. Rename it or change anything; in the game, F6 loads it.`);
      render();
      main.querySelector<HTMLInputElement>(`#sv-name-${slot}`)?.select();
    } catch (e) {
      toast(`Could not make a new save: ${(e as Error).message}`, 'error');
    }
  };

  const removeSlot = async (slot: number) => {
    if (!(await confirmDialog('Delete this save?', `Slot ${slot + 1} will be empty. A backup is taken first, so it can be restored from Backups.`, 'Delete', true))) return;
    backedUp = false;
    await safety();
    await deleteSlot(target.saveId, slot);
    work.delete(slot);
    await reload();
    render();
  };

  // ------------------------------------------------------------------ high scores
  const renderScores = () => {
    const table = saves!.highScores;
    scores ??= table.entries.map((e) => ({ ...e }));
    const list = scores;
    const status = h('p', { class: 'sv-status', role: 'status' });
    const saveBtn = h('button', { type: 'button', class: 'primary', onclick: () => void commitScores() }, 'Save changes');
    const undoBtn = h('button', { type: 'button', onclick: () => ((scores = undefined), render()) }, 'Undo changes');
    const refreshState = () => {
      const dirty = dirtyScores();
      saveBtn.disabled = undoBtn.disabled = !dirty;
      const order = list.some((e, i) => i > 0 && e.score > list[i - 1].score) ? ' ⚠ Not highest first: the game puts a new score above the first lower one it finds, so use Sort by score.' : '';
      status.textContent = (dirty ? 'Not saved yet.' : saves!.highScoresFromDisk ? 'The table this game came with.' : '') + order;
      renderNav();
    };
    const rows = list.map((e, i) => {
      const warn = h('td', { class: 'sv-warn-cell', id: `sv-hs-${i}-warn` });
      const showWarn = () => {
        const w = highScoreWarnings(e);
        clear(warn, ...w.map((x) => h('span', null, '⚠ ', x)));
      };
      showWarn();
      return h(
        'tr',
        null,
        h('th', { scope: 'row' }, String(i + 1)),
        h(
          'td',
          null,
          h('input', {
            type: 'number',
            inputmode: 'numeric',
            min: SCORE_MIN,
            max: SCORE_MAX,
            step: 1,
            value: String(e.score),
            'aria-label': `Score, place ${i + 1}`,
            'aria-describedby': `sv-hs-${i}-warn`,
            onchange: (ev: Event) => {
              const t = ev.target as HTMLInputElement;
              const n = Math.trunc(Math.min(SCORE_MAX, Math.max(SCORE_MIN, Number(t.value) || 0)));
              e.score = n;
              t.value = String(n);
              showWarn();
              refreshState();
            },
          }),
        ),
        h(
          'td',
          null,
          h('input', {
            type: 'text',
            value: e.name,
            maxlength: 29,
            spellcheck: false,
            'aria-label': `Name, place ${i + 1}`,
            'aria-describedby': `sv-hs-${i}-warn`,
            oninput: (ev: Event) => {
              e.name = (ev.target as HTMLInputElement).value;
              showWarn();
              refreshState();
            },
          }),
        ),
        warn,
      );
    });
    clear(
      main,
      h(
        'header',
        { class: 'sv-head' },
        h('div', { class: 'sv-label-row' }, h('h3', { class: 'sv-title', tabindex: -1 }, 'High scores'), tip('the high scores', `The Top Ten screen shows a score in 10 columns and hides a score of 0. Players type up to ${HIGH_SCORE_NAME_MAX} letters; a new score goes in above every lower one, so keep the table highest first.`).el),
        h('p', { class: 'sv-where' }, saves!.highScoreFile ?? highScoreFileName(target.gam ?? 'game')),
      ),
      h(
        'div',
        { class: 'sv-tools', role: 'toolbar', 'aria-label': 'High scores' },
        saveBtn,
        undoBtn,
        h('button', { type: 'button', onclick: () => ((scores = sortHighScores(list)), render(), refreshState()) }, 'Sort by score'),
        h('button', { type: 'button', class: 'danger', onclick: () => ((scores = list.map(() => ({ score: 0, name: '' }))), render()) }, 'Clear table'),
      ),
      status,
      h(
        'div',
        { class: 'sv-table-wrap' },
        h(
          'table',
          { class: 'sv-scores' },
          h('caption', { class: 'sv-sr' }, 'Top ten scores'),
          h('thead', null, h('tr', null, h('th', { scope: 'col' }, '#'), h('th', { scope: 'col' }, 'Score'), h('th', { scope: 'col' }, 'Name'), h('th', { scope: 'col' }, h('span', { class: 'sv-sr' }, 'Warnings')))),
          h('tbody', null, rows),
        ),
      ),
    );
    refreshState();
  };

  const commitScores = async () => {
    if (!scores || !saves) return;
    await safety();
    await writeHighScores(target.saveId, saves.highScoreFile ?? highScoreFileName(target.gam ?? 'game'), { entries: scores, raw: saves.highScores.raw });
    scores = undefined;
    await reload();
    toast('High scores saved.');
    render();
  };

  // ------------------------------------------------------------------ backups
  const renderBackups = () => {
    const label = h('input', { type: 'text', id: 'sv-backup-label', placeholder: 'Label (optional)', maxlength: 60 }) as HTMLInputElement;
    const hasSaves = saves!.slots.some((s) => s.bytes) || !!saves!.highScoreFile && !saves!.highScoresFromDisk;
    const rows = backups.map((b) => {
      const when = new Date(b.when);
      const what = [b.slots.length ? `slot${b.slots.length === 1 ? '' : 's'} ${b.slots.map((s) => s + 1).join(', ')}` : null, b.names.some((n) => /\.his$/i.test(n)) ? 'high scores' : null, b.names.includes(FOUND_FILE) ? 'tin heart' : null, kb(b.bytes)].filter(Boolean).join(' · ');
      return h(
        'li',
        { class: 'sv-backup' },
        h(
          'div',
          { class: 'sv-backup-text' },
          h('span', { class: 'sv-backup-label' }, b.label, b.auto ? h('span', { class: 'sv-badge' }, 'auto') : null, b.by && b.by !== 'web' ? h('span', { class: 'sv-badge' }, b.by) : null),
          h('span', { class: 'sv-backup-meta' }, h('time', { datetime: when.toISOString() }, when.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })), ` · ${what}`),
        ),
        h(
          'div',
          { class: 'sv-backup-tools' },
          h(
            'button',
            {
              type: 'button',
              'aria-label': `Restore ${b.label}`,
              onclick: async () => {
                if (!(await confirmDialog('Restore this backup?', `The saves and high scores go back to “${b.label}”. What is there now is backed up first.`, 'Restore'))) return;
                await restoreBackup(b.id, { safety: true, by: 'web' });
                work.clear();
                scores = undefined;
                await reload();
                toast('Restored. In the game, F6 loads the saves.');
                render();
              },
            },
            'Restore',
          ),
          h(
            'button',
            {
              type: 'button',
              'aria-label': `Rename ${b.label}`,
              onclick: async () => {
                const name = await modal<string>('Rename backup', (close) => {
                  const input = h('input', { type: 'text', value: b.label, maxlength: 60, 'aria-label': 'Label', autofocus: true }) as HTMLInputElement;
                  return h(
                    'form',
                    { method: 'dialog', onsubmit: (e: Event) => (e.preventDefault(), close(input.value)) },
                    input,
                    h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), h('button', { class: 'primary' }, 'Rename')),
                  );
                });
                if (name?.trim()) await renameBackup(b.id, name);
              },
            },
            'Rename',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'danger',
              'aria-label': `Delete ${b.label}`,
              onclick: async () => {
                const full = await getBackup(b.id);
                await deleteBackup(b.id);
                undoNote(`Deleted “${b.label}”.`, async () => full && putBackup(full));
              },
            },
            'Delete',
          ),
        ),
      );
    });
    clear(
      main,
      h('header', { class: 'sv-head' }, h('h3', { class: 'sv-title', tabindex: -1 }, 'Backups'), h('p', { class: 'sv-where' }, 'Kept in this browser, as many as you like.')),
      h(
        'form',
        {
          class: 'sv-tools sv-backup-form',
          onsubmit: async (e: Event) => {
            e.preventDefault();
            const b = await backupNow(target.saveId, { label: label.value, by: 'web' });
            toast(b ? `Backed up: ${b.label}` : 'Nothing to back up yet: play and save first.');
          },
        },
        h('label', { class: 'sv-sr', for: 'sv-backup-label' }, 'Backup label'),
        label,
        h('button', { class: 'primary', disabled: !hasSaves }, 'Back up now'),
      ),
      rows.length ? h('ul', { class: 'sv-backups', 'aria-label': 'Backups, newest first' }, rows) : h('p', { class: 'sv-empty' }, 'No backups yet. One is taken by itself before your first change here.'),
    );
  };

  // ------------------------------------------------------------------ the whole
  const render = () => {
    if (!saves) return;
    renderNav();
    if (view === 'scores') renderScores();
    else if (view === 'backups') renderBackups();
    else renderSlot(view);
  };

  clear(main, h('p', { class: 'sv-empty' }, 'Loading the saves…'));
  const stopWatch = watchBackups(async () => {
    backups = await listBackups(target.saveId);
    if (view === 'backups') render();
    else renderNav();
  });
  // saved in another tab (or by the game): follow, unless something here is being changed
  const onSaves = async () => {
    if (anyDirty()) return;
    await reload();
    work.clear();
    scores = undefined;
    render();
  };
  window.addEventListener(SAVES_CHANGED, onSaves);

  keepView();
  const done = modal<void>(`Saves & scores: ${target.title}`, (close) => {
    void (async () => {
      try {
        disk = await target.files();
        labels = target.gam ? gameLabels(disk, target.gam) : undefined;
      } catch {
        /* names and pictures are a nicety */
      }
      await reload();
      // opened at a slot that is empty: the first saved one instead (unless asked for by address)
      if (initial === undefined && typeof view === 'number' && !saves!.slots[view].bytes) {
        const first = saves!.slots.find((s) => s.bytes);
        if (first) view = first.slot;
        else view = 'scores';
        keepView();
      }
      render();
    })().catch((e) => clear(main, h('p', { class: 'sv-empty' }, `Could not read the saves: ${(e as Error).message}`)));
    return [body, h('div', { class: 'buttons sv-close' }, sayEl, h('button', { type: 'button', onclick: () => void tryClose(close) }, 'Close'))];
  });
  const dlg = body.closest('dialog');
  dlg?.classList.add('sv-dialog');
  // Esc with unsaved changes asks first
  dlg?.addEventListener(
    'cancel',
    (e) => {
      if (!anyDirty()) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      void tryClose(() => dlg.querySelector<HTMLButtonElement>('.modal-close')?.click());
    },
    true,
  );
  const closeBtn = dlg?.querySelector<HTMLButtonElement>('.modal-close');
  closeBtn?.addEventListener(
    'click',
    (e) => {
      if (!anyDirty() || confirmed) return;
      e.stopImmediatePropagation();
      void tryClose(() => {
        confirmed = true;
        closeBtn.click();
      });
    },
    true,
  );
  let confirmed = false;
  // Chrome closes a dialog on a second Esc without a cancel event it lets us stop: open it again and ask
  dlg?.addEventListener('close', () => {
    if (!dlg.isConnected || confirmed) return;
    // shown again under any question already open
    const asked = document.querySelector<HTMLDialogElement>('dialog.modal[open]:not(.sv-dialog)');
    asked?.close();
    dlg.showModal();
    if (asked) asked.showModal();
    void tryClose(() => {
      confirmed = true;
      closeBtn?.click();
    });
  });
  let asking = false;
  async function tryClose(close: (v: undefined) => void) {
    if (asking) return;
    if (anyDirty()) {
      asking = true;
      const leave = await confirmDialog('Leave without saving?', 'Some changes here are not saved yet.', 'Leave', true);
      asking = false;
      if (!leave) return;
    }
    confirmed = true;
    close(undefined);
  }
  await done;
  stopWatch();
  window.removeEventListener(SAVES_CHANGED, onSaves);
  if (target.key) setHashParams({ saves: undefined }, ['game', target.key]);
}

function sameBytes(a: Uint8Array, b: Uint8Array | undefined): boolean {
  if (!b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** A notice with Undo, for a few seconds. */
function undoNote(message: string, undo: () => Promise<unknown>): void {
  document.querySelector('.sv-undo')?.remove();
  const done = () => {
    clearTimeout(timer);
    note.remove();
  };
  const note = h(
    'div',
    { class: 'sv-undo', role: 'status' },
    h('span', null, message),
    h('button', { type: 'button', onclick: () => void undo().then(done) }, 'Undo'),
    h('button', { type: 'button', 'aria-label': 'Dismiss', onclick: done }, '×'),
  );
  const timer = setTimeout(done, 10000);
  (document.querySelector('dialog.sv-dialog') ?? document.body).append(note);
}
