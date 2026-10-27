// One tab of the DOS player dialog: every field of one screen, in its sections (screenTabs.ts).
// Positions pair each x with its y; the menu's words and marker also move together, with each
// word's own position folded away below; a screen's two frames share one field.
import { h } from '../../../core/ui';
import type { FramePatch, NumberPatch, PatchEntry, PatchScreen, TextPatch } from '../../../../dosPlayer/patchTable';
import { patchEntry } from '../../../../dosPlayer/patchRules';
import type { FieldMaker } from './playerFields';
import { screenSections, type ScreenSection } from './screenTabs';

const NOTES: Partial<Record<ScreenSection['group'], string>> = {
  words: 'Each line keeps to its length in the .EXE. Plain letters, digits and punctuation only.',
  keys: 'A key turned off just blanks the screen for a moment and play goes on.',
};

/** Numbers, with each "… x" next to its "… y" on one row. */
function positions(entries: PatchEntry[], make: FieldMaker): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i] as NumberPatch;
    const next = entries[i + 1] as NumberPatch | undefined;
    const base = /^(.*) x$/.exec(e.label)?.[1];
    if (base && next?.label === `${base} y`) {
      out.push(make.point(base, e, next));
      i++;
    } else out.push(make.number(e));
  }
  return out;
}

const MENU_APART = /^layout\.menu\.(titleX|titleY|noFile\.[xy])$/;

function sectionFields(screen: PatchScreen, s: ScreenSection, make: FieldMaker): HTMLElement[] {
  switch (s.group) {
    case 'words':
      return s.entries.map((e) => make.text(e as TextPatch));
    case 'positions':
      if (screen !== 'menu') return positions(s.entries, make);
      return [
        make.menuBlock(),
        ...positions(
          s.entries.filter((e) => MENU_APART.test(e.id)),
          make,
        ),
        h(
          'details',
          { class: 'dp-each' },
          h('summary', null, 'Each word and the marker, one by one'),
          ...positions(
            s.entries.filter((e) => !MENU_APART.test(e.id)),
            make,
          ),
        ),
      ];
    case 'frames':
      return s.entries.flatMap((e) =>
        e.kind === 'frame'
          ? e.id.endsWith('.outer')
            ? [make.frames(e, patchEntry(e.id.replace(/outer$/, 'inner')) as FramePatch)]
            : []
          : [make.number(e as NumberPatch)],
      );
    case 'colors':
      return s.entries.map((e) => (e.kind === 'rgb' ? make.rgb(e) : make.select(e as PatchEntry & { kind: 'select' })));
    case 'times':
      return s.entries.map((e) => make.number(e as NumberPatch));
    case 'keys':
      return s.entries.map((e) => make.fkey(e as PatchEntry & { kind: 'fkey' }));
  }
}

/** The tab for `screen`: a section per kind, each headed. */
export function screenFields(screen: PatchScreen, make: FieldMaker): HTMLElement[] {
  const intro =
    screen === 'all'
      ? 'The player looks for the nearest of these in each screen’s palette, so they adapt to any picture. Each screen’s Colors pick which one it uses.'
      : undefined;
  return [
    intro ? h('p', { class: 'dp-note' }, intro) : null,
    ...screenSections(screen).map((s) =>
      h(
        'section',
        { class: 'dp-section' },
        h('h3', null, s.label),
        NOTES[s.group] ? h('p', { class: 'dp-note' }, NOTES[s.group]) : null,
        ...sectionFields(screen, s, make),
      ),
    ),
  ].filter((x): x is HTMLElement => !!x);
}
