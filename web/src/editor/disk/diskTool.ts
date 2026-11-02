// The disk-space tool's dialog (Overview › Tools › Disk space): the floppy, what the game needs
// to run and the disks it takes, the merges the tool can apply (with a preview of every change and
// the bytes saved) and what it left alone. Applying is one undoable step in the project's file
// history (Undo here, Ctrl+Z, or the next time the tool opens); it can't see how a level plays, so
// it points at the Level check and the walkthrough bot to confirm afterwards.
import { clear, h, modal, toast } from '../core/ui';
import { fileUndo } from '../core/fileUndo';
import type { Project } from '../core/project';
import { planDisk } from './plan';
import { checkpointPanel } from './checkpointPanel';
import { sizeUp, type SizeUp } from './size';
import { floppyFor } from './diskCard';
import type { Plan, Step } from './types';
import './diskTool.css';

interface Kept {
  hist: ReturnType<typeof fileUndo>;
  /** Redraws whichever dialog is open when an Undo or Redo lands. */
  redraw: () => void;
}
const kept = new WeakMap<Project, Kept>();

/** The project's undo for disk merges, kept while the project is open. */
function historyFor(project: Project): Kept {
  let k = kept.get(project);
  if (!k) {
    const made: Kept = { redraw: () => undefined, hist: fileUndo(project.files, () => (project.forgetParsed(), made.redraw())) };
    kept.set(project, (k = made));
  }
  return k;
}

import { kb, plural } from './diskCard';

function sizeTable(s: SizeUp): HTMLElement {
  const row = (label: string, bytes: string) => h('tr', null, h('th', { scope: 'row' }, label), h('td', null, bytes));
  const disks = (n: number) => (n === Infinity ? 'a file is too big for one disk' : plural(n, 'disk'));
  return h(
    'table',
    { class: 'disk-sizes' },
    h('caption', null, 'To run as a DOS game'),
    h(
      'tbody',
      null,
      row('The game’s files', `${kb(s.game)} (${plural(s.files.length, 'file')})`),
      row('PLAYGAME and its setup files', kb(s.runtime)),
      row('Total', kb(s.total)),
      row('3.5″ high density, 1.44 MB', disks(s.disks.high)),
      row('3.5″ low density, 720 KB', disks(s.disks.low)),
    ),
  );
}

function stepView(step: Step): HTMLElement {
  return h(
    'li',
    { class: 'disk-step' },
    h('details', null, h('summary', null, `${step.title} (saves ${kb(step.saves)})`), h('ul', null, ...step.changes.map((c) => h('li', null, c)))),
  );
}

/** Opens the dialog. */
export async function diskTool(project: Project): Promise<void> {
  let stopKeys = () => undefined as void;
  await modal<void>('Disk space', () => {
    const root = h('div', { class: 'disk-tool' });
    const undoBar = h('div', { class: 'disk-undo' });
    let applied = '';
    const keep = historyFor(project);
    const hist = keep.hist;
    keep.redraw = () => {
      applied = '';
      render();
    };
    stopKeys = hist.listenKeys();
    const checkpoint = checkpointPanel(project, hist, () => render());

    function render() {
      const size = sizeUp(project.files, project.gam);
      let plan: Plan;
      try {
        plan = planDisk(project.files, project.gam);
      } catch {
        plan = { steps: [], notes: [] };
      }
      const saves = plan.steps.reduce((a, s) => a + s.saves, 0);
      const fits = size.disks.low === 1;
      const canvas = floppyFor(project, 160);
      canvas?.setAttribute('role', 'img');
      canvas?.setAttribute('aria-label', `A 3.5 inch floppy disk labeled ${project.name}`);
      clear(
        root,
        h(
          'div',
          { class: 'disk-top' },
          canvas ? h('div', { class: 'disk-floppy' }, canvas) : null,
          h(
            'div',
            { class: 'disk-summary' },
            sizeTable(size),
            h(
              'p',
              { class: 'disk-fit', role: 'status' },
              fits ? 'It fits on one low density (720 KB) disk.' : 'It would not fit on one low density (720 KB) disk.',
            ),
            size.unused.length
              ? h(
                  'p',
                  { class: 'hint' },
                  `${plural(size.unused.length, 'file')} (${kb(size.unused.reduce((a, [, n]) => a + n, 0))}) in the project are not named by the game, and the DOS export still ships them.`,
                )
              : null,
          ),
        ),
        h('h3', null, 'Files that can share'),
        plan.steps.length
          ? h(
              'div',
              null,
              h(
                'p',
                null,
                `${plural(plan.steps.length, 'merge')} would give back ${kb(saves)}. A DOS file is the same size however little is in it, so a monster file or block set that is mostly empty can take another’s place. Each opens to show what changes; nothing changes until you apply them.`,
              ),
              h('ol', { class: 'disk-steps' }, ...plan.steps.map(stepView)),
              h(
                'button',
                {
                  type: 'button',
                  class: 'primary',
                  onclick: async () => {
                    if (!(await checkpoint.ensure('Before optimization'))) return;
                    try {
                      hist.before(...new Set(plan.steps.flatMap((s) => s.touches)));
                      for (const s of plan.steps) s.apply(project.files, project.gam);
                      project.forgetParsed();
                      applied = `Merged ${plural(plan.steps.length, 'file pair')}, saving ${kb(saves)}.`;
                      toast(applied);
                    } catch (e) {
                      toast(`Could not merge: ${(e as Error).message}`, 'error');
                    }
                    render();
                  },
                },
                `Apply ${plural(plan.steps.length, 'merge')} (saves ${kb(saves)})`,
              ),
            )
          : h('p', null, 'Nothing is left to merge.'),
        applied
          ? h(
              'div',
              { class: 'disk-applied', role: 'status' },
              h(
                'p',
                null,
                `${applied} The game should play the same: monsters, maps and the character follow their new numbers. The tool can’t see how a level plays, so run the Level check on each map and make a walkthrough to confirm.`,
              ),
              h('button', { type: 'button', onclick: () => void import('../widgets/walkDialog').then((m) => m.walkDialog(project)) }, 'Make a walkthrough…'),
            )
          : null,
        undoBar,
        checkpoint.el,
        plan.notes.length
          ? h(
              'div',
              null,
              h('h3', null, 'Left alone'),
              h('ul', { class: 'disk-notes' }, ...plan.notes.map((n) => h('li', null, h('strong', null, n.title), `: ${n.why}.`))),
              h('p', { class: 'hint' }, 'These are suggestions; the tool only reads the files, so it can’t see what you meant them for.'),
            )
          : null,
      );
      undoBar.replaceChildren(hist.undoBtn, hist.redoBtn);
    }
    render();
    return root;
  });
  stopKeys();
}
