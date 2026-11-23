// On a phone the "Used by" and "Uses" lines fold into one button ("Used by 1 · Uses 2 ▸") so the
// editor below starts higher up (editorHead.css). A wide screen shows the lines as they are.
import type { Project } from '../core/project';
import { SCENE_SECTION } from '../editors/animation/scene/sceneModel';
import { usedByLine, fileDependenciesLine } from './usedBy';
import { h } from '../core/ui';

/** The open file's reference lines and the phone button that discloses them. */
export function fileRefs(project: Project, file: string) {
  const btn = h('button', { type: 'button', class: 'refs-toggle' });
  const refs = h('div', { class: 'file-refs' }, btn);
  let label = '';
  const show = (open: boolean) => {
    refs.classList.toggle('refs-open', open);
    btn.textContent = `${label} ${open ? '▾' : '▸'}`;
    btn.setAttribute('aria-expanded', String(open));
    btn.title = open ? 'Hide where this file is used' : 'Show where this file is used';
  };
  const refresh = () => {
    const by = usedByLine(project, file);
    const uses = fileDependenciesLine(project, file);
    refs.querySelectorAll('.used-by').forEach((line) => line.remove());
    refs.append(by);
    if (uses) refs.append(uses);
    label = `Used by ${by.dataset.count}${uses ? ` · Uses ${uses.dataset.count}` : ''}`;
    show(refs.classList.contains('refs-open'));
  };
  btn.addEventListener('click', () => show(!refs.classList.contains('refs-open')));
  refresh();
  const dispose = project.onExtrasChange((_owner, section) => {
    if (section === SCENE_SECTION) refresh();
  });
  return { el: refs, dispose };
}
