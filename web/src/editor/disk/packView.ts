// The Optimize dialog's "Pack with reserved palettes": a button that looks for more savings by
// reserving color ranges for monsters and characters (the project's, or proposed ones) and reducing
// colors to fit them, then shows what it would do, what it saves and how far scenes would draw from
// now, with one button to apply all of it (the dialog makes the checkpoint and the undo step).
import { FLAG_MEAN, FLAG_WORST } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';
import { h } from '../core/ui';
import { kb, plural } from './diskCard';
import type { PackMode, PackPlan } from './packAll';

const LABEL = { monster: 'monsters', character: 'characters', background: 'backgrounds' } as const;

/** The two ways to pack, each found separately (`'none'` when the tool found nothing to do in that way). */
export interface PackSet {
  all: PackPlan | 'none';
  sprites: PackPlan | 'none';
}

const MODES: { mode: PackMode; label: string; what: string }[] = [
  { mode: 'all', label: 'All block types', what: 'backgrounds, monsters and characters' },
  { mode: 'sprites', label: 'Monsters and characters only', what: 'background blocks and their pixels are never touched' },
];

const summary = (p: PackPlan | 'none'): string =>
  p === 'none'
    ? 'nothing to pack'
    : `${plural(p.units.length, 'step')}, saves ${kb(p.saves)}${p.delta.changed ? `, delta E mean ${p.delta.mean.toFixed(1)} worst ${p.delta.worst.toFixed(1)}` : ', no scene draws differently'}`;

/** `set` is undefined before the person asks. */
export function packView(
  set: PackSet | undefined,
  mode: PackMode,
  setMode: (m: PackMode) => void,
  busy: boolean,
  find: () => void,
  apply: (p: PackPlan) => void,
  /** The button makes an optimized copy instead of changing this game (a game open to look at only). */
  asCopy = false,
): HTMLElement {
  const body: (HTMLElement | null)[] = [];
  const plan = set?.[mode];
  if (set === undefined || busy) {
    body.push(
      h(
        'p',
        null,
        'Monster blocks, character blocks and their palettes often keep files apart because the colors differ from scene to scene. This reserves a range of color numbers for each (your reservations, or ones it proposes), moves each file’s colors into it, then looks for files that can join. Looking takes a moment and changes nothing.',
      ),
      h('button', { type: 'button', disabled: busy, onclick: find }, busy ? 'Looking…' : 'Look for more savings'),
    );
  } else if (set.all === 'none' && set.sprites === 'none') {
    body.push(
      h(
        'p',
        null,
        'Nothing more to pack: reserved ranges would free no more space than the steps above, or the game has no monster or character blocks to reserve for.',
      ),
      h('button', { type: 'button', onclick: find }, 'Look again'),
    );
  } else if (plan !== undefined) {
    body.push(
      h(
        'fieldset',
        { class: 'disk-pack-mode' },
        h('legend', null, 'Pack'),
        ...MODES.map((m) =>
          h(
            'label',
            { class: 'disk-pack-choice' },
            h<'input'>('input', { type: 'radio', name: 'disk-pack-mode', value: m.mode, checked: mode === m.mode, onchange: () => setMode(m.mode) }),
            h('span', null, h('strong', null, ` ${m.label}`), ` (${m.what}): ${summary(set[m.mode])}`),
          ),
        ),
      ),
    );
    if (plan === 'none') {
      body.push(h('p', null, 'Nothing to pack in this way.'), h('button', { type: 'button', onclick: find }, 'Look again'));
      return h('div', { class: 'disk-reserve disk-pack' }, h('h3', null, 'Pack with reserved palettes'), ...body);
    }
    const flag = plan.delta.mean > FLAG_MEAN || plan.delta.worst > FLAG_WORST;
    const reds = plan.units.filter((u) => u.kind !== 'merge').length;
    body.push(
      h(
        'p',
        null,
        `${plural(plan.units.length, 'step')} would give back ${kb(plan.saves)}${plan.extra > 0 ? `, ${kb(plan.extra)} more than the files-that-can-share steps above` : ''}. ${plan.proposed ? `It reserves ${plan.roles.map((r) => `${LABEL[r.role]} ${r.first}-${r.last}`).join(' and ')} (saved to the project).` : `It works with your reservations: ${plan.roles.map((r) => `${LABEL[r.role]} ${r.first}-${r.last}`).join(', ')}.`}`,
      ),
      reds
        ? h(
            'p',
            null,
            plan.delta.changed
              ? `${reds} step${reds === 1 ? '' : 's'} change colors: ${plural(plan.delta.changed, 'map pixel')} would draw differently (delta E mean ${plan.delta.mean.toFixed(1)}, worst ${plan.delta.worst.toFixed(1)})${flag ? '; that is more than the tool usually calls a small change, so look at each step’s blocks first' : ''}.`
              : `${reds} step${reds === 1 ? '' : 's'} move colors without changing how any scene draws.`,
          )
        : null,
      h('ol', { class: 'disk-steps' }, ...plan.units.map((u) => h('li', { class: 'disk-step' }, u.title))),
      ...plan.stuck.map((s) => h('p', { class: 'hint' }, `${s}.`)),
      h(
        'button',
        { type: 'button', class: 'primary', onclick: () => apply(plan) },
        asCopy
          ? `Make an optimized copy (${plural(plan.units.length, 'step')}, saves ${kb(plan.saves)})`
          : `Apply ${plural(plan.units.length, 'step')} (saves ${kb(plan.saves)})`,
      ),
      h('button', { type: 'button', onclick: find }, 'Look again'),
    );
  }
  return h('div', { class: 'disk-reserve disk-pack' }, h('h3', null, 'Pack with reserved palettes'), ...body);
}
