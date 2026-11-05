// The Quick color check: a short, skippable game of "which tile looks different?" that only
// suggests Color help settings. It says plainly that it is not a medical test, saves nothing but
// the settings the person accepts, and never keeps the answers.
import { h, modal } from '../core/ui';
import { setColorHelp, type ColorHelp } from './colorHelpPrefs';
import { SCREENS, isHit, suggest, type Answer } from './quickCheckLogic';

const css = ([r, g, b]: number[]) => `rgb(${r},${g},${b})`;
const WARN_TEXT = { rg: 'red and green', by: 'blue and yellow', both: 'red and green, and blue and yellow', off: '' };

export function openQuickCheck(): Promise<unknown> {
  return modal<boolean>('Quick color check', (close) => {
    const answers: Answer[] = [];
    const body = h('div', { class: 'qc-body' });
    const show = (...c: Node[]) => {
      body.replaceChildren(...c);
      body.querySelector<HTMLElement>('button')?.focus();
    };

    const intro = () =>
      show(
        h('p', null, 'Six short screens: pick the tile that looks different from the others. If you cannot tell, say so. That is fine.'),
        h(
          'p',
          { class: 'color-help-note' },
          'This is not a medical test and does not say anything about your eyes. It only suggests settings that may help when you pick colors. Nothing is saved except settings you choose to turn on.',
        ),
        h(
          'div',
          { class: 'qc-actions' },
          h('button', { type: 'button', onclick: () => screen(0) }, 'Start'),
          h('button', { type: 'button', onclick: () => close(false) }, 'Skip'),
        ),
      );

    const screen = (n: number) => {
      const s = SCREENS[n];
      const answer = (a: Answer) => {
        answers[n] = a;
        if (n + 1 < SCREENS.length) screen(n + 1);
        else result();
      };
      const tiles = Array.from({ length: 9 }, (_, i) =>
        h('button', {
          type: 'button',
          class: 'qc-tile',
          style: `background:${css(i === s.at ? s.odd : s.base)}`,
          'aria-label': `Tile ${i + 1} of 9`,
          onclick: () => answer(i),
        }),
      );
      show(
        h('p', null, h('strong', null, `${n + 1} of ${SCREENS.length}. `), 'Which tile looks different from the others?'),
        h('div', { class: 'qc-grid', role: 'group', 'aria-label': 'Tiles' }, ...tiles),
        h(
          'div',
          { class: 'qc-actions' },
          h('button', { type: 'button', onclick: () => answer(-1) }, 'I can’t tell'),
          h('button', { type: 'button', onclick: () => close(false) }, 'Skip the rest'),
        ),
      );
    };

    const result = () => {
      const found = SCREENS.filter((s, i) => isHit(s, answers[i])).length;
      const s = suggest(answers);
      if (!s) {
        show(
          h('p', null, `You found ${found} of ${SCREENS.length}. Nothing to suggest. The Color help settings are still there any time you want them.`),
          h('div', { class: 'qc-actions' }, h('button', { type: 'button', onclick: () => close(false) }, 'Done')),
        );
        return;
      }
      const picks = {
        names: h('input', { type: 'checkbox', checked: true }),
        warn: h('input', { type: 'checkbox', checked: true }),
        preview: h('input', { type: 'checkbox', checked: true }),
      };
      show(
        h('p', null, `You found ${found} of ${SCREENS.length}. These settings may help. Choose the ones you want.`),
        h('label', { class: 'check' }, picks.names, h('span', null, 'Show color names')),
        h('label', { class: 'check' }, picks.warn, h('span', null, `Warn me about look-alike colors (${WARN_TEXT[s.warn!]})`)),
        h('label', { class: 'check' }, picks.preview, h('span', null, 'Preview as others might see it')),
        h('p', { class: 'color-help-note' }, 'Not a medical test. Your answers are not kept.'),
        h(
          'div',
          { class: 'qc-actions' },
          h(
            'button',
            {
              type: 'button',
              onclick: () => {
                const on: Partial<ColorHelp> = {};
                if (picks.names.checked) on.names = true;
                if (picks.warn.checked) on.warn = s.warn;
                if (picks.preview.checked) on.preview = s.preview;
                if (Object.keys(on).length) setColorHelp(on);
                close(true);
              },
            },
            'Turn on what I chose',
          ),
          h('button', { type: 'button', onclick: () => close(false) }, 'No thanks'),
        ),
      );
    };
    intro();
    return body;
  });
}
