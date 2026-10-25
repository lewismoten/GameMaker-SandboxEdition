// The integrator's "📝 Instruction card…" (on the start scene) and "🪧 Level card…" (on a level):
// a few lines from the designer, the keys from the game's own characters, and a preview of the
// pages as PLAYGAME shows them. The card is saved as the game's own files (cardWire.ts), so DOS
// and every export show it; the integrator saves the scene afterwards.
import './cards.css';
import { h, modal, toast } from '../../core/ui';
import type { Project } from '../../core/project';
import type { Game, Scene } from '../../../formats/game';
import { addCard, INSTRUCTIONS_SLOT, INTRO_SLOT } from './cardWire';
import { CARD_LINES, instructionLines, keyLines, levelCardLines, pagesOf, playOrder } from './cardText';

let count = 0;

/** A labelled text box; `rows` above 1 makes it a textarea. */
function box(label: string, value: string, hint: string, rows = 1, onInput: () => void = () => undefined): { el: HTMLElement; get: () => string } {
  const id = `card-${++count}`;
  const input =
    rows > 1
      ? h('textarea', { id, rows, spellcheck: true, 'aria-describedby': `${id}-hint`, oninput: onInput })
      : h('input', { id, type: 'text', maxLength: 90, spellcheck: true, 'aria-describedby': `${id}-hint`, oninput: onInput });
  input.value = value;
  return {
    el: h('div', { class: 'card-field' }, h('label', { for: id }, label), input, h('small', { id: `${id}-hint`, class: 'hint' }, hint)),
    get: () => input.value,
  };
}

/** The preview: the lines in pages of 16, as the game cuts them, and how many pages that is. */
function preview(): { el: HTMLElement; show: (lines: string[], most: number) => void } {
  const pre = h('pre', { class: 'card-preview', 'aria-label': 'The card as the game shows it', tabindex: 0 });
  const note = h('p', { class: 'hint', 'aria-live': 'polite' });
  return {
    el: h('div', { class: 'card-preview-wrap' }, pre, note),
    show(lines, most) {
      const pages = pagesOf(lines);
      pre.textContent = Array.from({ length: pages }, (_, i) => lines.slice(i * CARD_LINES, (i + 1) * CARD_LINES).join('\n')).join('\n──── MORE... ────\n');
      note.textContent = `${pages} page${pages === 1 ? '' : 's'}${pages > most ? `: more than ${most}, and most players skip the rest. Trim it?` : '.'}`;
      note.classList.toggle('card-long', pages > most);
    },
  };
}

function plainBox(): { el: HTMLElement; get: () => boolean } {
  const input = h('input', { type: 'checkbox', checked: true });
  return {
    el: h('label', { class: 'check' }, input, h('span', null, 'Show it on a plain light backdrop, so the text always reads well')),
    get: () => input.checked,
  };
}

async function save(project: Project, scene: Scene, slot: number, stem: string, lines: string[], plain: boolean, seconds?: number): Promise<boolean> {
  const before = scene.files[slot];
  const files = addCard(project, scene, slot, stem, lines, plain, seconds);
  toast(`Made ${files.map((f) => f.toUpperCase()).join(', ')}${before ? `; ${before.toUpperCase()} is still in the game` : ''}.`);
  return true;
}

/** Resolves true when the start scene's instructions changed. */
export async function instructionCardDialog(project: Project, start: Scene): Promise<boolean> {
  const view = preview();
  const lines = () =>
    instructionLines({
      title: start.desc ? `How to play ${start.desc.trim()}` : 'How to play',
      goal: goal.get(),
      keys: keys.get(),
      dangers: dangers.get(),
      items: items.get(),
    });
  const update = () => view.show(lines(), 3);
  const goal = box('Your goal, in a line', '', 'What the player is there to do: “Find the three keys and open the vault.”', 1, update);
  const keys = box(
    'Keys',
    keyLines(project.files).join('\n'),
    'From the game’s characters. Name the keys as the player knows them; leave out any secret.',
    5,
    update,
  );
  const dangers = box('Watch out for', '', 'What hurts, one per line, and what to do about it.', 3, update);
  const items = box('Items', '', 'What each thing to pick up does, one per line: “Battery: one more life.”', 3, update);
  const plain = plainBox();
  update();
  const had = start.files[INSTRUCTIONS_SLOT];
  const ok = await modal<boolean>('Instruction card', (close) =>
    h(
      'form',
      {
        class: 'stack card-dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          close(true);
        },
      },
      h(
        'p',
        { class: 'hint' },
        `The goal first, then the keys, the dangers and the items, with F1, F2, F5 and F6 at the end. Saved as the game’s own files${had ? `, in place of ${had.toUpperCase()} in the instructions slot` : ' in the instructions slot'}.`,
      ),
      h('div', { class: 'card-columns' }, h('div', { class: 'stack' }, goal.el, keys.el, dangers.el, items.el, plain.el), view.el),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Make the card'),
      ),
    ),
  );
  if (!ok) return false;
  return save(project, start, INSTRUCTIONS_SLOT, 'howto', lines(), plain.get());
}

/** Resolves true when the level's intro changed. */
export async function levelCardDialog(project: Project, game: Game, n: number): Promise<boolean> {
  const scene = game.scenes[n];
  const order = playOrder(game);
  const at = order.indexOf(n) + 1;
  const view = preview();
  const lines = () => levelCardLines({ name: name.get(), number: Number(num.value) || 0, total: Number(total.value) || 0, goal: goal.get(), hint: hint.get() });
  const update = () => view.show(lines(), 1);
  const name = box('Level name', scene.desc.trim(), 'The card’s heading.', 1, update);
  const num = h('input', { type: 'number', min: 0, max: 99, value: String(at), oninput: update });
  const total = h('input', { type: 'number', min: 0, max: 99, value: String(order.length), oninput: update });
  const goal = box('Goal', '', 'What to do here, in a line or two.', 2, update);
  const hint = box('Hint (optional)', '', 'The card shows again after every death, so a hint here helps the player who keeps failing.', 2, update);
  const seconds = h('input', { type: 'number', min: 0, max: 60, value: '5' });
  const plain = plainBox();
  update();
  const had = scene.files[INTRO_SLOT];
  const ok = await modal<boolean>('Level card', (close) =>
    h(
      'form',
      {
        class: 'stack card-dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          close(true);
        },
      },
      h(
        'p',
        { class: 'hint' },
        `Shown each time the level starts. Players like to know how far they are: the numbers count the levels in the order play meets them. Saved as the game’s own files${had ? `, in place of ${had.toUpperCase()} as the level’s intro` : ', as the level’s intro'}.`,
      ),
      h(
        'div',
        { class: 'card-columns' },
        h(
          'div',
          { class: 'stack' },
          name.el,
          h(
            'div',
            { class: 'card-row' },
            h('label', { class: 'field' }, h('span', null, 'Level'), num),
            h('label', { class: 'field' }, h('span', null, 'of'), total),
            h('label', { class: 'field' }, h('span', null, 'Seconds on screen (0: until a key)'), seconds),
          ),
          goal.el,
          hint.el,
          plain.el,
        ),
        view.el,
      ),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Make the card'),
      ),
    ),
  );
  if (!ok) return false;
  const secs = Math.max(0, Math.min(60, Math.round(Number(seconds.value) || 0)));
  return save(project, scene, INTRO_SLOT, `card${n}`, lines(), plain.get(), secs || undefined);
}
