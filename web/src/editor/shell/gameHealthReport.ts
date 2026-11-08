// The report a health badge or note opens (gameHealth.ts): every file read with its format's
// reader, the problems grouped by kind, and for a copy of a released game what came with the
// original. Loaded when one is pressed (or the editor's overview asks for it).
import { h, modal } from '../core/ui';
import type { Issue } from '../../project/health';
import type { HealthTarget } from './gameHealth';

const KIND_TITLES: Record<Issue['kind'], string> = {
  game: 'The game file',
  missing: 'Missing files',
  link: 'Broken links between scenes',
  unreadable: 'Files that can’t be read',
  empty: 'Empty files',
  name: 'File names DOS can’t use',
  dos: 'Animations DOS can’t play',
};

export async function showHealthReport(target: HealthTarget): Promise<void> {
  const body = h('div', { class: 'health-report', dataset: { listArea: '' } }, h('p', { class: 'meta' }, 'Checking every file…'));
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
        h('h3', null, title(kind, items.length)),
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
  const { worstSeverity } = await import('../../project/health');
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
            h('h3', null, 'About this edition'),
            h('ul', null, ...notes.map((n) => h('li', { class: 'warning' }, h('span', { class: 'sev', 'aria-label': 'note' }, 'ⓘ'), ' ', n))),
          ),
        ]
      : []),
  );
  await shown;
}
