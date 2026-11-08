// The Starters tab's "done" marks: a check pill over the thumbnail of each Starter played to its
// ending (the achievements record's 'finished' set, which the web player, play.html, the desk and
// the DOS page all fill when the Game Won scene shows), a count in each group heading, and a
// "Show" picker (All, Not done yet, Done, Graduations) remembered in this browser; Done also shows the earned
// graduations and Not done yet the open and locked ones (homeGraduations.ts gradShowFor). A Starter not done yet but
// started shows its letter grade (project/grades.ts) in the same pill, in place of "Done".
import { h } from '../core/ui';
import { loadAchievements } from '../../achievements/store';
import type { Grade } from '../../project/grades';

export type DoneFilter = 'all' | 'todo' | 'done' | 'grad';
export const DONE_FILTER_KEY = 'gm-starter-done-filter';
const FILTERS: DoneFilter[] = ['all', 'todo', 'done', 'grad'];

export function savedDoneFilter(): DoneFilter {
  try {
    const v = localStorage.getItem(DONE_FILTER_KEY);
    return FILTERS.includes(v as DoneFilter) ? (v as DoneFilter) : 'all';
  } catch {
    return 'all';
  }
}

/** The ids of the catalog games played to the ending. */
export async function loadFinished(): Promise<Set<string>> {
  return new Set((await loadAchievements().catch(() => undefined))?.sets.finished ?? []);
}

/** Whether an ordinary Starter shows under the filter (the Graduations filter shows none of them). */
export const doneShown = (f: DoneFilter, done: boolean): boolean => f === 'all' || (f !== 'grad' && (f === 'done') === done);

/** "3 of 7 done" for a group heading. */
export const doneCount = (done: number, total: number): string => `${done} of ${total} done`;

/** The "Show" picker; `onChange` hears the new filter, already remembered. */
export function doneFilterBox(now: DoneFilter, onChange: (f: DoneFilter) => void): HTMLLabelElement {
  const names: Record<DoneFilter, string> = { all: 'All Starters', todo: 'Not done yet', done: 'Done', grad: 'Graduations' };
  return h(
    'label',
    { class: 'lib-sort lib-done' },
    'Show ',
    h(
      'select',
      {
        onchange: (e: Event) => {
          const f = (e.target as HTMLSelectElement).value as DoneFilter;
          try {
            localStorage.setItem(DONE_FILTER_KEY, f);
          } catch {
            /* not remembered */
          }
          onChange(f);
        },
      },
      ...FILTERS.map((f) => h('option', { value: f, selected: now === f }, names[f])),
    ),
  );
}

/** The pill's words for a Starter: "Done" when finished, else its letter grade when it was started, else nothing. */
export function pillText(done: boolean, grade: Grade | undefined): string | undefined {
  return done ? 'Done' : grade;
}

/** Puts the done mark (or, with a `grade`, the letter grade of a Starter started but not finished) over a Starter's picture, and says it to screen readers. */
export function doneTile(tile: HTMLElement, grade?: Grade): void {
  if (grade) {
    tile
      .querySelector('.tile-shot')
      ?.append(
        h(
          'span',
          { class: 'tile-done tile-grade', title: `Grade ${grade}` },
          h('span', { 'aria-hidden': 'true' }, grade),
          h('span', { class: 'sr-only' }, `Grade ${grade}`),
        ),
      );
    return;
  }
  const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  check.setAttribute('viewBox', '0 0 16 16');
  check.setAttribute('width', '14');
  check.setAttribute('height', '14');
  check.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M3 8.5 6.5 12 13 4.5');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  check.append(path);
  tile.dataset.done = '1';
  tile
    .querySelector('.tile-shot')
    ?.append(h('span', { class: 'tile-done', title: 'Completed' }, check, h('span', {}, 'Done'), h('span', { class: 'sr-only' }, ', Completed')));
}
