// The panel an import shows from the moment files are picked or dropped: the file's name, the
// step it is at (reading, unpacking, finding the game, opening), a progress bar, and the file
// being unpacked (n of m). It also guards the import: while one runs, another can't start.
// A status line read aloud changes at each step and every fifth of the files, not on every file.
import { h, modal } from '../core/ui';
import './importChooser.css';

/** The steps in the order they come; the bar fills a quarter at each. */
const STEPS = ['Reading', 'Unpacking', 'Finding the game', 'Opening'] as const;
export type ImportStep = (typeof STEPS)[number];

export interface ImportPanel {
  /** Moves to a step; `detail` says what it is doing, `done` of `total` how far through that step. */
  step(step: ImportStep, detail?: string, done?: number, total?: number): Promise<void>;
  /** Stops the panel when the import is over (or hands over to another dialog). */
  end(): void;
  /** Shows what went wrong, to dismiss. */
  fail(message: string): void;
  readonly signal: AbortSignal;
}

let running = false;
/** True while an import has its panel open. */
export const importRunning = () => running;

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** What the files are called, for the panel: one name, or the first and how many more. */
export function pickedLabel(names: string[]): string {
  return names.length > 1 ? `${names[0]} and ${names.length - 1} more` : (names[0] ?? 'your files');
}

/** Opens the panel at once; undefined when an import is already running. */
export function openImportPanel(label: string): ImportPanel | undefined {
  if (running) return undefined;
  running = true;
  const ctl = new AbortController();
  const bar = h('progress', { max: '4', value: '0', 'aria-label': 'Import progress' });
  const name = h('p', { class: 'ic-line' }, h('strong', null, label));
  const line = h('p', { class: 'ic-line', 'aria-hidden': 'true' }, 'Reading…');
  const status = h('p', { class: 'vh', role: 'status', 'aria-live': 'polite' }, `Reading ${label}`);
  const buttons = h('div', { class: 'buttons' });
  let ended = false;
  let finish: (() => void) | undefined;
  let spoke = -1;
  let last = 0;

  void modal<void>('Importing', (close) => {
    finish = () => {
      if (ended) return;
      ended = true;
      running = false;
      close(undefined);
    };
    buttons.append(h('button', { type: 'button', onclick: () => (ctl.abort(), finish?.()) }, 'Cancel'));
    return h('div', { class: 'ic-work' }, name, line, bar, status, buttons);
  }).finally(() => {
    ended = true;
    running = false;
    ctl.abort();
  });

  return {
    signal: ctl.signal,
    async step(step, detail, done, total) {
      if (ended) return;
      const at = STEPS.indexOf(step);
      const inside = total && done !== undefined ? Math.min(1, done / total) : 0;
      bar.value = at + inside;
      const where = total ? ` (${done! + 1} of ${total})` : '';
      line.textContent = `Step ${at + 1} of ${STEPS.length}: ${step}${detail ? ` ${detail}` : ''}${where}`;
      // read aloud at each step, and at each fifth of a step's files
      const mark = at * 10 + (total ? Math.floor(inside * 5) : 0);
      if (mark !== spoke) {
        spoke = mark;
        status.textContent = `${step}${detail ? ` ${detail}` : ''}${total ? `, ${Math.round(inside * 100)} percent` : ''}`;
      }
      // let the page draw between files
      const now = performance.now();
      if (now - last > 50) {
        last = now;
        await tick();
      }
    },
    end: () => finish?.(),
    fail(message) {
      if (ended) return;
      line.textContent = 'The import stopped.';
      status.textContent = `The import stopped. ${message}`;
      bar.hidden = true;
      buttons.replaceChildren(
        h('p', { class: 'ic-line', role: 'alert' }, message),
        h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => finish?.() }, 'OK'),
      );
    },
  };
}
