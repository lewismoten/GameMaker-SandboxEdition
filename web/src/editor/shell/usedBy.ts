// "Used by" under a file's name (the scenes, slide shows and backdrops that use it), and the
// delete question that names them, so nothing in use is deleted by surprise.
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { openInEditor, sceneUses, scriptUses } from '../core/uses';

/** The line under the file's name: where it is used, each a link, or a tip when nothing uses it. */
export function usedByLine(project: Project, file: string): HTMLElement {
  const scenes = sceneUses(project, file);
  const scripts = scriptUses(project, file);
  const line = h('p', { class: 'meta used-by' });
  if (!scenes.length && !scripts.length) {
    line.append(
      'Not used by any scene yet: choose it for a scene in ',
      h('button', { class: 'used-by-link', onclick: () => openInEditor(project, project.gam) }, project.gam),
      '.',
    );
    return line;
  }
  // a palette or sound set can be used by twenty scenes: the first few, and the rest on request,
  // so the line stays one line and the editor below keeps its room
  const uses = [...scenes, ...scripts];
  const link = (u: (typeof uses)[number]) =>
    h('button', { class: 'used-by-link', title: `Open ${u.file}`, onclick: () => openInEditor(project, u.file) }, u.text);
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
            title: 'Show every scene and script that uses it',
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

/** How many uses the line names before "and N more". */
const SHOWN = 3;

/** "Delete forest.bbl? Meadow · background block set and slide show title.lst use it…" */
export function deleteMessage(project: Project, file: string): string {
  const uses = [...sceneUses(project, file), ...scriptUses(project, file)].map((u) => u.text);
  if (!uses.length) return `Delete ${file}? No scene, slide show or backdrop uses it.`;
  const list = uses.length > 6 ? `${uses.slice(0, 6).join('; ')} and ${uses.length - 6} more` : uses.join('; ');
  return `Delete ${file}? It is still used by: ${list}. They will be missing it until you choose another file.`;
}
