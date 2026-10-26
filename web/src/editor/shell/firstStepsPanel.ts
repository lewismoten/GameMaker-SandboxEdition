// The "First steps" panel: a small window over the editor's corner that lists the beginner's
// steps (firstSteps.ts) and ticks each one the moment the game changes. Each step opens the
// file to do it in and links to the guide. It never blocks the editor: close it and the 🎓
// button beside Play Game brings it back. Loaded only for games that have the checklist.
import './firstSteps.css';
import { h, clear } from '../core/ui';
import type { Project } from '../core/project';
import { unlockAchievement } from '../../achievements';
import { STEPS, firstStepsState, stepsDone, updateFirstSteps, type Step } from './firstSteps';

export interface FirstStepsNav {
  /** Opens a file in the workspace. */
  open: (file: string) => void;
  /** Starts a play test from the title screen. */
  play: () => void;
  /** Opens Before You Upload (the next checklist). */
  upload: () => void;
}

export interface FirstStepsPanel {
  /** The 🎓 button for beside Play Game (re-made with the sidebar). */
  button: () => HTMLButtonElement;
  toggle: (open?: boolean) => void;
  dispose: () => void;
}

export function firstStepsPanel(project: Project, nav: FirstStepsNav): FirstStepsPanel | undefined {
  if (!firstStepsState(project)) return undefined;
  let done = STEPS.map(() => false);
  let buttons: HTMLButtonElement[] = [];
  const heading = h('h2', { id: 'fs-title' }, 'First steps');
  const count = h('span', { class: 'fs-count' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const list = h('ol', { class: 'fs-list' });
  const foot = h('div', { class: 'fs-foot' });
  const panel = h(
    'section',
    { class: 'fs-panel', id: 'fs-panel', 'aria-labelledby': 'fs-title', hidden: true },
    h(
      'header',
      { class: 'fs-head' },
      heading,
      count,
      h(
        'button',
        {
          type: 'button',
          class: 'fs-close',
          'aria-label': 'Close First steps',
          title: 'Close (🎓 beside Play Game opens it again)',
          onclick: () => toggle(false),
        },
        '×',
      ),
    ),
    h('p', { class: 'hint fs-lead' }, 'Make the starter game your own. Each step ticks itself when you do it.'),
    list,
    foot,
    live,
  );
  document.body.append(panel);

  const fileFor = (s: Step): string | undefined => {
    if (s.open === 'gam') return project.gam;
    if (s.open === 'play') return undefined;
    for (const kind of s.open) {
      const f = project.files.byExtension(kind)[0];
      if (f) return f;
    }
    return undefined;
  };

  const go = (s: Step) => {
    if (s.open === 'play') nav.play();
    else {
      const f = fileFor(s);
      if (f) nav.open(f);
    }
  };

  function render(): void {
    const n = done.filter(Boolean).length;
    count.textContent = `${n} of ${STEPS.length}`;
    // only the next step to do says how, so the panel stays small
    const next = done.indexOf(false);
    clear(
      list,
      ...STEPS.map((s, i) =>
        h(
          'li',
          { class: `fs-step${done[i] ? ' fs-done' : ''}${i === next ? ' fs-next' : ''}`, 'aria-current': i === next ? 'step' : undefined },
          h('span', { class: 'fs-tick', 'aria-hidden': 'true' }, done[i] ? '✓' : s.icon),
          h(
            'div',
            { class: 'fs-text' },
            h('strong', null, s.title, h('span', { class: 'sr-only' }, done[i] ? ' (done)' : ' (to do)')),
            i === next ? h('small', null, s.how) : null,
          ),
          h(
            'div',
            { class: 'fs-actions' },
            s.open === 'play' || fileFor(s)
              ? h(
                  'button',
                  { type: 'button', title: s.open === 'play' ? 'Play test the game' : `Open ${fileFor(s)}`, onclick: () => go(s) },
                  s.open === 'play' ? 'Play' : 'Open',
                  h('span', { class: 'sr-only' }, `: ${s.title}`),
                )
              : null,
            s.guide
              ? h(
                  'a',
                  {
                    class: 'fs-guide',
                    href: `./#/help/ultimate?chapter=${s.guide.chapter}`,
                    target: '_blank',
                    rel: 'noopener',
                    title: `The Ultimate Owner’s Guide: ${s.guide.section} (opens in a new tab)`,
                    'aria-label': `Read about it in the guide: ${s.guide.section} (opens in a new tab)`,
                  },
                  '📒',
                )
              : null,
          ),
        ),
      ),
    );
    clear(
      foot,
      n === STEPS.length
        ? h(
            'p',
            { class: 'fs-all' },
            '🎉 Every step done: it’s your game now. When it’s ready, ',
            h('button', { type: 'button', class: 'fs-link', onclick: () => nav.upload() }, 'go through Before You Upload'),
            '.',
          )
        : null,
    );
    for (const b of buttons) syncButton(b);
  }

  const syncButton = (b: HTMLButtonElement) => {
    const n = done.filter(Boolean).length;
    // the name holds the visible count ("First steps, 3/10 done")
    clear(
      b,
      h('span', { 'aria-hidden': 'true' }, '🎓 '),
      h('span', { class: 'sr-only' }, 'First steps, '),
      n === STEPS.length ? '✓' : `${n}/${STEPS.length}`,
      h('span', { class: 'sr-only' }, ' done'),
    );
    b.setAttribute('aria-expanded', String(!panel.hidden));
  };

  /** Re-judges every step; says which ones just got done. */
  const refresh = (announce: boolean) => {
    const state = firstStepsState(project);
    if (!state) return;
    let now: boolean[];
    try {
      now = stepsDone(project, state);
    } catch {
      return; // a game file mid-edit that does not parse: judge it next time
    }
    const newly = STEPS.filter((_, i) => now[i] && !done[i]);
    done = now;
    if (announce && newly.length) live.textContent = `Done: ${newly.map((s) => s.title).join(', ')}.`;
    if (done.every(Boolean) && !state.done) {
      updateFirstSteps(project, { done: true });
      unlockAchievement('first-steps');
    }
    render();
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(() => refresh(true), 300);
  };
  const offFiles = project.onChange(later);
  const offExtras = project.onExtrasChange(later);

  function toggle(open = panel.hidden): void {
    panel.hidden = !open;
    if (open) updateFirstSteps(project, { seen: true });
    for (const b of buttons) syncButton(b);
  }

  refresh(false);
  // it opens by itself the first time a new starter game is opened
  if (!firstStepsState(project)?.seen) toggle(true);

  return {
    button: () => {
      const b = h('button', {
        type: 'button',
        class: 'fs-toggle',
        'aria-controls': 'fs-panel',
        title: 'First steps: a checklist for making the starter game your own',
        onclick: () => toggle(),
      });
      buttons = [...buttons.filter((x) => x.isConnected), b];
      syncButton(b);
      return b;
    },
    toggle,
    dispose: () => {
      clearTimeout(timer);
      offFiles();
      offExtras();
      panel.remove();
    },
  };
}
