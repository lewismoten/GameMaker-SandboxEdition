// Read-only scene names and roles beside map filenames, shared by Overview and the file list.
// Load the Integrator's data reader on demand, without loading the file-kind editor itself.
import type { Project } from '../core/project';
import { h } from '../core/ui';

export function sceneFileLabels(project: Project, file: string): HTMLElement | null {
  if (!file.toLowerCase().endsWith('.map')) return null;
  const label = h('small', { class: 'meta scene-file-roles', 'data-scene-file': file });
  void import('../editors/integrator/sceneRole').then(({ mapSceneLabels }) => {
    label.textContent = mapSceneLabels(project.game(), file, project.files).join('; ');
  });
  return label;
}

/** Refresh existing labels after edits without replacing file buttons or moving focus. */
export function refreshSceneFileLabels(project: Project, root: HTMLElement): void {
  void import('../editors/integrator/sceneRole').then(({ mapSceneLabels }) => {
    for (const label of root.querySelectorAll<HTMLElement>('[data-scene-file]')) {
      label.textContent = mapSceneLabels(project.game(), label.dataset.sceneFile!, project.files).join('; ');
    }
  });
}
