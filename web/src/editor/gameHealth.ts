// The ⚠ badge on a game in the home page's list, and the report it opens. The checking
// itself is in ../project/health.ts; this loads the files it needs (just the .gam and
// graphic scripts for the badge, everything for the report) and shows the result.
import { h, modal } from './ui';
import { checkGame, QUICK_CHECK_FILE, worstSeverity, type FileSource, type Issue } from '../project/health';
import { loadHostedGame, type CatalogEntry } from '../project/files';
import { loadProject } from '../project/storage';

export interface HealthTarget {
  title: string;
  /** Names, sizes and the few files the badge's check needs. */
  quick(): Promise<Issue[]>;
  /** Every file read with its format's reader. */
  deep(): Promise<Issue[]>;
  /** Where clicking a file name in the report goes (projects: that file's editor). */
  fileHref?(file: string): string | undefined;
}

const cache = new Map<string, Promise<Issue[]>>();

function cached(key: string, run: () => Promise<Issue[]>): Promise<Issue[]> {
  let p = cache.get(key);
  if (!p) {
    p = run().catch((e: Error) => [{ severity: 'warning', kind: 'unreadable', message: `The game could not be checked: ${e.message}` } as Issue]);
    cache.set(key, p);
  }
  return p;
}

/** A game from the CD or the Sandbox collection, served from ./games/. */
export function catalogTarget(g: CatalogEntry): HealthTarget {
  const quick = async (): Promise<Issue[]> => {
    const wanted = g.files.filter((n) => QUICK_CHECK_FILE.test(n));
    const loaded = new Map<string, Uint8Array>();
    await Promise.all(
      wanted.map(async (n) => {
        const r = await fetch(`./${g.path}${n}`).catch(() => undefined);
        if (r?.ok) loaded.set(n, new Uint8Array(await r.arrayBuffer()));
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
    quick: () => cached(`game:${g.id}`, quick),
    deep: async () => {
      const files = await loadHostedGame(g);
      // Listed files that did not load are reported as unreadable.
      const src: FileSource = { names: () => [...g.files].sort(), get: (n) => files.get(n) };
      return checkGame(src, g.gam ?? undefined, { deep: true });
    },
  };
}

/** A game being made in this browser. */
export function projectTarget(id: string, title: string, updated: number): HealthTarget {
  const load = async (deep: boolean): Promise<Issue[]> => {
    const p = await loadProject(id);
    if (!p) return [];
    return checkGame(p.files, p.record.gam, { deep });
  };
  return {
    title,
    quick: () => cached(`project:${id}:${updated}`, () => load(false)),
    deep: () => load(true),
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

export function healthBadge(target: HealthTarget): HTMLElement {
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
      badge.tabIndex = 0;
      badge.classList.add(worst);
      const errors = issues.filter((i) => i.severity === 'error').length;
      const label = errors ? `${errors} problem${errors === 1 ? '' : 's'}` : `${issues.length} warning${issues.length === 1 ? '' : 's'}`;
      badge.title = `${label}: ${issues[0].message}${issues.length > 1 ? ' …' : ''} (click for the full report)`;
      badge.setAttribute('aria-label', `${target.title}: ${label}. Show the report.`);
    });
  seen.observe(badge);
  return badge;
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
  const shown = modal(`${target.title}: health check`, (close) => [
    body,
    h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
  ]);
  const issues = await target.deep().catch((e: Error) => [{ severity: 'error', kind: 'unreadable', message: `The check failed: ${e.message}` } as Issue]);
  const groups = new Map<Issue['kind'], Issue[]>();
  for (const i of issues) groups.set(i.kind, [...(groups.get(i.kind) ?? []), i]);
  const errors = issues.filter((i) => i.severity === 'error').length;
  body.replaceChildren(
    h(
      'p',
      { class: `health-summary ${worstSeverity(issues) ?? 'ok'}` },
      !issues.length
        ? '✓ No problems found: every file the game names is there and every file can be read.'
        : errors
          ? `${errors} problem${errors === 1 ? '' : 's'} may stop parts of this game from showing or playing as intended${issues.length > errors ? `, and ${issues.length - errors} smaller warning${issues.length - errors === 1 ? '' : 's'}` : ''}.`
          : `${issues.length} warning${issues.length === 1 ? '' : 's'}; the game should still play.`,
    ),
    ...[...groups].map(([kind, list]) =>
      h(
        'section',
        null,
        h('h4', null, `${KIND_TITLES[kind]} (${list.length})`),
        h(
          'ul',
          null,
          ...list.map((i) => {
            const href = i.file ? target.fileHref?.(i.file) : undefined;
            return h(
              'li',
              { class: i.severity },
              h('span', { class: 'sev', 'aria-label': i.severity }, i.severity === 'error' ? '⚠' : 'ⓘ'),
              ' ',
              href ? h('a', { href }, i.message) : i.message,
            );
          }),
        ),
      ),
    ),
  );
  await shown;
}
