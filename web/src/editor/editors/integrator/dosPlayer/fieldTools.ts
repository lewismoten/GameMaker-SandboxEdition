// The small button group beside a DOS player field: Hide (words only) and Reset to the original.
// Both are line-drawn icons with a label and title naming the field; each button is a 24px+ target.
import { h } from '../../../core/ui';

const NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  eye: ['M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z', 'M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z'],
  eyeOff: ['M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z', 'M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z', 'M4 4l16 16'],
  reset: ['M4 12a8 8 0 1 0 2.6-5.9', 'M4 4v4.5h4.5'],
} as const;

function icon(name: keyof typeof ICONS): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24',
    width: '16',
    height: '16',
    'aria-hidden': 'true',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }))
    svg.setAttribute(k, v);
  for (const d of ICONS[name]) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

interface FieldTools {
  el: HTMLElement;
  /** Shows the buttons' states again: Reset off at the original, Hide pressed while hidden. */
  update: () => void;
}

export interface FieldToolsOptions {
  /** The field's name, as the labels say it. */
  name: string;
  /** Whether the field already has its original value. */
  atOriginal: () => boolean;
  reset: () => void;
  locked?: boolean;
  /** For words: whether the field is hidden now, and a way to hide or show it. */
  hide?: { hidden: () => boolean; toggle: () => void };
}

/** Hide (if it applies) and Reset, as one compact group. */
export function fieldTools({ name, atOriginal, reset, locked, hide }: FieldToolsOptions): FieldTools {
  const resetLabel = `Reset ${name} to the original`;
  const resetBtn = h('button', { type: 'button', class: 'dp-tool', title: resetLabel, 'aria-label': resetLabel, onclick: reset }, icon('reset'));
  const hideLabel = `Hide ${name}`;
  const hideBtn = hide
    ? h(
        'button',
        {
          type: 'button',
          class: 'dp-tool',
          title: `${hideLabel}: write spaces instead, which the player draws as nothing (as Builder did)`,
          'aria-label': hideLabel,
          'aria-pressed': 'false',
          onclick: hide.toggle,
        },
        icon('eye'),
      )
    : null;
  const update = () => {
    resetBtn.disabled = !!locked || atOriginal();
    if (hideBtn && hide) {
      const on = hide.hidden();
      hideBtn.setAttribute('aria-pressed', String(on));
      hideBtn.replaceChildren(icon(on ? 'eyeOff' : 'eye'));
      hideBtn.disabled = !!locked;
    }
  };
  update();
  return { el: h('span', { class: 'dp-tools', role: 'group', 'aria-label': `${name}: tools` }, hideBtn, resetBtn), update };
}
