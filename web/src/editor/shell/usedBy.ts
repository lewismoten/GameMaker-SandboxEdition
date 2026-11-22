// File references in the editor header and the replace and delete confirmations.
import { normalize } from '../../project/files';
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { openInEditor, sceneUses, fileUses, embeddedFiles } from '../core/uses';

/** The line under the file's name: where it is used, each a link, or a tip when nothing uses it. */
export function usedByLine(project: Project, file: string): HTMLElement {
  const uses = fileUses(project, file);
  const line = h('p', { class: 'meta used-by', dataset: { count: String(uses.length) } });
  if (!uses.length) {
    line.append('No known references. Open ', h('button', { class: 'used-by-link', onclick: () => openInEditor(project, project.gam) }, project.gam), '.');
    return line;
  }
  // a palette or sound set can be used by twenty scenes: the first few, and the rest on request,
  // so the line stays one line and the editor below keeps its room
  const link = (u: (typeof uses)[number]) =>
    h(
      'button',
      { class: 'used-by-link', title: `Open ${u.file}`, onclick: () => openInEditor(project, u.file, u.scene === undefined ? {} : { scene: u.scene }) },
      u.text,
    );
  const show = (all: boolean) => {
    const shown = all || uses.length <= SHOWN + 1 ? uses : uses.slice(0, SHOWN);
    line.replaceChildren('Used by ');
    shown.forEach((u, i) => {
      if (i) line.append(', ');
      line.append(link(u));
    });
    if (shown.length < uses.length)
      line.append(
        ' and ',
        h(
          'button',
          {
            class: 'used-by-link used-by-more',
            title: 'Show every reference',
            onclick: () => {
              show(true);
              line.querySelectorAll<HTMLElement>('.used-by-link')[SHOWN]?.focus();
            },
          },
          `${uses.length - shown.length} more`,
        ),
      );
    line.append('.');
  };
  show(false);
  return line;
}

/** "Uses" for a list of files: each a link that opens it (so the breadcrumb and Back work), or nothing when none exist. */
function usesLine(project: Project, files: readonly string[]): HTMLElement | null {
  const found = [...new Set(files.map(normalize))].filter((name) => name && project.files.has(name));
  if (!found.length) return null;
  const line = h('p', { class: 'meta used-by uses', dataset: { count: String(found.length) } }, 'Uses ');
  found.forEach((f, i) => {
    if (i) line.append(', ');
    line.append(h('button', { class: 'used-by-link', title: `Open ${f}`, onclick: () => openInEditor(project, f) }, f));
  });
  line.append('.');
  return line;
}

/** Embedded files, or the block sets and monster definitions paired with a map by its scenes. */
export function fileDependenciesLine(project: Project, file: string): HTMLElement | null {
  if (!normalize(file).endsWith('.map')) return usesLine(project, embeddedFiles(project, file));
  const scenes = project.game().scenes;
  const files = sceneUses(project, file).flatMap((u) => (scenes[u.scene!]?.files ?? []).filter((f) => /\.(bbl|mon)$/i.test(f)));
  return usesLine(project, files);
}

/** How many uses the line names before "and N more". */
const SHOWN = 3;

/** The same owners shown in the editor, limited to keep confirmations readable. */
function ownerList(project: Project, file: string): string {
  const uses = fileUses(project, file).map((u) => u.text);
  return uses.length > 6 ? `${uses.slice(0, 6).join('; ')} and ${uses.length - 6} more` : uses.join('; ');
}

export function replaceMessage(project: Project, file: string, source: string): string {
  const list = ownerList(project, file);
  return `Replace ${file.toUpperCase()} with the copied ${source.toUpperCase()}? Its current contents and editor extras will be replaced.${list ? ` Used by: ${list}.` : ''}`;
}

export function deleteMessage(project: Project, file: string): string {
  const list = ownerList(project, file);
  return list ? `Delete ${file}? It is still used by: ${list}.` : `Delete ${file}? No known references.`;
}
