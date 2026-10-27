// The DOS player dialog's Files tab: the extension the DOS download gives each kind of file
// (dosPlayer/fileExtensions.ts), with Acord Games' set as a preset and a Reset. The player's own
// kinds patch its .EXE; the rest are only renamed, with their names in the .gam rewritten.
import { h } from '../../../core/ui';
import { ACORD_EXTENSIONS, EXT_KINDS, extId, extValueProblem, extensionClashes } from '../../../../dosPlayer/fileExtensions';
import type { PlayerPatches } from '../../../../dosPlayer/patchRules';

interface FileFieldsContext {
  /** Prefix for element ids, unique to the dialog. */
  id: string;
  /** The dialog's patches, changed in place. */
  patches: PlayerPatches;
  /** Saves the patches (and redraws the tab after a preset). */
  save: (rerender: boolean) => void;
}

const SECTIONS = [
  {
    label: 'Opened by the player',
    note: 'The DOS download’s .EXE is patched to look for these, and the game’s files are renamed to match.',
    own: true,
  },
  {
    label: 'Named in the .gam',
    note: 'The .EXE needs no change for these: the files are renamed and their names in the .gam rewritten.',
    own: false,
  },
];

/** The Files tab's contents. */
export function fileFields({ id, patches, save }: FileFieldsContext): HTMLElement[] {
  const errors = new Map<string, HTMLElement>();
  const inputs = new Map<string, HTMLInputElement>();

  const set = (ext: string, raw: string) => {
    const v = raw.trim().toLowerCase();
    const err = errors.get(ext)!;
    const next = { ...patches };
    if (!v || v === ext) delete next[extId(ext)];
    else next[extId(ext)] = v;
    const problem = v && v !== ext ? (extValueProblem(ext, v) ?? extensionClashes(next).get(ext)) : undefined;
    err.hidden = !problem;
    err.textContent = problem ? `Not saved: ${problem}.` : '';
    inputs.get(ext)!.setAttribute('aria-invalid', String(!!problem));
    if (problem) return;
    if (next[extId(ext)] === undefined) delete patches[extId(ext)];
    else patches[extId(ext)] = v;
    save(false);
  };

  const field = (ext: string, label: string, note: string) => {
    const fid = `${id}-ext-${ext}`;
    const err = h('p', { class: 'dp-error', id: `${fid}-err`, hidden: true });
    const input = h('input', {
      type: 'text',
      id: fid,
      class: 'dp-text dp-ext-input',
      value: (patches[extId(ext)] as string | undefined) ?? ext,
      maxlength: '3',
      size: '4',
      spellcheck: false,
      autocomplete: 'off',
      'aria-describedby': note ? `${fid}-note ${fid}-err` : `${fid}-err`,
      oninput: () => set(ext, input.value),
      onblur: () => {
        if (!input.value.trim()) input.value = ext;
      },
    });
    errors.set(ext, err);
    inputs.set(ext, input);
    return h(
      'div',
      { class: 'dp-field dp-ext' },
      h('label', { for: fid }, `${label} (.${ext})`),
      h('div', { class: 'dp-row' }, h('span', { 'aria-hidden': 'true' }, '.'), input, note ? h('span', { class: 'dp-note', id: `${fid}-note` }, note) : null),
      err,
    );
  };

  const preset = (to: Record<string, string> | null) => {
    for (const k of EXT_KINDS) delete patches[extId(k.ext)];
    if (to) for (const [ext, v] of Object.entries(to)) patches[extId(ext)] = v;
    save(true);
  };

  return [
    h(
      'p',
      { class: 'dp-note' },
      'Give the DOS download’s files other extensions, as Acord Games did. This only changes the DOS download: the project, Play and the web-page and native exports keep Game-Maker’s own names. It stops other copies of Game-Maker 3.0 from opening the game’s files, but it is not real protection, because this editor’s import renames them back. Each new extension is 3 letters or digits, and no two kinds may share one.',
    ),
    h(
      'div',
      { class: 'dp-presets', role: 'group', 'aria-label': 'File extension presets' },
      h('button', { type: 'button', onclick: () => preset(ACORD_EXTENSIONS) }, 'Acord style (.z0?)'),
      h('button', { type: 'button', onclick: () => preset(null) }, 'Reset'),
    ),
    ...SECTIONS.map((s) =>
      h(
        'section',
        { class: 'dp-section' },
        h('h3', null, s.label),
        h('p', { class: 'dp-note' }, s.note),
        ...EXT_KINDS.filter((k) => !!k.offsets.length === s.own).map((k) => field(k.ext, k.label, k.note)),
      ),
    ),
  ];
}
