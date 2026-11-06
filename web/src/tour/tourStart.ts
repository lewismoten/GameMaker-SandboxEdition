// The tour's download (loaded only when asked for, by tourButton.ts): starting a chapter or
// the whole tour, and the hosts waiting in the corner of a page the visitor turned them on for.
import { h } from '../editor/core/ui';
import { Actor, loadSprites } from './actor';
import { CHAPTERS } from './chapters/index';
import { editorChapterIds } from './editorChoice';
import { setAllGuides } from './tourPages';
import { readSeen, writeSeen } from './seenDay';
import { Tour, tourPlaying } from './tourEngine';
import type { PageKey } from './steps';
import { newChapters, whatsNew } from './whatsNew';

/**
 * Plays the whole tour ('all'), what's new since the last visit ('new', whatsNew.ts), chapters by id ('dos', or 'desk,dos'), or (no id) the chapter
 * for `page` (on the editor page: the overview and the sub-chapter for the open editor). `cont`: carrying on from another page (the whole tour, gone on to the DOS page).
 */
export function startTour(which: string | undefined, opts: { record?: boolean; page?: PageKey; cont?: boolean } = {}): void {
  hideDock();
  if (which === 'new') {
    const chapters = newChapters(whatsNew(readSeen())).map((c) => ({ ...c, steps: c.steps.filter((st) => !st.pageOnly) }));
    if (!chapters.length) return;
    // finished or closed, the offer is answered: it comes back only for steps added after today
    void new Tour(chapters, {
      onEnd: () => {
        writeSeen();
        if (dockFor) void showDock(dockFor);
      },
    }).start();
    return;
  }
  const ids = which?.split(',') ?? (opts.page === 'editor' ? editorChapterIds(location.hash) : undefined);
  const chosen = which === 'all' ? CHAPTERS : CHAPTERS.filter((c) => (ids ? ids.includes(c.id) : c.page === opts.page));
  if (!chosen.length) return;
  // more than one page: what another page says (Settings has the theme) is left to that page
  const whole = chosen.length > 1 || !!opts.cont;
  const chapters = whole ? chosen.map((c) => ({ ...c, steps: c.steps.filter((s) => !s.pageOnly) })) : chosen;
  void new Tour(chapters, { record: opts.record, cont: opts.cont, onEnd: () => (dockFor ? showDock(dockFor) : undefined) }).start();
}

let dock: { el: HTMLElement; hosts: Actor[] } | undefined;
let dockFor: PageKey | undefined;

/** Teddy and Gwinn waiting at the corner of the page, offering its tour. */
export async function showDock(page: PageKey): Promise<void> {
  dockFor = page;
  if (tourPlaying() || dock || !CHAPTERS.some((c) => c.page === page)) return;
  const sprites = await loadSprites();
  if (dockFor !== page || dock || tourPlaying()) return;
  const hosts = (['teddy', 'gwinn'] as const).flatMap((id) => {
    const s = sprites.get(id);
    return s ? [new Actor(s, 2, false)] : [];
  });
  hosts[0]?.face(false);
  const el = h(
    'aside',
    { class: 'tour-dock', 'aria-label': 'Guides' },
    h(
      'div',
      { class: 'tour-dock-talk' },
      h('button', { type: 'button', class: 'primary', onclick: () => startTour(undefined, { page }) }, 'Show me around'),
      h(
        'button',
        {
          type: 'button',
          class: 'tour-dock-x',
          'aria-label': 'Stop the guides waiting on every page',
          title: 'Stop the guides waiting on every page (the ? menu or the Tour switch brings them back)',
          // closing them is a "no thanks" for the whole site, so they don't come back on the next page
          onclick: () => {
            setAllGuides(false);
            hideDock(true);
          },
        },
        '×',
      ),
    ),
    h('div', { class: 'tour-dock-hosts', 'aria-hidden': 'true' }, ...hosts.map((a) => a.el)),
  );
  document.body.append(el);
  dock = { el, hosts };
}

/** Puts the waiting guides away (another page, the guides turned off, or a tour starting). */
export function hideDock(forget = false): void {
  if (forget) dockFor = undefined;
  for (const a of dock?.hosts ?? []) a.dispose();
  dock?.el.remove();
  dock = undefined;
}
