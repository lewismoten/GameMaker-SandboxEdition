// The Restore dialog: what the chosen file holds, section by section, each ticked to bring back
// and set to Merge (the default) or Replace, with what it will change worked out as the choices
// change; a choice for each of the file's games whose id a different game has here, and for a
// save slot filled on both sides. Sections the file doesn't hold are named as left alone. A
// backup of everything here is downloaded first (on by default). Then what changed, and a reload.
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

const MODES: [Mode, string][] = [
  ['merge', 'Merge with what’s here'],
  ['replace', 'Replace what’s here'],
];

const PROJECT_CHOICES: [ProjectChoice, string][] = [
  ['both', 'Keep both'],
  ['replace', 'Replace mine'],
  ['skip', 'Skip it'],
];

function select<T extends string>(id: string, options: [T, string][], value: T, onchange: (v: T) => void): HTMLSelectElement {
  const s = h('select', { id }, ...options.map(([v, label]) => h('option', { value: v, selected: v === value }, label)));
  s.addEventListener('change', () => onchange(s.value as T));
  return s;
}

/** Shows what the file holds and brings back what is chosen; resolves once closed. */
export async function importDialog(backup: ReadBackup): Promise<void> {
  const world = await readWorld();
  const inFile = SECTIONS.filter((s) => backup.payloads[s.id] !== undefined);
  const missing = SECTIONS.filter((s) => backup.payloads[s.id] === undefined);
  const items = new Map(backup.manifest.sections.map((s) => [s.id, s.items]));
  const choices: ImportChoices = { sections: Object.fromEntries(inFile.map((s) => [s.id, 'merge'])), projects: {}, slots: 'mine' };
  const clashes = projectClashes(world, backup);

  const done = await modal<SectionChange[]>('Restore from a backup', (close) => {
    const changeLists = new Map<SectionId, HTMLElement>();
    const safety = h('input', { type: 'checkbox', id: 'backup-safety', checked: true });
    const go = h('button', { type: 'submit', class: 'primary' }, 'Restore');
    const status = h('p', { class: 'backup-status', role: 'status' });
    let version = 0;

    async function refresh() {
      const mine = ++version;
      const { changes } = await planImport(world, backup, choices, { newId: () => 'preview' });
      if (mine !== version) return;
      for (const [id, list] of changeLists) {
        const c = changes.find((x) => x.id === id);
        list.replaceChildren(
          ...(!c ? [h('li', null, 'Left as it is')] : c.lines.length ? c.lines.map((l) => h('li', null, l)) : [h('li', null, 'Nothing to change')]),
        );
      }
      const n = Object.keys(choices.sections).length;
      go.disabled = !n;
      const bytes = Object.keys(choices.sections).reduce((a, id) => a + (backup.sizes[id as SectionId] ?? 0), 0);
      status.textContent = n ? `${n} of ${inFile.length} parts chosen · about ${formatBytes(bytes)} before packing` : 'Choose at least one part to bring back.';
    }

    const rows = inFile.map((s) => {
      const box = h('input', { type: 'checkbox', id: `restore-${s.id}`, checked: true });
      const mode = select(`restore-${s.id}-mode`, MODES, 'merge', (m) => {
        choices.sections[s.id] = m;
        void refresh();
      });
      mode.classList.add('restore-mode');
      mode.setAttribute('aria-label', `How to restore ${s.title}`);
      box.addEventListener('change', () => {
        if (box.checked) choices.sections[s.id] = mode.value as Mode;
        else delete choices.sections[s.id];
        mode.disabled = !box.checked;
        void refresh();
      });
      const list = h('ul', { class: 'backup-changes', 'aria-label': `What restoring ${s.title} changes` }, h('li', null, 'Working it out…'));
      changeLists.set(s.id, list);
      const n = items.get(s.id) ?? 0;
      return h(
        'li',
        { class: 'restore-item' },
        h(
          'div',
          { class: 'restore-head' },
          h(
            'label',
            { class: 'backup-row', for: box.id },
            box,
            h(
              'span',
              { class: 'backup-text' },
              h('strong', null, s.title),
              h('span', { class: 'backup-about' }, n ? `${plural(n, s.unit)} in the file` : 'Empty in the file'),
            ),
          ),
          mode,
        ),
        list,
        s.id === 'projects' && clashes.length ? projectChoices() : null,
        s.id === 'saves' ? slotChoice() : null,
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
              select(`restore-clash-${i}`, PROJECT_CHOICES, 'both', (v) => {
                choices.projects[c.id] = v;
                void refresh();
              }),
            ),
          ),
        ),
      );
    }

    function slotChoice(): HTMLElement {
      return h(
        'div',
        { class: 'restore-extra' },
        h('label', { for: 'restore-slots' }, 'A save slot filled here and in the file'),
        select(
          'restore-slots',
          [
            ['mine', 'Keep this browser’s'],
            ['theirs', 'Use the file’s'],
          ],
          'mine',
          (v) => {
            choices.slots = v;
            void refresh();
          },
        ),
        h('p', { class: 'backup-about' }, 'The other one is kept in Save backups, so it can be brought back.'),
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
          if (!Object.keys(choices.sections).length) return;
          go.disabled = true;
          status.textContent = 'Restoring…';
          try {
            if (safety.checked) {
              const before = await makeBackup(await snapshot(await readWorld()), [...SECTIONS.map((s) => s.id)]);
              saveFile(before.name.replace(/\.gmbackup$/, '-before-restore.gmbackup'), before.bytes);
            }
            const plan = await applyImport(backup, choices);
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
      h(
        'div',
        { class: 'backup-sections', role: 'group', 'aria-labelledby': 'backup-legend' },
        h('div', { class: 'backup-bar' }, h('h3', { id: 'backup-legend', class: 'backup-legend' }, 'What to bring back')),
        h(
          'div',
          { class: 'backup-scroll' },
          h('ul', { class: 'backup-list' }, ...rows),
          missing.length
            ? h('p', { class: 'backup-about backup-note' }, `Not in this file, left as they are: ${missing.map((s) => s.title).join(', ')}.`)
            : null,
          backup.unknown.length
            ? h('p', { class: 'backup-about backup-note' }, `Skipped, from a newer version of the site: ${backup.unknown.join(', ')}.`)
            : null,
        ),
      ),
      h(
        'div',
        { class: 'backup-foot' },
        h('label', { class: 'backup-row backup-safety', for: safety.id }, safety, h('span', null, 'First download a backup of everything here now')),
        status,
        h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), go),
      ),
    );
  });
  if (done) await resultDialog(done);
}

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
                  h('strong', null, `${sectionById(c.id)!.title} (${c.mode === 'merge' ? 'merged' : 'replaced'})`),
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
