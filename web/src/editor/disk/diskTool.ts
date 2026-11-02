// The disk-space tool's dialog (Overview › Tools › Optimize): the floppy, what the game needs
// to run and the disks it takes, the merges the tool can apply (with a preview of every change and
// the bytes saved) and what it left alone. Applying is one undoable step in the project's file
// history (Undo here, Ctrl+Z, or the next time the tool opens); it can't see how a level plays, so
// it points at the Level check and the walkthrough bot to confirm afterwards.
import { clear, confirmDialog, h, modal, toast } from '../core/ui';
import { setSection } from '../../project/companion';
import { fileUndo } from '../core/fileUndo';
import type { Project } from '../core/project';
import { planDisk } from './plan';
import { lookAlikeSets } from './lookAlikes';
import { lookAlikeView } from './lookAlikeView';
import { checkpointPanel } from './checkpointPanel';
import { PALETTE_RESERVATIONS, paletteReservations } from '../editors/palette/paletteReservations';
import { remapExtras } from './remapExtras';
import { notesUndo } from './notesUndo';
import { planPack, type PackPlan } from './packAll';
import { packView } from './packView';
import { reductions } from './reduceColors';
import { rangeSyncs } from './rangeSync';
import { proposeReservations } from './reservePlan';
import { rangeSyncView, reserveProposalView } from './reserveView';
import { savedGames } from './savesWarning';
import { reduceView } from './reduceView';
import { sizeUp, type SizeUp } from './size';
import { floppyFor } from './diskCard';
import type { Plan, Step } from './types';
import './diskTool.css';

interface Kept {
  hist: ReturnType<typeof fileUndo>;
  /** Redraws whichever dialog is open when an Undo or Redo lands. */
  redraw: () => void;
  /** Files and editor notes (names, groups, reservations) snapshotted together; every disk step goes through this, never hist.before. */
  before: (...names: string[]) => void;
}
const kept = new WeakMap<Project, Kept>();

/** The project's undo for disk merges, kept while the project is open. */
function historyFor(project: Project): Kept {
  let k = kept.get(project);
  if (!k) {
    const made: Kept = {
      redraw: () => undefined,
      before: (...names) => {
        made.hist.before(...names);
        notes.mark();
      },
      // each step is its own (no merging by time), so the notes' snapshots line up with the files'
      hist: fileUndo(
        project.files,
        (dir) => {
          notes.step(dir);
          project.forgetParsed();
          made.redraw();
        },
        { merge: -1 },
      ),
    };
    const notes = notesUndo(project);
    kept.set(project, (k = made));
  }
  return k;
}

import { kb, plural } from './diskCard';

/** The copy with these steps applied (makeOptimizedCopy.ts; loaded when first used). */
async function copyAll(project: Project, steps: Step[]): Promise<string> {
  const { makeOptimizedCopy } = await import('./makeOptimizedCopy');
  return makeOptimizedCopy(project, (files, store) => {
    for (const s of steps) {
      s.apply(files, project.gam);
      if (s.moves) remapExtras(store, s.moves);
    }
  });
}

async function copyPack(project: Project, p: PackPlan): Promise<string> {
  const { makeOptimizedCopy } = await import('./makeOptimizedCopy');
  return makeOptimizedCopy(project, (files, store) => {
    if (p.proposed) setSection(store.companion, project.gam, PALETTE_RESERVATIONS, p.roles);
    for (const u of p.units) {
      u.apply(files, project.gam);
      if (u.moves) remapExtras(store, u.moves);
    }
  });
}

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
    h(
      'details',
      null,
      h('summary', null, step.saves ? `${step.title} (saves ${kb(step.saves)})` : step.title),
      h('ul', null, ...step.changes.map((c) => h('li', null, c))),
    ),
  );
}

/** Opens the dialog. */
export async function diskTool(project: Project): Promise<void> {
  let stopKeys = () => undefined as void;
  await modal<void>('Optimize', () => {
    const root = h('div', { class: 'disk-tool' });
    const undoBar = h('div', { class: 'disk-undo' });
    let applied = '';
    let pack: PackPlan | 'none' | undefined;
    let packBusy = false;
    // saved games this project has: while it has some, the steps applied in place are the ones that keep their numbers
    let nSaves = 0;
    let packSeen: [string, Uint8Array][] = [];
    // a plan found for other files is not shown: it was worked out on bytes that have since changed
    const packStale = () => {
      const now = project.files.entries();
      return now.length !== packSeen.length || now.some(([n, b], i) => packSeen[i][0] !== n || packSeen[i][1] !== b);
    };
    const keep = historyFor(project);
    const hist = keep.hist;
    keep.redraw = () => {
      applied = '';
      pack = undefined;
      render();
    };
    stopKeys = hist.listenKeys();
    const checkpoint = checkpointPanel(project, keep.before, () => render());

    function render() {
      checkpoint.refresh();
      if (pack !== undefined && !packBusy && packStale()) pack = undefined;
      const size = sizeUp(project.files, project.gam);
      let plan: Plan;
      let all: Plan;
      try {
        all = planDisk(project.files, project.gam, paletteReservations(project));
        plan = nSaves > 0 ? planDisk(project.files, project.gam, paletteReservations(project), true) : all;
      } catch {
        plan = all = { steps: [], notes: [] };
      }
      const held = all.steps.length - plan.steps.length;
      void savedGames(project).then((n) => {
        if (n.length !== nSaves) {
          nSaves = n.length;
          render();
        }
      });
      const looks = (() => {
        try {
          return lookAlikeSets(project.files, project.gam);
        } catch (e) {
          console.warn('Look-alike blocks not checked', e);
          return [];
        }
      })();
      const reduce = (() => {
        try {
          return reductions(project.files, project.gam, paletteReservations(project));
        } catch (e) {
          console.warn('Color reduction not checked', e);
          return [];
        }
      })();
      const sync = (() => {
        try {
          return rangeSyncs(project.files, project.gam, paletteReservations(project));
        } catch (e) {
          console.warn('Reserved ranges not checked', e);
          return { syncs: [], stuck: [] };
        }
      })();
      const proposal = (() => {
        try {
          return proposeReservations(project.files, project.gam, paletteReservations(project));
        } catch (e) {
          console.warn('Reservations not planned', e);
          return undefined;
        }
      })();
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
        checkpoint.option,
        h('h3', null, 'Files that can share'),
        plan.steps.length
          ? h(
              'div',
              null,
              h(
                'p',
                null,
                `${plural(plan.steps.length, 'step')} would give back ${kb(saves)}. A DOS file is the same size however little is in it, so a monster file or block set that is mostly empty can take another’s place; blocks that look the same become one so sets fit together. Each opens to show what changes; nothing changes until you apply them.`,
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
                      keep.before(...new Set(plan.steps.flatMap((s) => s.touches)));
                      for (const s of plan.steps) {
                        s.apply(project.files, project.gam);
                        if (s.moves) remapExtras(project, s.moves);
                      }
                      project.forgetParsed();
                      applied = `Applied ${plural(plan.steps.length, 'step')}, saving ${kb(saves)}.`;
                      toast(applied);
                    } catch (e) {
                      toast(`Could not merge: ${(e as Error).message}`, 'error');
                    }
                    render();
                  },
                },
                `Apply ${plural(plan.steps.length, 'step')} (saves ${kb(saves)})`,
              ),
            )
          : h('p', null, nSaves > 0 && held ? 'Nothing is left that keeps your saved games working.' : 'Nothing is left to merge.'),
        all.steps.length
          ? h(
              'div',
              { class: 'disk-copy' },
              nSaves > 0 && held
                ? h(
                    'p',
                    null,
                    `${plural(held, 'more step')} would renumber blocks or monsters, and saved games remember them by number (this game has ${plural(nSaves, 'saved game')}). They are not applied here.`,
                  )
                : h('p', { class: 'hint' }, 'Prefer to keep this game as it is? Make a copy and optimize that instead.'),
              h(
                'button',
                {
                  type: 'button',
                  onclick: async () => {
                    try {
                      const name = await copyAll(project, all.steps);
                      toast(`Made “${name}” in My Games. This game and its saved games are unchanged.`);
                    } catch (e) {
                      toast(`Could not make the copy: ${(e as Error).message}`, 'error');
                    }
                  },
                },
                `Make an optimized copy (all ${plural(all.steps.length, 'step')})`,
              ),
            )
          : null,
        lookAlikeView(looks),
        reduceView(reduce, async (r) => {
          if (!(await checkpoint.ensure('Before color reduction'))) return;
          try {
            keep.before(...r.touches);
            r.apply(project.files, project.gam);
            project.forgetParsed();
            applied = `Reduced the colors of ${r.file}.`;
            toast(applied);
          } catch (e) {
            toast(`Could not reduce: ${(e as Error).message}`, 'error');
          }
          render();
        }),
        reserveProposalView(proposal, (p) => {
          keep.before();
          project.setExtras(project.gam, PALETTE_RESERVATIONS, p.roles);
          applied = `Saved ${p.roles.length} palette reservation${p.roles.length === 1 ? '' : 's'} to the project.`;
          toast(applied);
          render();
        }),
        packView(
          pack,
          packBusy,
          () => {
            packBusy = true;
            render();
            // let the "Looking…" label paint before the search, which takes a few seconds on a big game
            setTimeout(() => {
              try {
                packSeen = project.files.entries();
                pack = planPack(project.files, project.gam, paletteReservations(project)) ?? 'none';
              } catch (e) {
                console.warn('Packing not planned', e);
                pack = 'none';
              }
              packBusy = false;
              render();
            }, 30);
          },
          async (p) => {
            const risky = p.units.filter((u) => u.risk);
            if (nSaves > 0 && risky.length) {
              const ok = await confirmDialog(
                'Saved games would break',
                `This pack renumbers blocks or monsters (${[...new Set(risky.map((u) => u.risk))].join('; ')}), and saved games remember them by number (this game has ${plural(nSaves, 'saved game')}). Make an optimized copy in My Games instead? This game stays as it is.`,
                'Make the copy',
              );
              if (!ok) return;
              try {
                const name = await copyPack(project, p);
                toast(`Made “${name}” in My Games. This game and its saved games are unchanged.`);
              } catch (e) {
                toast(`Could not make the copy: ${(e as Error).message}`, 'error');
              }
              return;
            }
            if (!(await checkpoint.ensure('Before packing'))) return;
            try {
              keep.before(...new Set(p.units.flatMap((u) => u.touches)));
              if (p.proposed) project.setExtras(project.gam, PALETTE_RESERVATIONS, p.roles);
              for (const u of p.units) {
                u.apply(project.files, project.gam);
                if (u.moves) remapExtras(project, u.moves);
              }
              project.forgetParsed();
              applied = `Applied ${plural(p.units.length, 'packing step')}, saving ${kb(p.saves)}.`;
              toast(applied);
            } catch (e) {
              toast(`Could not pack: ${(e as Error).message}`, 'error');
            }
            pack = undefined;
            render();
          },
        ),
        rangeSyncView(sync.syncs, sync.stuck, async (r) => {
          if (!(await checkpoint.ensure('Before syncing reserved colors'))) return;
          try {
            keep.before(...r.touches);
            r.apply(project.files, project.gam);
            project.forgetParsed();
            applied = `Made the ${r.role} colors ${r.first}-${r.last} the same in every palette.`;
            toast(applied);
          } catch (e) {
            toast(`Could not sync: ${(e as Error).message}`, 'error');
          }
          render();
        }),
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
