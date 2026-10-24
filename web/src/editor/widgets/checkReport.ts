// The Level check's findings as a report: a large dialog with every finding grouped by kind
// (problems, warnings, suggestions, notes), each with its place, why it matters, its guide link
// and its fix or accept buttons, the same filters as the panel, and two checklists to fix from:
// a CSV file (checkRows.ts) and a printable page with a box to tick by each finding, which the
// browser's Print can save as a PDF. The map panel hands in its own list items, so a click on
// a finding closes the report and shows it on the map; the whole game's report (Before You
// Upload) lists every map's findings with an accept button and a link to each map.
import './checkReport.css';
import { h, clear, modal, toast } from '../core/ui';
import type { Project } from '../core/project';
import { at, CHECKS, kindOf, type Finding, type Kind } from '../check/findings';
import { acceptedFindings, findingKey, setAccepted } from '../check/accepted';
import { saveBlob } from '../../media/screenCapture';
import { guideLink } from './guideLink';
import { cellOf, csvName, findingRows, groupRows, guideSection, KIND_LABEL, KIND_PLURAL, KINDS, toCsv, type FindingRow } from './checkRows';

export interface ReportSource {
  project: Project;
  /** The map the report is of (undefined: every map of the game). */
  map?: string;
  /** The findings now (read again after a fix or an accept). */
  findings(): Finding[];
  /** The panel's own list item, with its go, fix and accept buttons; a click on its go button closes the report. */
  item?: (f: Finding, accepted: boolean) => HTMLElement;
  /** The filter the panel shows, to start with. */
  filter?: Kind | 'all';
}

const ICON: Record<Kind, string> = { error: '⛔', warning: '⚠', suggestion: '💡', info: 'ℹ' };

/** "Scene 2 · DESERT.MAP (12, 40)": where a finding is, in words. */
export function placeOf(f: Finding, map?: string): string {
  const w = f.where;
  const cell = cellOf(f);
  const file = w.map ?? map ?? w.file ?? w.block?.file ?? w.monster?.file ?? w.sound?.file;
  const thing = w.block ? ` block ${w.block.n}` : w.monster ? ` monster ${w.monster.n}` : w.sound ? ` sound ${w.sound.n}` : '';
  return [w.scene !== undefined ? `Scene ${w.scene}` : '', file ? `${file}${thing}${cell !== undefined && (w.map ?? map) ? ` ${at(cell)}` : ''}` : '']
    .filter(Boolean)
    .join(' · ');
}

export async function openReport(src: ReportSource): Promise<void> {
  const { project } = src;
  let filter: Kind | 'all' = src.filter ?? 'all';
  let showAccepted = false;
  const rows = () => findingRows(src.findings(), acceptedFindings(project));
  const counts = h('div', { class: 'lc-counts', role: 'group', 'aria-label': 'Show findings' });
  const acceptedBox = h('input', { type: 'checkbox' });
  acceptedBox.addEventListener('change', () => ((showAccepted = acceptedBox.checked), render()));
  const body = h('div', { class: 'lcr-groups' });
  const said = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  let close: (v: undefined) => void = () => undefined;

  const plainItem = (f: Finding, accepted: boolean): HTMLElement => {
    const info = CHECKS[f.check];
    const taste = 'taste' in info;
    return h(
      'li',
      { class: `lc-item lc-${kindOf(f)}${accepted ? ' lc-is-accepted' : ''}` },
      h('p', { class: 'lc-what' }, f.title),
      f.detail ? h('p', { class: 'lc-detail' }, f.detail) : null,
      h('p', { class: 'lc-why' }, h('strong', null, `${info.name}. `), info.why, ' ', guideLink(info.guide)),
      h(
        'div',
        { class: 'toolbar' },
        f.where.map
          ? h(
              'a',
              { class: 'button lcr-open', href: `#/p/${project.id}/${encodeURIComponent(f.where.map)}`, onclick: () => close(undefined) },
              `🗺 Open ${f.where.map}`,
            )
          : null,
        h(
          'button',
          {
            type: 'button',
            class: 'lc-fix lc-accept',
            onclick: () => {
              setAccepted(project, findingKey(f), !accepted);
              said.textContent = accepted ? 'The finding is back in the list.' : 'The finding is kept under accepted.';
              render();
            },
          },
          accepted ? '↺ Not meant to be: list it again' : taste ? '✓ That’s on purpose' : '✓ Mark as checked: it’s meant to be',
        ),
      ),
    );
  };

  const entry = (r: FindingRow): HTMLElement => {
    const accepted = r.status !== 'open';
    const li = (src.item ?? plainItem)(r.finding, accepted);
    li.prepend(h('p', { class: 'lcr-place' }, placeOf(r.finding, src.map) || 'The whole game'));
    if (accepted)
      li.append(h('p', { class: 'lcr-status meta' }, r.status === 'accepted' ? 'Accepted: it’s meant to be.' : 'Kept as you chose it: that’s on purpose.'));
    return li;
  };

  function render(): void {
    const all = rows();
    const open = all.filter((r) => r.status === 'open');
    const by = (k: Kind) => open.filter((r) => r.kind === k).length;
    clear(
      counts,
      ...(['all', ...KINDS] as const).map((k) =>
        h(
          'button',
          { type: 'button', class: 'lc-count', 'aria-pressed': String(filter === k), onclick: () => ((filter = k), render()) },
          k === 'all' ? `All ${open.length}` : `${ICON[k]} ${by(k)} ${KIND_LABEL[k].toLowerCase()}${by(k) === 1 ? '' : 's'}`,
        ),
      ),
    );
    acceptedBox.disabled = open.length === all.length;
    const shown = all.filter((r) => (showAccepted || r.status === 'open') && (filter === 'all' || r.kind === filter));
    const groups = groupRows(shown);
    clear(
      body,
      ...(groups.length
        ? groups.map((g) =>
            h(
              'section',
              { class: `lcr-group lcr-${g.kind}`, 'aria-labelledby': `lcr-h-${g.kind}` },
              h('h3', { id: `lcr-h-${g.kind}` }, h('span', { 'aria-hidden': 'true' }, `${ICON[g.kind]} `), `${KIND_PLURAL[g.kind]} (${g.rows.length})`),
              h('ol', { class: 'lc-list lcr-list' }, ...g.rows.map(entry)),
            ),
          )
        : [h('p', { class: 'meta' }, all.length ? 'None of these.' : 'Nothing to report.')]),
    );
  }

  const download = () => {
    const all = rows();
    if (!all.length) return toast('There are no findings to put in the file.');
    saveBlob(csvName(project.name, src.map), new Blob([toCsv(all, src.map)], { type: 'text/csv;charset=utf-8' }));
  };

  // the panel's items: going to a finding closes the report; a fix or an accept lists them again
  body.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b || !src.item) return;
    if (b.classList.contains('lc-go')) close(undefined);
    else setTimeout(render, 0);
  });

  render();
  await modal<undefined>(src.map ? `Level check report: ${src.map}` : `Level check report: ${project.name}`, (c) => {
    close = c;
    return h(
      'div',
      { class: 'stack lcr' },
      h(
        'p',
        { class: 'hint' },
        src.map
          ? 'Every finding of this map’s last Level check, by kind. Pick one to see it on the map.'
          : 'Every finding of the game’s files and of each map’s last Level check, by kind.',
      ),
      h(
        'div',
        { class: 'toolbar' },
        h('button', { type: 'button', onclick: download, title: 'One row a finding, to sort and tick off in a spreadsheet' }, '⬇ Download CSV checklist'),
        h(
          'button',
          { type: 'button', onclick: () => printChecklist(project.name, src.map, rows()), title: 'A page with a box to tick by each finding' },
          '🖨 Print or save as PDF',
        ),
      ),
      h('div', { class: 'row lcr-filters' }, counts, h('label', { class: 'check' }, acceptedBox, h('span', null, 'Show accepted'))),
      said,
      body,
    );
  });
}

/** Prints the findings as a checklist: a box by each, grouped by kind (the browser's Print can save it as a PDF). */
export function printChecklist(game: string, map: string | undefined, rows: FindingRow[]): void {
  const root = h(
    'div',
    { class: 'lcr-print' },
    h('h1', null, `${game}${map ? ` · ${map}` : ''}: Level check checklist`),
    h(
      'p',
      null,
      `${new Date().toLocaleDateString()} · ${rows.filter((r) => r.status === 'open').length} to fix, ${rows.filter((r) => r.status !== 'open').length} kept as they are`,
    ),
    ...groupRows(rows).map((g) =>
      h(
        'section',
        null,
        h('h2', null, `${KIND_PLURAL[g.kind]} (${g.rows.length})`),
        h(
          'ul',
          null,
          ...g.rows.map((r) =>
            h(
              'li',
              { class: r.status === 'open' ? '' : 'lcr-done' },
              h('span', { class: 'lcr-box', 'aria-hidden': 'true' }, r.status === 'open' ? '☐' : '☑'),
              h(
                'div',
                null,
                h('strong', null, r.finding.title),
                h('div', { class: 'lcr-p-place' }, [placeOf(r.finding, map), CHECKS[r.finding.check].name].filter(Boolean).join(' · ')),
                r.finding.detail ? h('div', null, r.finding.detail) : null,
                h('div', { class: 'lcr-p-why' }, `${CHECKS[r.finding.check].why} Guide: ${guideSection(r.finding)}.`),
                r.status === 'open' ? null : h('div', { class: 'lcr-p-why' }, r.status === 'accepted' ? 'Accepted: it’s meant to be.' : 'That’s on purpose.'),
              ),
            ),
          ),
        ),
      ),
    ),
    rows.length ? null : h('p', null, 'Nothing to report.'),
  );
  document.body.append(root);
  document.documentElement.classList.add('lcr-printing');
  const done = () => {
    window.removeEventListener('afterprint', done);
    document.documentElement.classList.remove('lcr-printing');
    root.remove();
  };
  window.addEventListener('afterprint', done);
  window.print();
}
