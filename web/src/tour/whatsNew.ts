// "What's new": the tour steps added since a visitor's last visit (steps.ts `since`), and the
// visit's day is `seenDay.ts`.
// The day itself is in seenDay.ts. The ? menu offers these steps (tourButton.ts).
import { CHAPTERS } from './chapters/index';
import { isDay } from './seenDay';
import type { Chapter, TourStep } from './steps';

/** The most steps one "What's new" tour plays; the CHANGELOG has the rest. */
export const MAX_NEW_STEPS = 8;

export interface NewStep {
  chapter: string;
  step: TourStep;
}

/**
 * The steps with a `since` after `seen`, newest first (ties keep tour order), at most `max`.
 * A `seen` that is not a day gives none, so a damaged value offers nothing.
 */
export function whatsNew(seen: string | null, chapters: readonly Chapter[] = CHAPTERS, max = MAX_NEW_STEPS): NewStep[] {
  if (!isDay(seen ?? undefined)) return [];
  const out: NewStep[] = [];
  for (const chapter of chapters) for (const step of chapter.steps) if (isDay(step.since) && step.since > seen!) out.push({ chapter: chapter.id, step });
  return out.sort((a, b) => (a.step.since! < b.step.since! ? 1 : a.step.since! > b.step.since! ? -1 : 0)).slice(0, max);
}

/**
 * The chapters to play for the steps `whatsNew` found: each chapter's opening 'enter' step,
 * the nearest earlier step that moves to another view (`go`) so the target is on the page, the
 * new step, and the chapter's closing 'exit' step. Steps whose target is missing are skipped by
 * the engine, as for any optional step.
 */
export function newChapters(news: readonly NewStep[], chapters: readonly Chapter[] = CHAPTERS): Chapter[] {
  const out: Chapter[] = [];
  for (const c of chapters) {
    const mine = new Set(news.filter((n) => n.chapter === c.id).map((n) => n.step.id));
    if (!mine.size) continue;
    const keep = new Set<string>();
    c.steps.forEach((s, i) => {
      if (!mine.has(s.id)) return;
      keep.add(s.id);
      for (let j = i - 1; j >= 0; j--)
        if (c.steps[j].go) {
          keep.add(c.steps[j].id);
          break;
        }
    });
    const first = c.steps[0];
    const last = c.steps[c.steps.length - 1];
    if (first?.action === 'enter') keep.add(first.id);
    if (last?.action === 'exit') keep.add(last.id);
    out.push({ ...c, steps: c.steps.filter((s) => keep.has(s.id)) });
  }
  return out;
}
