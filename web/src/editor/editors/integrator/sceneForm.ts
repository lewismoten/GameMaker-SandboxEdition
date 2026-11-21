// Integrator selected-scene fields and actions, preserving GAM writes and save ordering.
import { fromCp437, toCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import {
  GRAPHIC_EXTS,
  NOSCENE,
  SCENEDESCLEN,
  emptyScene,
  fileSlotsFor,
  sceneKind,
  slotExtensions,
  type Game,
  type Scene,
} from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { h, clear, textField, selectField, confirmDialog } from '../../core/ui';
import type { Project, FileKind } from '../../core/project';
import { fileField } from '../../widgets/filePicker';
import { upTo } from '../../widgets/limitNote';
import { linksPanel } from './sceneLinks';

interface SceneFormContext {
  project: Project;
  game: Game;
  selected: number;
  panel: HTMLElement;
  save: () => void;
  draw: () => void;
  renderSide: () => void;
  renderPanel: () => void;
  playFrom: (scene: number) => void;
  sceneOptions: () => [number, string][];
  songButton: (file: string) => HTMLButtonElement;
}

export function renderSceneForm(ctx: SceneFormContext): void {
  const { project, game, panel, save, draw, renderSide, renderPanel, playFrom, sceneOptions, songButton } = ctx;
  const s: Scene | undefined = game.scenes[ctx.selected];
  if (!s) {
    clear(panel);
    return;
  }
  const kind = sceneKind(s);
  const slots = fileSlotsFor(s);
  const exts = slotExtensions(s);
  const scrollOpt: [number, string][] = [
    [0xff, 'Scroll when the character nears the edge'],
    [0, 'Never scroll'],
  ];
  const changed = () => (save(), draw());
  clear(
    panel,
    h(
      'div',
      { class: 'panel stack' },
      h(
        'h2',
        { style: 'margin:0' },
        kind === 'start' ? 'Start scene (title & menu)' : kind === 'end' ? 'End scene (game won / lost)' : `Level scene #${ctx.selected}`,
      ),
      textField(
        `Description (the start scene’s is the game title; ${upTo(SCENEDESCLEN - 1)})`,
        () => fromCp437(s.desc),
        (v) => ((s.desc = toCp437(v).slice(0, SCENEDESCLEN - 1)), (s.descRaw = undefined), save(), draw(), renderSide()),
        { maxLength: SCENEDESCLEN - 1 },
      ),
      kind === 'adventure' && s.files[1]
        ? h(
            'a',
            {
              class: 'button',
              href: `#/p/${project.id}/${encodeURIComponent(s.files[1].toLowerCase())}?generate=1`,
              title: 'Open this level’s map and generate a layout from its background blocks',
            },
            'Generate level layout…',
          )
        : null,
      kind === 'start'
        ? h(
            'div',
            { class: 'toolbar' },
            h(
              'button',
              {
                onclick: () => void import('../../widgets/uploadChecklist').then((m) => m.uploadChecklist(project)),
                title: 'The guide’s Appendix B, ticked where the level check can tell',
              },
              '☑ Before you upload…',
            ),
            h(
              'button',
              {
                onclick: () => void import('../../widgets/walkDialog').then((m) => m.walkDialog(project)),
                title: 'Let a bot play the whole game and keep it as a walkthrough to watch or save as a video',
              },
              '🤖 Record a walkthrough…',
            ),
            h(
              'button',
              {
                onclick: async () => {
                  const { openingDialog } = await import('../../tools/opening/openingDialog');
                  if (!(await openingDialog(project, s, game.scenes))) return;
                  save();
                  draw();
                  renderSide();
                  renderPanel();
                },
                title:
                  'Add, swap or remove the opening that plays before the title: a “Made with Game-Maker: Sandbox Edition” intro or the classic RSD one, and a “presents” card',
              },
              '🎬 Create opening files…',
            ),
            h(
              'button',
              {
                onclick: async () => {
                  const { instructionCardDialog } = await import('../../tools/cards/cardDialog');
                  if (!(await instructionCardDialog(project, s))) return;
                  save();
                  renderSide();
                  renderPanel();
                },
                title: 'Make the instructions from the game’s own keys, with the goal, the dangers and the items, on a backdrop that always reads well',
              },
              '📝 Create instructions…',
            ),
          )
        : null,
      kind === 'adventure' || kind === 'unused'
        ? h(
            'div',
            { class: 'toolbar' },
            kind === 'adventure'
              ? h(
                  'button',
                  { class: 'primary', onclick: () => playFrom(ctx.selected), title: 'Play this level straight away, without the title and menu' },
                  '▶ Play from here',
                )
              : null,
            kind === 'adventure'
              ? h(
                  'button',
                  {
                    onclick: async () => {
                      const { levelCardDialog } = await import('../../tools/cards/cardDialog');
                      if (!(await levelCardDialog(project, game, ctx.selected))) return;
                      save();
                      renderSide();
                      renderPanel();
                    },
                    title: 'Make the card shown as the level starts: its name, “level 3 of 10”, the goal and a hint (it shows again after every death)',
                  },
                  '🪧 Create level intro…',
                )
              : null,
            h(
              'button',
              {
                class: 'danger',
                onclick: async () => {
                  if (!(await confirmDialog('Delete scene', `Delete “${fromCp437(s.desc)}” and every link to it?`, 'Delete'))) return;
                  for (const other of game.scenes) for (const l of other.links) if (l.toScene === ctx.selected) l.toScene = NOSCENE;
                  game.scenes[ctx.selected] = emptyScene();
                  ctx.selected = 0;
                  save();
                  draw();
                  renderSide();
                  renderPanel();
                },
              },
              'Delete scene',
            ),
          )
        : null,
    ),
    h(
      'div',
      { class: 'panel' },
      h('h2', { style: 'margin-top:0' }, 'Files'),
      h(
        'div',
        { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(190px,1fr))' },
        ...slots.map((label, i) => {
          const field = fileField(
            project,
            label,
            (exts[i] === 'graphic' ? GRAPHIC_EXTS : [exts[i]]) as FileKind[],
            () => s.files[i] ?? '',
            (v) => {
              s.files[i] = v;
              save();
              draw();
              renderSide();
              renderPanel();
            },
          );
          const file = s.files[i];
          return exts[i] === 'cmf' && file && project.files.has(file) ? h('div', { class: 'grator-song-field' }, field, songButton(file)) : field;
        }),
      ),
    ),
    kind === 'adventure'
      ? h(
          'div',
          { class: 'panel' },
          h('h2', { style: 'margin-top:0' }, 'Scrolling'),
          h(
            'div',
            { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(230px,1fr))' },
            ...(['up', 'down', 'left', 'right'] as const).map((d) =>
              selectField(
                d[0].toUpperCase() + d.slice(1),
                scrollOpt,
                () => (s.scroll[d] === 0 ? 0 : 0xff),
                (v) => ((s.scroll[d] = v), save()),
              ),
            ),
          ),
        )
      : null,
    kind === 'end' ? null : linksPanel({ project, game, scene: ctx.selected, sceneOptions, changed, rerender: renderPanel }, s, kind),
  );
}
