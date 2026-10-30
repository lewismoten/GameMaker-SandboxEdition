// Select a native animation frame, paint one or both halves, and preview live CBL pixels.
import { h, clear, selectField, numberField } from '../../core/ui';
import type { Project } from '../../core/project';
import { CHARBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { paletteCss, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { viewState } from '../../../urlState';
import { animPlayer } from './animPlayer';
import { characterAnimations, characterFrameView, type CharacterFrameView } from './characterFrameModel';
import './characterFramesPanel.css';

export interface CharacterFramesPanel {
  controls: HTMLElement;
  preview: HTMLElement;
  animationBlocks(): readonly number[];
  followBlock(block: number): void;
  start(block: number): void;
  leave(): void;
  redraw(): void;
  dispose(): void;
}

export function characterFramesPanel(o: {
  project: Project;
  file: string;
  blocks: Block[];
  palette(): Palette;
  edit(view: CharacterFrameView): void;
  relatedChanged(): void;
}): CharacterFramesPanel {
  const animations = characterAnimations(o.project, o.file);
  const view = viewState(['p', o.project.id, o.file]);
  let selected = animations.findIndex((animation) => animation.file === view.get('character') && animation.sequence === view.num('sequence'));
  if (selected < 0) selected = 0;
  let position = Math.max(0, animations[selected]?.frames.findIndex((frame) => frame.index === view.num('frame')) ?? 0);
  let size: 1 | 2 = view.num('frameSize') === 2 ? 2 : 1;
  let half: 0 | 1 = view.get('half') === 'bottom' ? 1 : 0;
  let active = false;
  const prefs = o.project.extras<{ color?: unknown; background?: unknown } | null>(o.file, 'characterPainter', {});
  let color = typeof prefs?.color === 'number' && Number.isInteger(prefs.color) && prefs.color >= 0 && prefs.color <= 255 ? prefs.color : 0;
  let background = prefs?.background === 'map' ? 'map' : 'color';
  const hasMaps = o.project.game().scenes.some((scene) => scene.gametype === ADVTYPE && o.project.files.has(scene.files[1]));
  if (!hasMaps) background = 'color';
  const backdropSlot = h('div');
  let backdrop: ReturnType<(typeof import('../character/characterStage'))['stageBackdrop']> | undefined;
  let backdropFile = '';
  let disposed = false;
  const player = animPlayer({
    blocks: () => o.blocks,
    pal: () => o.palette(),
    transparent: true,
    label: 'Live character animation while painting',
    scale: 2,
    stage: {
      width: 120,
      height: 80,
      draw(ctx) {
        if (background === 'map' && backdrop?.draw(ctx)) return;
        ctx.fillStyle = paletteCss(o.palette(), color);
        ctx.fillRect(0, 0, 120, 80);
      },
    },
  });
  const hint = h('p', { class: 'meta' });
  const counter = h('span', { class: 'meta', 'aria-live': 'polite' });
  const previous = h(
    'button',
    { type: 'button', 'aria-label': 'Previous character frame', title: 'Previous frame in this animation', onclick: () => move(-1) },
    '◀',
  );
  const next = h('button', { type: 'button', 'aria-label': 'Next character frame', title: 'Next frame in this animation', onclick: () => move(1) }, '▶');
  const animationChoice = selectField(
    'Character animation',
    animations.map((animation, i) => [i, animation.label]),
    () => selected,
    (value) => {
      selected = value;
      position = 0;
      activate();
    },
  );
  const sizeChoice = selectField<1 | 2>(
    'Paint size',
    [
      [1, '1 × 1 block'],
      [2, '1 × 2 character'],
    ],
    () => size,
    (value) => {
      size = value;
      activate();
    },
  );
  const halfChoice = selectField<0 | 1>(
    'Block to edit',
    [
      [0, 'Top half'],
      [1, 'Bottom half'],
    ],
    () => half,
    (value) => {
      half = value;
      activate();
    },
  );
  const saveBackground = () => {
    o.project.setExtras(o.file, 'characterPainter', { color, background });
    player.redraw();
  };
  const backgroundChoice = selectField(
    'Preview background',
    [
      ['color', 'Palette color'],
      ['map', 'Map scene'],
    ],
    () => background,
    (value) => {
      background = value;
      saveBackground();
      refreshBackground();
    },
  );
  const backgroundColor = numberField(
    'Preview palette color',
    () => color,
    (value) => {
      color = value;
      saveBackground();
    },
    { min: 0, max: 255 },
  );
  backgroundChoice.querySelector<HTMLOptionElement>('option[value="map"]')!.disabled = !hasMaps;
  function refreshBackground(): void {
    backgroundColor.hidden = background !== 'color';
    backdropSlot.hidden = background !== 'map';
    const animation = animations[selected];
    if (background === 'map' && animation && backdropFile !== animation.file) {
      const file = animation.file;
      backdropFile = file;
      backdrop = undefined;
      clear(backdropSlot, h('small', { class: 'meta' }, 'Loading map scenes…'));
      void import('../character/characterStage')
        .then(({ stageBackdrop }) => {
          if (disposed || backdropFile !== file) return;
          backdrop = stageBackdrop(o.project, file, 120, 80, () => player.redraw());
          const grid = backdrop.el.querySelector<HTMLOptionElement>('option[value="-1"]');
          if (grid) grid.disabled = grid.hidden = true;
          clear(backdropSlot, backdrop.el);
          refreshBackground();
          player.redraw();
        })
        .catch(() => {
          if (!disposed && backdropFile === file)
            clear(backdropSlot, h('small', { class: 'meta' }, 'Map preview could not be loaded. Choose Palette color to keep previewing.'));
        });
    }
    // Map mode starts on actual scenery; palette mode already supplies a plain backdrop.
    const select = backdropSlot.querySelector('select');
    if (background === 'map' && select?.value === '-1' && select.options.length > 1) {
      select.value = select.options[1].value;
      select.dispatchEvent(new Event('change'));
    }
  }
  function refresh(): void {
    const animation = animations[selected];
    animationChoice.querySelector('select')!.value = String(selected);
    sizeChoice.querySelector('select')!.value = String(size);
    halfChoice.querySelector('select')!.value = String(half);
    halfChoice.hidden = size === 2;
    editButton.hidden = active;
    if (!animation) {
      hint.textContent = 'Link a character and this block set in a game scene to edit its animation frames.';
      return;
    }
    const record = animation.frames[position];
    const options = halfChoice.querySelectorAll('option');
    options[0].disabled = record.frame.pic1 >= CHARBL;
    options[1].disabled = record.frame.pic2 >= CHARBL;
    counter.textContent = `Frame ${record.index + 1} · ${position + 1} of ${animation.frames.length} pictures`;
    previous.disabled = position === 0;
    next.disabled = position === animation.frames.length - 1;
    hint.textContent = active
      ? 'The dashed outlines mark blocks used in this animation.'
      : 'Choose a frame or paint size to edit the character as it appears in the game.';
    refreshBackground();
    player.show([animation.clip], record.frame.pic1 < CHARBL ? record.frame.pic1 : record.frame.pic2, record.tick);
  }
  function activate(): void {
    const animation = animations[selected];
    if (!animation) return;
    const frame = animation.frames[position].frame;
    if ((half ? frame.pic2 : frame.pic1) >= CHARBL) half = half ? 0 : 1;
    const edit = characterFrameView(animation, position, size, half);

    active = true;
    view.set({
      character: animation.file,
      sequence: animation.sequence,
      frame: animation.frames[position].index,
      frameSize: size,
      half: half ? 'bottom' : 'top',
    });
    o.edit(edit);
    refresh();
    o.relatedChanged();
  }
  function move(delta: number): void {
    position = Math.max(0, Math.min(animations[selected].frames.length - 1, position + delta));
    activate();
  }
  const editButton = h('button', { type: 'button', disabled: !animations.length, onclick: activate }, 'Edit selected frame');
  const controls = h(
    'section',
    { class: 'panel character-frame-controls', 'aria-label': 'Character frame editing' },
    h('h2', null, 'Character frames'),
    animationChoice,
    h('div', { class: 'row' }, previous, counter, next),
    h('div', { class: 'row' }, sizeChoice, halfChoice),
    editButton,
    hint,
  );
  const preview = h(
    'section',
    { class: 'panel character-frame-preview', 'aria-label': 'Character animation preview' },
    h('h2', null, 'Live character'),
    player.el,
    backgroundChoice,
    backgroundColor,
    backdropSlot,
  );
  preview.hidden = !animations.length;
  for (const element of controls.querySelectorAll<HTMLSelectElement | HTMLButtonElement>('select,button')) element.disabled = !animations.length;
  refresh();
  return {
    controls,
    preview,
    animationBlocks: () => (active ? (animations[selected]?.blocks ?? []) : []),
    followBlock(block) {
      if (!animations.length) return;
      const current = animations[selected];
      const record = current?.frames[position]?.frame;
      let index =
        record && (record.pic1 === block || record.pic2 === block)
          ? position
          : (current?.frames.findIndex(({ frame }) => frame.pic1 === block || frame.pic2 === block) ?? -1);
      if (index < 0) {
        const candidate = animations.findIndex((animation) => animation.blocks.includes(block));
        if (candidate < 0) {
          active = false;
          refresh();
          hint.textContent = 'This block is not used by a linked character animation.';
          o.relatedChanged();
          return;
        }
        selected = candidate;
        index = animations[selected].frames.findIndex(({ frame }) => frame.pic1 === block || frame.pic2 === block);
      }
      position = index;
      const frame = animations[selected].frames[position].frame;
      if ((half ? frame.pic2 : frame.pic1) !== block) half = frame.pic1 === block ? 0 : 1;
      activate();
    },
    start(block) {
      if (view.get('character') && animations[selected]) activate();
      else this.followBlock(block);
    },
    leave() {
      active = false;
      refresh();
      o.relatedChanged();
    },
    redraw: () => player.redraw(),
    dispose: () => {
      disposed = true;
      player.dispose();
    },
  };
}
