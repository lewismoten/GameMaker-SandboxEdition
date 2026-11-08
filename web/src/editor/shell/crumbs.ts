// The path above an open file: Overview › Maps › bus2.map, each step a button back to it, and,
// when the file was opened from another one (a "Used by" link, Open in…), a button that goes back
// to that file. It does what the browser's Back does, and shows where Back would land.
import './crumbs.css';
import { h } from '../core/ui';
import { KIND_LABELS, kindOf } from '../core/project';

interface CrumbActions {
  overview: () => void;
  category: () => void;
  /** Where the file was opened from, if the history entry says so. */
  from?: string;
  back: () => void;
}

/** The breadcrumb line for `file`. It keeps one line's height, so the title below never moves. */
export function crumbs(file: string, go: CrumbActions): HTMLElement {
  const kind = kindOf(file);
  const sep = () => h('span', { class: 'crumb-sep', 'aria-hidden': 'true' }, '›');
  const step = (label: string, title: string, run: () => void) => h('button', { type: 'button', class: 'crumb', title, onclick: run }, label);
  const trail = h(
    'ol',
    { class: 'crumb-list' },
    h('li', null, step('Overview', 'Back to the Overview of every file', go.overview)),
    h('li', null, sep(), step(KIND_LABELS[kind], `All ${KIND_LABELS[kind].toLowerCase()} files`, go.category)),
    h('li', { 'aria-current': 'page' }, sep(), h('span', { class: 'crumb-here' }, file)),
  );
  const nav = h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, trail);
  if (go.from) nav.append(h('button', { type: 'button', class: 'crumb crumb-back', title: `Go back to ${go.from}`, onclick: go.back }, `‹ Back to ${go.from}`));
  return nav;
}
