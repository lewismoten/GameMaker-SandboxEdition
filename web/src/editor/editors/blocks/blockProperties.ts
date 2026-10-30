// The selected native block's behavior panels; group painting changes pictures independently.
import { h, clear, numberField, checkField, selectField } from '../../core/ui';
import type { Project } from '../../core/project';
import { monsterBirthField } from '../../widgets/monsterBirthField';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { COUNTER_NAMES, namedCounterOptions } from '../character/counterNames';

const EFFECTS: [number, string][] = [
  [0, 'Nothing'],
  [1, 'Character lives'],
  [3, 'Character money'],
  ...Array.from({ length: 15 }, (_, i) => [i + 5, `Repetition count ${i + 1} (sequence ${i + 5})`] as [number, string]),
  ...Array.from({ length: 5 }, (_, i) => [i + 20, `Special counter ${i + 1}`] as [number, string]),
];

const SIDES: [number, string][] = [
  [SOLTOP, 'Top'],
  [SOLRIG, 'Right'],
  [SOLBOT, 'Bottom'],
  [SOLLEF, 'Left'],
];

export function blockProperties(o: {
  project: Project;
  file: string;
  kind: BlockKind;
  blocks: Block[];
  current: () => number;
  pal: () => Palette;
  changed: () => void;
  walkPaths?: { el: HTMLElement };
}) {
  const { project, file, kind, blocks, current, pal, changed, walkPaths } = o;
  const counterOptions = () => {
    const game = project.game();
    const uses = project.usesOf(file);
    const linked = [...new Set(uses.map((use) => game.scenes[use.scene]?.files[5]).filter((name) => name && project.files.has(name)))];
    const candidates = uses.length ? linked : project.files.byExtension('chr');
    const characters = uses.length || candidates.length === 1 ? candidates : [];
    return namedCounterOptions(
      EFFECTS,
      characters.map((name) => ({ file: name, names: project.extras<unknown>(name, COUNTER_NAMES, undefined) })),
    );
  };
  const props = h('div', { class: 'panel stack' });
  const walkingProps = h('div', { class: 'panel stack' });
  const touchProps = h('div', { class: 'panel stack' });
  const timeProps = h('div', { class: 'panel stack' });
  function renderProps(): void {
    const b = blocks[current()];
    const edit = (fn: () => void) => {
      fn();
      changed();
    };
    const sides = (labelText: string, get: () => number, set: (v: number) => void, title: string) =>
      h(
        'fieldset',
        { class: 'row', style: 'border:1px solid var(--border);border-radius:6px;gap:8px', title },
        h('legend', null, labelText),
        ...SIDES.map(([bit, name]) =>
          checkField(
            name,
            () => !!(get() & bit),
            (on) => edit(() => set(on ? get() | bit : get() & ~bit)),
          ),
        ),
      );
    const blockNum = (labelText: string, get: () => number, set: (v: number) => void, title: string) =>
      numberField(labelText, get, (v) => edit(() => set(v)), { min: 0, max: 255, title });
    const touch = [
      numberField(
        'Score points',
        () => b.scorePts,
        (v) => edit(() => (b.scorePts = v)),
        { min: -32768, max: 32767, title: 'Added to the score when touched' },
      ),
      numberField(
        'Hit points',
        () => b.chHitPt,
        (v) => edit(() => (b.chHitPt = v)),
        { min: -32768, max: 32767, title: 'Added to the character’s hit points when touched; negative hurts' },
      ),
      selectField(
        'Changes counter',
        counterOptions(),
        () => b.effect,
        (v) => edit(() => (b.effect = v)),
        'Which counter is changed when touched',
      ),
      numberField(
        'by',
        () => b.eamt,
        (v) => edit(() => (b.eamt = v)),
        { min: -32768, max: 32767 },
      ),
    ];
    if (kind === 'cbl') {
      clear(props, h('p', { class: 'hint' }, 'Character blocks are only pictures; the character file decides how they are used.'));
      return;
    }
    if (kind === 'mbl') {
      clear(
        props,
        h('h2', null, `Block ${current()}: when a monster showing this picture touches the character`),
        h(
          'details',
          null,
          h('summary', null, 'How hit points and monster power work'),
          h(
            'p',
            { class: 'hint' },
            'Hit points here are added to the character on contact; negative values hurt. Monster strength is Power in the monster file. A stronger monster can destroy a weaker one on pixel contact; equal powers survive. A weapon must have greater Power than its target. Touching the character can destroy monsters below Power 100; monsters at 100 or above remain. Indestructible monsters survive, and a destroyed monster can transform according to its monster-file settings. The character’s health still changes by this block’s hit-point effect.',
          ),
        ),
        sides(
          'Solid (pushes the character)',
          () => b.solid,
          (v) => (b.solid = v),
          'Sides of the monster the character cannot pass through',
        ),
        h('div', { class: 'grid-fields' }, ...touch),
      );
      return;
    }
    clear(
      walkingProps,
      h('h2', null, `Block ${current()}: walking`),
      sides(
        'Solid sides',
        () => b.solid,
        (v) => (b.solid = v),
        'The character cannot pass through these sides',
      ),
      sides(
        'Gravity pulls',
        () => b.grav,
        (v) => (b.grav = v),
        'While on this block the character accelerates in these directions',
      ),
      walkPaths?.el,
    );
    clear(
      touchProps,
      h('h2', null, `Block ${current()}: touch`),
      checkField(
        'Can be picked up (object)',
        () => !!b.obj,
        (on) => edit(() => (b.obj = on ? 1 : 0)),
        'Goes into the inventory with the pick-up sequence',
      ),
      h(
        'div',
        { class: 'grid-fields' },
        ...touch,
        blockNum(
          'Becomes block',
          () => b.touchBl,
          (v) => (b.touchBl = v),
          'Set to this block’s own number to stay the same',
        ),
      ),
    );
    clear(
      timeProps,
      h('h2', null, `Block ${current()}: time`),
      h(
        'div',
        { class: 'grid-fields' },
        blockNum(
          'Changes into block',
          () => b.nextBl,
          (v) => (b.nextBl = v),
          'Animation: set to its own number for no animation',
        ),
        numberField(
          'after ticks (1/18 s)',
          () => b.ntime,
          (v) => edit(() => (b.ntime = v)),
          { min: 0, max: 32767, time: { rate: 18.2, zero: 'No timed change' } },
        ),
        monsterBirthField(
          project,
          file,
          () => b.birthMon,
          (value) => edit(() => (b.birthMon = value)),
          pal,
        ),
        numberField(
          'every ticks (0 = never)',
          () => b.birthTime,
          (v) => edit(() => (b.birthTime = v)),
          { min: 0, max: 16383, time: { rate: 18.2, zero: 'No births' } },
        ),
      ),
    );
  }

  return { props, walkingProps, touchProps, timeProps, render: renderProps };
}
