// The ⚠ badge on a game of your own in the home page's list, a quiet note for a finished
// game as it was released (problems there are no call to action), and the report both open. The checking
// itself is in ../project/health.ts; this loads the files it needs (just the .gam and
// graphic scripts for the badge, everything for the report) and shows the result.
import { h, modal } from '../core/ui';
import { checkGame, QUICK_CHECK_FILE, worstSeverity, type FileSource, type Issue } from '../../project/health';
import { fetchGameFile, loadHostedGame, type CatalogEntry } from '../../project/files';
import { loadProject } from '../../project/storage';
import { splitInherited } from './homeOrigin';

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
    const wanted = g.files.filter((n) => QUICK_CHECK_FILE.test(n));
    const loaded = new Map<string, Uint8Array>();
    await Promise.all(
      wanted.map(async (n) => {
        const bytes = await fetchGameFile(g, n);
        if (bytes) loaded.set(n, bytes);
      }),
    );
    const src: FileSource = {
      names: () => [...g.files].sort(),
      get: (n) => loaded.get(n),
      byteSize: (n) => (g.sizes ? g.sizes[g.files.indexOf(n)] : undefined),
    };
    return checkGame(src, g.gam ?? undefined);
  };
  return {
    title: g.title,
    released: true,
    quick: () => cached(`game:${g.id}`, quick),
    deep: async () => {
      const files = await loadHostedGame(g);
      // Listed files that did not load are reported as unreadable.
      const src: FileSource = { names: () => [...g.files].sort(), get: (n) => files.get(n) };
      return checkGame(src, g.gam ?? undefined, { deep: true });
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
    return checkGame(p.files, p.record.gam, { deep });
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
    { class: 'health-badge unknown', tabindex: -1, onclick: (e: Event) => (e.stopPropagation(), void showHealthReport(target)) },
    '⚠',
  ) as HTMLButtonElement & {
    check?: () => void;
  };
  badge.check = () =>
    void target.quick().then((issues) => {
      const worst = worstSeverity(issues);
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
  const note = h('button', { class: 'health-note', type: 'button', hidden: true, onclick: () => void showHealthReport(target) }) as HTMLButtonElement;
  // checked straight away: the panel shows one game at a time
  void Promise.all([target.quick(), target.notes?.() ?? []]).then(([issues, notes]) => {
    const n = issues.length + notes.length;
    if (!n) return;
    note.textContent = `ⓘ Notes on its files (${n})`;
    note.setAttribute(
      'aria-label',
      `${target.title}: notes on its files, ${issues.length ? countLabel(issues) : `${n} note${n === 1 ? '' : 's'}`}. Show them.`,
    );
    note.hidden = false;
  });
  return note;
}

const KIND_TITLES: Record<Issue['kind'], string> = {
  game: 'The game file',
  missing: 'Missing files',
  link: 'Broken links between scenes',
  unreadable: 'Files that can’t be read',
  empty: 'Empty files',
  name: 'File names DOS can’t use',
};

export async function showHealthReport(target: HealthTarget): Promise<void> {
  const body = h('div', { class: 'health-report' }, h('p', { class: 'meta' }, 'Checking every file…'));
  const shown = modal(target.released ? `${target.title}: notes on its files` : `${target.title}: health check`, (close) => [
    body,
    h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
  ]);
  const failed = (e: Error) => ({
    own: [{ severity: 'error', kind: 'unreadable', message: `The check failed: ${e.message}` } as Issue],
    inherited: [] as Issue[],
  });
  const { own: issues, inherited } = await (target.deepSplit ? target.deepSplit() : target.deep().then((own) => ({ own, inherited: [] as Issue[] }))).catch(
    failed,
  );
  const errors = issues.filter((i) => i.severity === 'error').length;
  const from = target.original?.title ?? 'the original';
  const came = inherited.length
    ? ` ${inherited.length} more note${inherited.length === 1 ? '' : 's'} came with ${from} as it was released (it plays the same), listed below.`
    : '';
  // a released game is as it was: its notes are facts about its files, not alarms
  const summary = target.released
    ? issues.length
      ? `This is the game exactly as it was released, and it plays here as it did in DOS: where it names a file that isn’t there, it does without. ${issues.length} note${issues.length === 1 ? '' : 's'} on its files, worth knowing if you edit a copy:`
      : '✓ Every file the game names is there and every file can be read.'
    : !issues.length
      ? inherited.length
        ? `✓ Nothing you changed has caused a problem.${came}`
        : '✓ No problems found: every file the game names is there and every file can be read.'
      : (errors
          ? `${errors} problem${errors === 1 ? '' : 's'} may stop parts of this game from showing or playing as intended${issues.length > errors ? `, and ${issues.length - errors} smaller warning${issues.length - errors === 1 ? '' : 's'}` : ''}.`
          : `${issues.length} warning${issues.length === 1 ? '' : 's'}; the game should still play.`) + came;
  /** The issues grouped by kind; `quiet` lists them as notes (ⓘ), not alarms. */
  const groups = (list: Issue[], quiet: boolean, title = (kind: Issue['kind'], n: number) => `${KIND_TITLES[kind]} (${n})`) => {
    const byKind = new Map<Issue['kind'], Issue[]>();
    for (const i of list) byKind.set(i.kind, [...(byKind.get(i.kind) ?? []), i]);
    return [...byKind].map(([kind, items]) =>
      h(
        'section',
        null,
        h('h4', null, title(kind, items.length)),
        h(
          'ul',
          null,
          ...items.map((i) => {
            const href = i.file ? target.fileHref?.(i.file) : undefined;
            return h(
              'li',
              { class: quiet ? 'warning' : i.severity },
              h('span', { class: 'sev', 'aria-label': quiet ? 'note' : i.severity }, i.severity === 'error' && !quiet ? '⚠' : 'ⓘ'),
              ' ',
              href ? h('a', { href }, i.message) : i.message,
            );
          }),
        ),
      ),
    );
  };
  const notes = (await target.notes?.().catch(() => [])) ?? [];
  body.replaceChildren(
    h('p', { class: `health-summary ${target.released ? (issues.length ? 'warning' : 'ok') : (worstSeverity(issues) ?? 'ok')}` }, summary),
    ...groups(issues, !!target.released),
    ...(inherited.length
      ? [
          h('h3', { class: 'health-inherited' }, `Inherited from ${from}`),
          h('p', { class: 'meta' }, `${from} had these as it was released, and it plays as it did in DOS. Nothing to fix unless you want to.`),
          ...groups(inherited, true),
        ]
      : []),
    ...(notes.length
      ? [
          h(
            'section',
            null,
            h('h4', null, 'About this edition'),
            h('ul', null, ...notes.map((n) => h('li', { class: 'warning' }, h('span', { class: 'sev', 'aria-label': 'note' }, 'ⓘ'), ' ', n))),
          ),
        ]
      : []),
  );
  await shown;
}
