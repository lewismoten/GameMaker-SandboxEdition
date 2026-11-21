// Finding lists, acceptance controls and fix undo for the map's Level check.
import { h, clear, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { CHECKS, at, isHard, kindOf, type Finding, type Kind } from '../../../check/findings';
import { guideLink } from '../../../widgets/guideLink';
import { fixFor } from '../../../check/generators/fixes';
import { unlockAchievement } from '../../../../achievements';
import { markSame, sameKeyOf } from '../../../check/sameEverySide';
import { reasonField } from '../../../widgets/acceptReason';
import { acceptedFindings, findingKey, splitAccepted, wasAcceptedButHard } from '../../../check/accepted';
import type { Saved } from './checkRun';

const LABEL: Record<Kind, string> = { error: 'Problem', warning: 'Warning', suggestion: 'Suggestion', info: 'Note' };
const ICON: Record<Kind, string> = { error: '⛔', warning: '⚠', suggestion: '💡', info: 'ℹ' };

export function checkFindings(
  host: { project: Project; reload(files: string[]): void; goTo(cell: number): void },
  state: { saved: Saved | undefined },
  ui: {
    said: HTMLParagraphElement;
    focus(cell: number): void;
    paint(): void;
    describe(cell: number): string[];
    render(): void;
    save(): void;
  },
) {
  const { project } = host;
  const drafts = new Map<string, string>();
  let filter: Kind | 'all' = 'all';
  let showAccepted = false;
  const undo: { files: [string, Uint8Array | undefined][]; what: string }[] = [];
  const undoBtn = h('button', { type: 'button', hidden: true, onclick: () => undoFix() }, '↶ Undo fix');
  const list = h('ol', { class: 'lc-list', 'aria-label': 'Findings' });
  const acceptedBox = h('div', { class: 'lc-accepted' });
  const counts = h('div', { class: 'lc-counts', role: 'group', 'aria-label': 'Show findings' });
  const split = () => splitAccepted(state.saved?.findings ?? [], acceptedFindings(project));
  function render(): void {
    const { open, accepted } = split();
    const by = (s: Kind) => open.filter((f) => kindOf(f) === s).length;
    clear(
      counts,
      ...(['all', 'error', 'warning', 'suggestion', 'info'] as const).map((s) =>
        h(
          'button',
          { type: 'button', class: 'lc-count', 'aria-pressed': String(filter === s), onclick: () => ((filter = s), ui.render()) },
          s === 'all' ? `All ${open.length}` : `${ICON[s]} ${by(s)} ${LABEL[s].toLowerCase()}${by(s) === 1 ? '' : 's'}`,
        ),
      ),
    );
    const shown = open.filter((f) => filter === 'all' || kindOf(f) === filter);
    clear(list, ...(shown.length ? shown.map((f) => item(f)) : [h('li', { class: 'meta' }, open.length ? 'None of these.' : 'Nothing to report.')]));
    if (!accepted.length) showAccepted = false;
    clear(
      acceptedBox,
      ...(accepted.length
        ? [
            h(
              'button',
              {
                type: 'button',
                class: 'lc-accepted-toggle',
                'aria-expanded': String(showAccepted),
                'aria-controls': 'lc-accepted-list',
                title: 'Findings marked as checked: they are meant to be',
                onclick: () => ((showAccepted = !showAccepted), ui.render()),
              },
              `${accepted.length} accepted · ${showAccepted ? 'hide' : 'show'}`,
            ),
            h(
              'ol',
              { class: 'lc-list', id: 'lc-accepted-list', 'aria-label': 'Accepted findings', hidden: !showAccepted },
              ...accepted.map((f) => item(f, true)),
            ),
          ]
        : []),
    );
  }
  /** Accepts a finding as meant to be, or (with `on` false) brings it back to the list. */
  function announceAcceptance(f: Finding, on: boolean): void {
    ui.render();
    toast(
      on
        ? `${'taste' in CHECKS[f.check] ? 'Kept as you chose it' : 'Marked as checked'}: the finding is kept under “accepted”.`
        : 'The finding is back in the list.',
    );
  }

  function item(f: Finding, accepted = false, refreshReport?: () => void): HTMLElement {
    const info = CHECKS[f.check];
    const cell = f.where.cell ?? f.where.cells?.[0];
    const fix = fixFor(f, project);
    const same = sameKeyOf(f);
    const kind = kindOf(f);
    const taste = 'taste' in info;
    const hard = isHard(f);
    return h(
      'li',
      { class: `lc-item lc-${kind}${accepted ? ' lc-is-accepted' : ''}` },
      h(
        'button',
        {
          type: 'button',
          class: 'lc-go',
          disabled: cell === undefined,
          title: cell === undefined ? undefined : `Show ${at(cell)} on the map`,
          onclick: () => {
            if (cell === undefined) return;
            ui.focus(cell);
            ui.paint();
            host.goTo(cell);
            ui.said.textContent = `${at(cell)}: ${ui.describe(cell).join('. ')}.`;
          },
        },
        h('span', { class: 'lc-sev' }, h('span', { 'aria-hidden': 'true' }, ICON[kind]), ` ${LABEL[kind]}: `),
        h('span', { class: 'lc-what' }, f.title),
      ),
      f.detail ? h('p', { class: 'lc-detail' }, f.detail) : null,
      h('p', { class: 'lc-why' }, h('strong', null, `${info.name}. `), info.why, ' ', guideLink(info.guide)),
      fix && !accepted
        ? h(
            'button',
            {
              type: 'button',
              class: 'lc-fix',
              title: fix.detail,
              onclick: () => {
                const before = fix.files.map((n): [string, Uint8Array | undefined] => [n, project.files.get(n)?.slice()]);
                const changed = fix.apply();
                if (!changed.length) return toast('Nothing to change there.');
                undo.push({ files: before.filter(([n]) => changed.includes(n)), what: fix.label });
                undoBtn.hidden = false;
                host.reload(changed);
                unlockAchievement('check-fix');
                toast(`${fix.label}: done. Run the check again to see the difference.`);
              },
            },
            `✨ ${fix.label}`,
          )
        : null,
      same && !accepted
        ? h(
            'button',
            {
              type: 'button',
              class: 'lc-fix',
              title: 'For a ball, a word or anything drawn to look the same from every side: the check stops asking about it.',
              onclick: () => {
                markSame(project, same);
                if (state.saved) state.saved.findings = state.saved.findings.filter((x) => sameKeyOf(x) !== same);
                if (state.saved) ui.save();
                ui.render();
                toast(`${same} is marked as the same from every side.`);
              },
            },
            'Looks the same from every side',
          )
        : null,
      hard
        ? h(
            'div',
            { class: 'lc-hard' },
            h(
              'p',
              { class: 'meta' },
              wasAcceptedButHard(f, acceptedFindings(project)) ? 'An earlier version let this be marked as checked. ' : '',
              'This will fail for players, so it can be fixed but not set aside.',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'lc-fix lc-goto',
                disabled: cell === undefined,
                title: cell === undefined ? 'It is in a file or a scene, not on one cell: see the place named above.' : `Show ${at(cell)} on the map`,
                onclick: () => {
                  if (cell === undefined) return;
                  ui.focus(cell);
                  ui.paint();
                  host.goTo(cell);
                  ui.said.textContent = `${at(cell)}: ${ui.describe(cell).join('. ')}.`;
                },
              },
              '➜ Go to it',
            ),
          )
        : h(
            'div',
            { class: 'toolbar' },
            reasonField(
              project,
              drafts,
              findingKey(f),
              accepted,
              () => {
                announceAcceptance(f, !accepted);
                refreshReport?.();
              },
              h(
                'button',
                {
                  type: 'button',
                  class: 'lc-fix lc-accept',
                  title: accepted
                    ? 'Puts this finding back in the list and the counts.'
                    : taste
                      ? 'A design suggestion, not a rule: if you chose this on purpose, the list, the counts, the badges and Before You Upload leave it out.'
                      : 'You have looked at this and it is how you want it: the list, the counts, the badges and Before You Upload leave it out.',
                },
                accepted ? '↺ Not meant to be: list it again' : taste ? '✓ That’s on purpose' : '✓ Mark as checked: it’s meant to be',
              ),
            ),
          ),
    );
  }

  function undoFix(): void {
    const last = undo.pop();
    if (!last) return;
    for (const [n, b] of last.files) {
      if (b) project.files.set(n, b);
      else project.files.delete(n);
    }
    host.reload(last.files.map(([n]) => n));
    undoBtn.hidden = !undo.length;
    toast(`Undid: ${last.what}.`);
  }

  return { list, acceptedBox, counts, undoBtn, split, item, render, filter: () => filter };
}
