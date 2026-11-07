// The ⚠ badge on a game of your own in the home page's list, a quiet note for a finished
// game as it was released (problems there are no call to action), and the report both open. The checking
// itself is in ../project/health.ts, loaded when a check runs; this loads the files it needs (just the .gam and
// graphic scripts for the badge, everything for the report) and shows the result.
import { h } from '../core/ui';
import type { FileSource, Issue } from '../../project/health';
import { peekGameFile, loadHostedGame, withFiles, type CatalogEntry } from '../../project/files';
import { loadProject } from '../../project/storage';
import { splitInherited } from './homeOrigin';
import { icon } from './homeIcons';

export interface HealthTarget {
  title: string;
  /** Names, sizes and the few files the badge's check needs. */
  quick(): Promise<Issue[]>;
  /** Every file read with its format's reader. */
  deep(): Promise<Issue[]>;
  /** Where clicking a file name in the report goes (projects: that file's editor). */
  fileHref?(file: string): string | undefined;
  /** A finished game exactly as it was released (the CD's or ours): only playable or copied, not fixed here. */
  released?: boolean;
  /** A copy of a released game: `quick` and `deep` leave out what the original already had. */
  original?: HealthTarget;
  /** Every file read, split into the copy's own problems and those that came with the original. */
  deepSplit?(): Promise<{ own: Issue[]; inherited: Issue[] }>;
  /** Plain notes about the game that aren't file problems (e.g. a demo added in place of a missing one). */
  notes?(): Promise<string[]>;
}

/** The check (health.ts and every format reader it uses), loaded the first time one runs or is shown. */
const health = () => import('../../project/health');

/** The report (gameHealthReport.ts), loaded when a badge or note is pressed. */
const report = async (target: HealthTarget) => (await import('./gameHealthReport')).showHealthReport(target);

const cache = new Map<string, Promise<Issue[]>>();

function cached(key: string, run: () => Promise<Issue[]>): Promise<Issue[]> {
  let p = cache.get(key);
  if (!p) {
    p = run().catch((e: Error) => [{ severity: 'warning', kind: 'unreadable', message: `The game could not be checked: ${e.message}` }]);
    cache.set(key, p);
  }
  return p;
}

/** A game from the CD or the Sandbox collection, served from ./games/. */
export function catalogTarget(g: CatalogEntry): HealthTarget {
  const quick = async (): Promise<Issue[]> => {
    if (g.health) return g.health; // checked when the site was built
    const { QUICK_CHECK_FILE } = await health();
    const files = (await withFiles(g)).files; // a lean entry (the home page's) has its list fetched now
    const wanted = files.filter((n) => QUICK_CHECK_FILE.test(n));
    const loaded = new Map<string, Uint8Array>();
    await Promise.all(
      wanted.map(async (n) => {
        const bytes = await peekGameFile(g, n);
        if (bytes) loaded.set(n, bytes);
      }),
    );
    const src: FileSource = {
      names: () => [...files].sort(),
      get: (n) => loaded.get(n),
      byteSize: (n) => (g.sizes ? g.sizes[files.indexOf(n)] : undefined),
    };
    return (await health()).checkGame(src, g.gam ?? undefined);
  };
  return {
    title: g.title,
    released: true,
    quick: () => cached(`game:${g.id}`, quick),
    deep: async () => {
      const files = await loadHostedGame(g);
      // Listed files that did not load are reported as unreadable.
      const src: FileSource = { names: () => [...(g.files ?? [])].sort(), get: (n) => files.get(n) };
      return (await health()).checkGame(src, g.gam ?? undefined, { deep: true });
    },
  };
}

/**
 * A game being made in this browser. `original`: the released game it was copied from, whose
 * own problems are left out of the badge and listed apart in the report.
 */
export function projectTarget(id: string, title: string, updated: number, original?: HealthTarget): HealthTarget {
  const load = async (deep: boolean): Promise<Issue[]> => {
    const p = await loadProject(id);
    if (!p) return [];
    return (await health()).checkGame(p.files, p.record.gam, { deep });
  };
  const split = async (deep: boolean) => {
    const mine = await load(deep);
    if (!original || !mine.length) return { own: mine, inherited: [] };
    return splitInherited(mine, await (deep ? original.deep() : original.quick()).catch(() => []));
  };
  return {
    title,
    original,
    quick: () => cached(`project:${id}:${updated}:${original ? 'own' : 'all'}`, async () => (await split(false)).own),
    deep: async () => (await split(true)).own,
    deepSplit: () => split(true),
    fileHref: (file) => `#/p/${encodeURIComponent(id)}/${encodeURIComponent(file)}`,
  };
}

/** Badge checked when it first scrolls into view; hidden while the game looks fine. */
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    seen.unobserve(e.target);
    (e.target as HTMLElement & { check?: () => void }).check?.();
  }
});

/** `focusable`: in the Tab order once there is something to show (tiles leave it out). */
export function healthBadge(target: HealthTarget, focusable = false): HTMLElement {
  const badge = h(
    'button',
    { class: 'health-badge unknown', tabindex: -1, onclick: (e: Event) => (e.stopPropagation(), void report(target)) },
    '⚠',
  ) as HTMLButtonElement & {
    check?: () => void;
  };
  badge.check = () =>
    void target.quick().then(async (issues) => {
      const worst = (await health()).worstSeverity(issues);
      if (!worst) return;
      badge.classList.remove('unknown');
      if (focusable) badge.tabIndex = 0;
      badge.classList.add(worst);
      const label = countLabel(issues);
      // the tip names how many; the report (a click away) says what
      badge.dataset.tip = `${label[0].toUpperCase()}${label.slice(1)} found: click for the report`;
      badge.setAttribute('aria-label', `${target.title}: ${label}. Show the report.`);
    });
  seen.observe(badge);
  return badge;
}

/** How the issues found add up, in a few words ("2 problems", "1 warning"). */
function countLabel(issues: Issue[]): string {
  const errors = issues.filter((i) => i.severity === 'error').length;
  return errors ? `${errors} problem${errors === 1 ? '' : 's'}` : `${issues.length} warning${issues.length === 1 ? '' : 's'}`;
}

/**
 * For a released game: a small line under its buttons, shown only when its files have
 * something worth knowing, that opens the report. Nothing to fix there: it plays as it did.
 */
export function healthNote(target: HealthTarget): HTMLElement {
  const note = h('button', { class: 'health-note', type: 'button', hidden: true, onclick: () => void report(target) });
  // checked straight away: the panel shows one game at a time
  void Promise.all([target.quick(), target.notes?.() ?? []]).then(([issues, notes]) => {
    const n = issues.length + notes.length;
    if (!n) return;
    // the ⓘ as a drawing, so the button's name is just its words (and what they open)
    note.replaceChildren(icon('info'), ` Notes on its files (${n})`);
    note.setAttribute(
      'aria-label',
      `Notes on its files (${n}) for ${target.title}: ${issues.length ? countLabel(issues) : `${n} note${n === 1 ? '' : 's'}`}. Show them.`,
    );
    note.hidden = false;
  });
  return note;
}
