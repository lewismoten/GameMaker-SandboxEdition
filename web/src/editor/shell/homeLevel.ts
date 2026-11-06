// The Starters tab's "Level" picker: all levels, or one stage by its course-number hundreds (100s First Steps,
// 200s Moving and Pushing, ...). The stages and numbers come from project/ceremonies.ts. The choice is
// remembered in this browser. 0 means all levels.
import { h } from '../core/ui';
import { CEREMONIES, courseNumber } from '../../project/ceremonies';

export const LEVEL_KEY = 'gm-starter-level';

/** The levels that have courses: 1 to the number of stages. */
export const LEVELS: number[] = CEREMONIES.map((_, i) => i + 1);

/** The level saved in this browser, or 0 (all) when none or unknown. */
export function savedLevel(): number {
  try {
    const n = Number(localStorage.getItem(LEVEL_KEY));
    return LEVELS.includes(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Whether a Starter shows under the level: all show; else only the courses of that stage. */
export const levelShown = (level: number, id: string): boolean => level === 0 || Math.floor((courseNumber(id) ?? 0) / 100) === level;

/** Whether a graduation (by game id) shows under the level: its own stage's; the diploma (no stage) only under all levels. */
export const levelShowsCeremony = (level: number, id: string): boolean => level === 0 || CEREMONIES.findIndex((c) => c.id === id) + 1 === level;

/** The "Level" picker; `onChange` hears the new level, already remembered. */
export function levelFilterBox(now: number, onChange: (level: number) => void): HTMLLabelElement {
  return h(
    'label',
    { class: 'lib-sort lib-level' },
    'Level ',
    h(
      'select',
      {
        onchange: (e: Event) => {
          const n = Number((e.target as HTMLSelectElement).value);
          try {
            localStorage.setItem(LEVEL_KEY, String(n));
          } catch {
            /* not remembered */
          }
          onChange(n);
        },
      },
      h('option', { value: '0', selected: now === 0 }, 'All levels'),
      ...LEVELS.map((n) => h('option', { value: String(n), selected: now === n }, `${n * 100}s · ${CEREMONIES[n - 1].stage}`)),
    ),
  );
}
