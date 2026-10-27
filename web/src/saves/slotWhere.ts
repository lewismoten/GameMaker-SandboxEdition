// "Where" in a saved game: the level picker, the whole level around the hero (drag him, or look
// around) and the block he stands on, for one slot of the Saves & scores panel.
import { h } from '../editor/core/ui';
import { changeSaveLevel, GROUP_LABELS, levelLabel, moveSaveHero, saveLevels, saveMap, type SavedGame } from '../project/saveData';
import { saveMapView, type MapView } from './saveMapView';
import { tip } from './tip';
import type { Panel, WorkSlot } from './panelState';

/** How the map works, for its aria-describedby and the About dialog. */
export const MAP_HELP =
  'Drag the hero to move him: his feet snap to a block, and he fits where that block and the one above it are open (green; red where something solid is in the way). A click on the map puts him there too. Drag anywhere else (or with the middle button, or Shift+drag) to look around the whole level; it wraps around at its edges, as the game’s map does. Pinch or Ctrl+wheel zooms. Keys, with the map focused: the arrow keys move him to the next block he fits in that way, Shift+arrows look around (Ctrl+Shift+arrows by 8 blocks), C centers on him, + and − zoom, 0 shows the screen F6 opens on (the dashed frame).';
export const LEVEL_HELP =
  'A new level starts where the game enters it, with its items and monsters fresh; score, lives, items and counters stay. Level start enters the level again from its start the same way.';

/** The level picker, the whole level around the hero (drag him, or look around), and his block. */
export function whereGroup(p: Panel, slot: number, w: WorkSlot, changed: () => void): HTMLElement {
  const { labels, disk, whereSay, cameras, mapCache, main } = p;
  const save = w.save;
  const gam = p.target.gam;
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
    p.render();
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
    levels.some((l) => l.scene === save.doscene)
      ? null
      : h(
          'option',
          { value: String(save.doscene), selected: true, disabled: true },
          labels?.sceneName(save.doscene) ? `Level ${save.doscene}: ${labels.sceneName(save.doscene)}` : `Level ${save.doscene}`,
        ),
  );
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
}
