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
    line.append('Not used by any scene yet: choose it for a scene in ', h('button', { class: 'used-by-link', onclick: () => openInEditor(project, project.gam) }, project.gam), '.');
    return line;
  }
  line.append('Used by ');
  [...scenes, ...scripts].forEach((u, i) => {
    if (i) line.append(', ');
    line.append(h('button', { class: 'used-by-link', title: `Open ${u.file}`, onclick: () => openInEditor(project, u.file) }, u.text));
  });
  line.append('.');
  return line;
}

/** "Delete forest.bbl? Meadow · background block set and slide show title.lst use it…" */
export function deleteMessage(project: Project, file: string): string {
  const uses = [...sceneUses(project, file), ...scriptUses(project, file)].map((u) => u.text);
  if (!uses.length) return `Delete ${file}? No scene, slide show or backdrop uses it.`;
  const list = uses.length > 6 ? `${uses.slice(0, 6).join('; ')} and ${uses.length - 6} more` : uses.join('; ');
  return `Delete ${file}? It is still used by: ${list}. They will be missing it until you choose another file.`;
}
