// "Saves & scores": a game's saved games and high-score table, opened and changed from the home
// page (a cheat sheet and an inspector in one). Each of the ten slots shows its fields with the
// engine's limits and plain warnings, Max all, Undo, export and import of the .sav, and delete;
// the high-score table can be edited; backups can be taken, restored and deleted. The first
// change in a visit backs the saves up first, as SAVEHACK does on the desk PC.
//
// The address keeps which part is open (#/game/<key>?saves=3, ?saves=scores, ?saves=backups).
// This file opens the dialog and keeps the panel's state; the list on the left (panelNav), a slot
// (slotView), the high scores (scoresView) and the backups (backupsView) draw from it.
import './savesPanel.css';
import { h, clear, modal } from '../editor/core/ui';
import { setHashParams } from '../urlState';
import { SAVES_CHANGED } from '../project/storage';
import { unlockAchievement } from '../achievements';
import { backupNow, gameLabels, listBackups, loadGameSaves, SAVE_SLOTS, serializeSave, watchBackups } from '../project/saveData';
import type { Panel, SavesTarget, View } from './panelState';
import { renderNav } from './panelNav';
import { renderSlot } from './slotView';
import { renderScores } from './scoresView';
import { renderBackups } from './backupsView';
import { closeGuard } from './closeGuard';

const viewParam = (v: View) => (typeof v === 'number' ? String(v + 1) : v);
function parseView(s: string | undefined): View {
  if (s === 'scores' || s === 'backups') return s;
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= SAVE_SLOTS ? n - 1 : 0;
}

/** Opens the panel for a game; `initial` is an address value (a slot number, 'scores', 'backups'). */
export async function openSaves(target: SavesTarget, initial?: string): Promise<void> {
  unlockAchievement('saves-panel');

  // messages show in the dialog's footer (a toast would sit under the dialog's backdrop)
  const sayEl = h('p', { class: 'sv-say', role: 'status', 'aria-live': 'polite' });
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  const nav = h('nav', { class: 'sv-nav', 'aria-label': 'Save slots, high scores and backups' });
  const main = h('section', { class: 'sv-main', 'aria-live': 'off' });
  const body = h('div', { class: 'sv' }, nav, main);
  const keepView = () => target.key && setHashParams({ saves: viewParam(p.view) }, ['game', target.key]);

  const p: Panel = {
    target,
    view: parseView(initial),
    backups: [],
    work: new Map(),
    backedUp: false,
    openUnlimited: new Set(),
    whereSay: new Map(),
    cameras: new Map(),
    mapCache: new WeakMap(),
    main,
    toast: (message, kind = 'info') => {
      sayEl.textContent = message;
      sayEl.classList.toggle('error', kind === 'error');
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => (sayEl.textContent = ''), kind === 'error' ? 10000 : 6000);
    },
    render: () => {
      if (!p.saves) return;
      p.renderNav();
      if (p.view === 'scores') renderScores(p);
      else if (p.view === 'backups') renderBackups(p);
      else renderSlot(p, p.view);
    },
    renderNav: () => renderNav(p, nav),
    go: (v) => {
      p.view = v;
      keepView();
      p.render();
      main.querySelector<HTMLElement>('.sv-title')?.focus({ preventScroll: true });
    },
    reload: async () => {
      p.saves = await loadGameSaves(target.saveId, { gam: target.gam ?? undefined, disk: p.disk ?? undefined });
      p.backups = await listBackups(target.saveId);
    },
    safety: async () => {
      if (p.backedUp) return;
      p.backedUp = true;
      await backupNow(target.saveId, { label: 'Before changes in Saves & scores', auto: true, by: 'web' });
    },
    dirtySlot: (slot) => {
      const w = p.work.get(slot);
      const s = p.saves?.slots[slot];
      if (!w || !s?.save) return false;
      return w.name !== s.name || !sameBytes(serializeSave(w.save), s.bytes);
    },
    dirtyScores: () => !!p.scores && !!p.saves && JSON.stringify(p.scores) !== JSON.stringify(p.saves.highScores.entries),
  };
  const anyDirty = () => [...p.work.keys()].some((slot) => p.dirtySlot(slot)) || p.dirtyScores();

  clear(main, h('p', { class: 'sv-empty' }, 'Loading the saves…'));
  const stopWatch = watchBackups(async () => {
    p.backups = await listBackups(target.saveId);
    if (p.view === 'backups') p.render();
    else p.renderNav();
  });
  // saved in another tab (or by the game): follow, unless something here is being changed
  const onSaves = async () => {
    if (anyDirty()) return;
    await p.reload();
    p.work.clear();
    p.scores = undefined;
    p.render();
  };
  window.addEventListener(SAVES_CHANGED, onSaves);

  keepView();
  const guard = closeGuard(anyDirty);
  const done = modal<void>(`Saves & scores: ${target.title}`, (close) => {
    void (async () => {
      try {
        p.disk = await target.files();
        p.labels = target.gam ? gameLabels(p.disk, target.gam) : undefined;
      } catch {
        /* names and pictures are a nicety */
      }
      await p.reload();
      // opened at a slot that is empty: the first saved one instead (unless asked for by address)
      if (initial === undefined && typeof p.view === 'number' && !p.saves!.slots[p.view].bytes) {
        const first = p.saves!.slots.find((s) => s.bytes);
        if (first) p.view = first.slot;
        else p.view = 'scores';
        keepView();
      }
      p.render();
    })().catch((e) => clear(main, h('p', { class: 'sv-empty' }, `Could not read the saves: ${(e as Error).message}`)));
    return [body, h('div', { class: 'buttons sv-close' }, sayEl, h('button', { type: 'button', onclick: () => void guard.tryClose(close) }, 'Close'))];
  });
  const dlg = body.closest('dialog');
  dlg?.classList.add('sv-dialog');
  guard.attach(dlg);
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
