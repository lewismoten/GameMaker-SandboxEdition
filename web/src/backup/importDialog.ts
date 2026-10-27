// The Restore dialog: one choice for every part at the top (Merge, Prefer the file, Prefer this
// browser, Replace what's here), then one row a part the file holds: its checkbox, name, count,
// size, its own choice (shown as set here when it differs from the one above) and a button that
// opens what it would change, worked out live; the games that clash by id get a choice each in
// My games' details. Only the list scrolls; the foot (the safety backup, the count, the buttons)
// stays in view. Then what changed, and a reload.
import { h, modal, toast } from '../editor/core/ui';
import { plainError } from '../editor/core/plainError';
import { makeBackup, snapshot, type ReadBackup } from './file';
import type { SectionId } from './inventory';
import { planImport, projectClashes, type ImportChoices, type Mode, type SectionChange } from './plan';
import { SECTIONS, sectionById } from './sections';
import { plural, type ProjectChoice } from './sections/types';
import { readWorld } from './world';
import { applyImport } from './applyImport';
import { saveFile } from './exportDialog';
import { formatBytes } from './formatBytes';

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'an unknown date' : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

/** The choices, short for the rows, and what each does for the one at the top. */
const MODES: [Mode, string, string, string][] = [
  ['merge', 'Merge', 'Merge', 'Merge: nothing found is lost, the higher score stays, and a clash keeps the safer side.'],
  ['theirs', 'Prefer the file', 'Prefer file', 'Merge, and wherever both have something different, the file’s wins.'],
  ['mine', 'Prefer this browser', 'Prefer browser', 'Merge, and wherever both have something different, this browser’s wins.'],
  ['replace', 'Replace what’s here', 'Replace', 'Each part ticked becomes just what the file holds.'],
];

type ProjectPick = ProjectChoice | 'auto';
const PROJECT_CHOICES: [ProjectPick, string][] = [
  ['auto', 'As My games is set'],
  ['both', 'Keep both'],
  ['replace', 'Use the file’s'],
  ['skip', 'Keep mine only'],
];

function select<T extends string>(attrs: Record<string, string>, options: [T, string][], value: T, onchange: (v: T) => void): HTMLSelectElement {
  const s = h('select', attrs, ...options.map(([v, label]) => h('option', { value: v, selected: v === value }, label)));
  s.addEventListener('change', () => onchange(s.value as T));
  return s;
}

const MODE_OPTIONS = MODES.map(([v, label]) => [v, label] as [Mode, string]);
const ROW_OPTIONS = MODES.map(([v, , short]) => [v, short] as [Mode, string]);

/** Shows what the file holds and brings back what is chosen; resolves once closed. */
export async function importDialog(backup: ReadBackup): Promise<void> {
  const world = await readWorld();
  const inFile = SECTIONS.filter((s) => backup.payloads[s.id] !== undefined);
  const missing = SECTIONS.filter((s) => backup.payloads[s.id] === undefined);
  const items = new Map(backup.manifest.sections.map((s) => [s.id, s.items]));
  const clashes = projectClashes(world, backup);
  let blanket: Mode = 'merge';
  const modes = new Map<SectionId, Mode>(inFile.map((s) => [s.id, 'merge']));
  const ticked = new Set<SectionId>(inFile.map((s) => s.id));
  const projects: ImportChoices['projects'] = {};
  const choices = (): ImportChoices => ({
    sections: Object.fromEntries([...ticked].map((id) => [id, modes.get(id)!])),
    projects,
  });

  const done = await modal<SectionChange[]>('Restore from a backup', (close) => {
    const safety = h('input', { type: 'checkbox', id: 'backup-safety', checked: true });
    const go = h('button', { type: 'submit', class: 'primary' }, 'Restore');
    const status = h('p', { class: 'backup-status', role: 'status' });
    const blanketNote = h('p', { class: 'backup-about', id: 'restore-all-about' }, MODES[0][3]);
    const rowUi = new Map<SectionId, { mode: HTMLSelectElement; custom: HTMLElement; more: HTMLButtonElement; list: HTMLElement }>();
    let version = 0;

    async function refresh() {
      const mine = ++version;
      const { changes } = await planImport(world, backup, choices(), { newId: () => 'preview' });
      if (mine !== version) return;
      for (const [id, ui] of rowUi) {
        const c = changes.find((x) => x.id === id);
        const lines = !c ? ['Left as it is'] : c.lines.length ? c.lines : ['Nothing to change'];
        ui.list.replaceChildren(...lines.map((l) => h('li', null, l)));
        const n = c?.lines.length ?? 0;
        ui.more.firstChild!.textContent = !c ? 'Left alone' : n ? plural(n, ['change', 'changes']) : 'No change';
        ui.mode.disabled = !ticked.has(id);
        const custom = modes.get(id) !== blanket;
        ui.custom.hidden = !custom;
        ui.mode.classList.toggle('overridden', custom);
      }
      const n = ticked.size;
      go.disabled = !n;
      const bytes = [...ticked].reduce((a, id) => a + (backup.sizes[id] ?? 0), 0);
      status.textContent = n ? `${n} of ${inFile.length} parts chosen · about ${formatBytes(bytes)} before packing` : 'Choose at least one part to bring back.';
    }

    const all = select({ id: 'restore-all', 'aria-describedby': 'restore-all-about' }, MODE_OPTIONS, 'merge', (m) => {
      blanket = m;
      blanketNote.textContent = MODES.find(([v]) => v === m)![3];
      for (const [id, ui] of rowUi) {
        modes.set(id, m);
        ui.mode.value = m;
      }
      void refresh();
    });

    const rows = inFile.map((s) => {
      const box = h('input', { type: 'checkbox', id: `restore-${s.id}`, checked: true });
      const custom = h(
        'span',
        { class: 'brow-custom', id: `restore-${s.id}-custom`, hidden: true, title: 'Set for this part, not as the choice above' },
        'set here',
      );
      const mode = select(
        { id: `restore-${s.id}-mode`, class: 'brow-mode', 'aria-label': `How to restore ${s.title}`, 'aria-describedby': custom.id },
        ROW_OPTIONS,
        'merge',
        (m) => {
          modes.set(s.id, m);
          void refresh();
        },
      );
      box.addEventListener('change', () => {
        if (box.checked) ticked.add(s.id);
        else ticked.delete(s.id);
        void refresh();
      });
      const list = h('ul', { class: 'backup-changes' }, h('li', null, 'Working it out…'));
      const details = h(
        'div',
        { class: 'brow-details', id: `restore-${s.id}-details`, hidden: true },
        list,
        s.id === 'projects' && clashes.length ? projectChoices() : null,
      );
      const more = h(
        'button',
        {
          type: 'button',
          class: 'brow-more',
          'aria-expanded': 'false',
          'aria-controls': details.id,
          title: `What restoring ${s.title} changes`,
          onclick: () => {
            details.hidden = !details.hidden;
            more.setAttribute('aria-expanded', String(!details.hidden));
          },
        },
        h('span', null, '…'),
        h('span', { class: 'brow-caret', 'aria-hidden': 'true' }, '▾'),
      );
      rowUi.set(s.id, { mode, custom, more, list });
      const n = items.get(s.id) ?? 0;
      return h(
        'li',
        { class: 'brow' },
        h(
          'div',
          { class: 'brow-line' },
          h(
            'div',
            { class: 'brow-a' },
            h('label', { class: 'brow-name', for: box.id, title: `${s.title}: ${s.description}` }, box, h('span', null, s.short)),
            h('span', { class: 'brow-count' }, n ? plural(n, s.unit) : 'empty'),
          ),
          h('div', { class: 'brow-b' }, h('span', { class: 'brow-size' }, formatBytes(backup.sizes[s.id] ?? 0)), custom, mode, more),
        ),
        details,
      );
    });

    function projectChoices(): HTMLElement {
      return h(
        'div',
        { class: 'restore-extra' },
        h('p', null, clashes.length === 1 ? 'A game in the file is here already, changed:' : 'These games in the file are here already, changed:'),
        h(
          'ul',
          null,
          ...clashes.map((c, i) =>
            h(
              'li',
              null,
              h('label', { for: `restore-clash-${i}` }, c.name === c.here ? `“${c.name}”` : `“${c.name}” (here: “${c.here}”)`),
              select({ id: `restore-clash-${i}` }, PROJECT_CHOICES, 'auto', (v) => {
                if (v === 'auto') delete projects[c.id];
                else projects[c.id] = v;
                void refresh();
              }),
            ),
          ),
        ),
      );
    }

    void refresh();
    const m = backup.manifest;
    return h(
      'form',
      {
        class: 'backup restore',
        onsubmit: async (e: Event) => {
          e.preventDefault();
          if (!ticked.size) return;
          go.disabled = true;
          status.textContent = 'Restoring…';
          try {
            if (safety.checked) {
              const before = await makeBackup(await snapshot(await readWorld()), [...SECTIONS.map((s) => s.id)]);
              saveFile(before.name.replace(/\.gmbackup$/, '-before-restore.gmbackup'), before.bytes);
            }
            const plan = await applyImport(backup, choices());
            close(plan.changes);
          } catch (err) {
            go.disabled = false;
            status.textContent = `Nothing more was changed: ${plainError(err)}`;
          }
        },
      },
      h(
        'p',
        { class: 'backup-lead' },
        `A backup made ${when(m.created)}${m.site?.version ? ` by version ${m.site.version}` : ''}. Only the parts ticked here are changed.`,
      ),
      h('div', { class: 'restore-all' }, h('label', { for: all.id }, 'For every part'), all, blanketNote),
      h(
        'div',
        { class: 'backup-sections', role: 'group', 'aria-labelledby': 'backup-legend' },
        h('div', { class: 'backup-bar' }, h('h3', { id: 'backup-legend', class: 'backup-legend' }, 'What to bring back')),
        h(
          'div',
          { class: 'backup-scroll' },
          h('ul', { class: 'backup-list' }, ...rows),
          missing.length
            ? h('p', { class: 'backup-about backup-note' }, `Not in this file, left as they are: ${missing.map((s) => s.short).join(', ')}.`)
            : null,
          backup.unknown.length
            ? h('p', { class: 'backup-about backup-note' }, `Skipped, from a newer version of the site: ${backup.unknown.join(', ')}.`)
            : null,
        ),
      ),
      h(
        'div',
        { class: 'backup-foot' },
        h('label', { class: 'backup-check', for: safety.id }, safety, h('span', null, 'First download a backup of everything here now')),
        status,
        h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), go),
      ),
    );
  });
  if (done) await resultDialog(done);
}

const DONE: Record<Mode, string> = { merge: 'merged', theirs: 'merged, the file preferred', mine: 'merged, this browser preferred', replace: 'replaced' };

async function resultDialog(changes: SectionChange[]): Promise<void> {
  const changed = changes.filter((c) => c.lines.length);
  const reload = await modal<boolean>('Restored', (close) =>
    h(
      'div',
      { class: 'backup restore-done' },
      changed.length
        ? h(
            'div',
            { class: 'backup-scroll' },
            h(
              'ul',
              { class: 'backup-list' },
              ...changed.map((c) =>
                h(
                  'li',
                  null,
                  h('strong', null, `${sectionById(c.id)!.title} (${DONE[c.mode]})`),
                  h('ul', { class: 'backup-changes' }, ...c.lines.map((l) => h('li', null, l))),
                ),
              ),
            ),
          )
        : h('p', null, 'Everything in the file was here already; nothing changed.'),
      changed.length ? h('p', { class: 'backup-lead' }, 'Reload the page so everything open shows what came back.') : null,
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(false) }, 'Close'),
        changed.length ? h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(true) }, 'Reload the page') : null,
      ),
    ),
  );
  if (reload) location.reload();
  else if (changed.length) toast('Restored. Reload the page to see everything.');
}
