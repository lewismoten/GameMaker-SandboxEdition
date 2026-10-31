// The quick switcher (Ctrl+P or ⌘P): type part of a file's name, or a scene's, and press Enter
// to open it. With nothing typed it lists the files opened most recently, kept in the
// project's companion file (never among the game's files), saved with the next edit.
import { h, modal } from '../core/ui';
import { companionPatches } from '../../dosPlayer/playerRecord';
import { kindOf, KIND_LABELS, type Project } from '../core/project';
import { fileThumb } from '../widgets/thumbs';
import { sceneUses } from '../core/uses';
import { emptyCompanion, setSection } from '../../project/companion';
import './quickOpen.css';

const RECENT = 'recent';
const KEEP = 12;

/** The files opened most recently, newest first (only ones still in the project). */
export function recentFiles(project: Project): string[] {
  return project.extras<string[]>(project.gam, RECENT, []).filter((f) => project.files.has(f));
}

/**
 * Notes that a file was opened. Only the companion in memory changes: it is stored with the
 * next real save, so just looking at files never marks the game as edited.
 */
export function noteOpened(project: Project, file: string): void {
  const now = recentFiles(project);
  if (now[0] === file) return;
  project.companion ??= emptyCompanion();
  setSection(project.companion, project.gam, RECENT, [file, ...now.filter((f) => f !== file)].slice(0, KEEP));
}

interface Hit {
  file: string;
  /** What else matched (a scene's name), shown under the file name. */
  note: string;
}

/** Ranks the files for a query: names that start with it, then names that hold every word, then scenes whose name matches (opening the file they use). */
export function quickHits(project: Project, query: string): Hit[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const recent = recentFiles(project);
    const rest = project.files.names().filter((f) => !recent.includes(f));
    return [...recent.map((file) => ({ file, note: 'Opened recently' })), ...rest.map((file) => ({ file, note: '' }))];
  }
  const words = q.split(/\s+/);
  const names = project.files.names();
  const starts = names.filter((n) => n.startsWith(q));
  const holds = names.filter((n) => !starts.includes(n) && words.every((w) => n.includes(w) || KIND_LABELS[kindOf(n)].toLowerCase().includes(w)));
  const scenes: Hit[] = [];
  const game = project.game();
  game.scenes.forEach((s, i) => {
    if (!s.desc?.toLowerCase().includes(q)) return;
    for (const f of s.files)
      if (f && project.files.has(f) && ![...starts, ...holds].includes(f.toLowerCase()) && !scenes.some((x) => x.file === f.toLowerCase()))
        scenes.push({ file: f.toLowerCase(), note: `Used by ${s.desc.trim() || `scene ${i}`}` });
  });
  return [...starts, ...holds].map((file) => ({ file, note: '' })).concat(scenes);
}

/** Opens the switcher; resolves with the file chosen (or undefined). */
export function quickOpen(project: Project): Promise<string | undefined> {
  return modal<string>('Open a file', (close) => {
    const list = h('ul', { class: 'qo-list', role: 'listbox', id: 'qo-list', 'aria-label': 'Files' });
    const input = h('input', {
      type: 'search',
      class: 'qo-input',
      placeholder: 'File or scene name…',
      'aria-label': 'File or scene name',
      role: 'combobox',
      'aria-controls': 'qo-list',
      'aria-expanded': 'true',
      'aria-autocomplete': 'list',
      autocomplete: 'off',
    });
    const status = h('p', { class: 'meta qo-status', 'aria-live': 'polite' });
    // Small real thumbnails, drawn only for rows that scroll into view.
    const pictures = new WeakMap<Element, string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const file = pictures.get(entry.target);
          if (!file || !entry.target.isConnected) continue;
          let thumb: HTMLElement;
          try {
            thumb = fileThumb(file, project.files.get(file), { files: project.files, palette: project.paletteFor(file).palette, patches: companionPatches(project.companion, project.gam) });
          } catch {
            thumb = fileThumb(file, project.files.get(file), { files: project.files });
          }
          entry.target.replaceChildren(thumb);
        }
      },
      { root: list, rootMargin: '60px' },
    );
    let hits: Hit[] = [];
    let at = 0;
    const show = () => {
      const all = quickHits(project, input.value);
      hits = all.slice(0, 60);
      at = Math.min(at, Math.max(0, hits.length - 1));
      observer.disconnect();
      list.replaceChildren(
        ...hits.map((hit, i) => {
          const uses = sceneUses(project, hit.file).length;
          return h(
            'li',
            {
              id: `qo-${i}`,
              role: 'option',
              class: `qo-item${i === at ? ' active' : ''}`,
              'aria-selected': String(i === at),
              onclick: () => close(hit.file),
              onpointermove: () => i !== at && ((at = i), mark()),
            },
            preview(hit.file),
            h('span', { class: 'qo-name' }, hit.file),
            h(
              'span',
              { class: 'qo-note meta' },
              hit.note || (kindOf(hit.file) === 'gam' ? 'The game' : uses ? `In ${uses} scene slot${uses === 1 ? '' : 's'}` : KIND_LABELS[kindOf(hit.file)]),
            ),
          );
        }),
      );
      status.textContent = hits.length
        ? `${all.length > hits.length ? `The first ${hits.length} of ${all.length} files` : `${hits.length} file${hits.length === 1 ? '' : 's'}`}. ↑ ↓ to choose, Enter to open.`
        : 'No file or scene has that name.';
      mark();
    };
    function preview(file: string): HTMLElement {
      const box = h('span', { class: 'qo-icon', 'aria-hidden': 'true' });
      pictures.set(box, file);
      observer.observe(box);
      return box;
    }
    const mark = () => {
      list.querySelectorAll('.qo-item').forEach((el, i) => {
        el.classList.toggle('active', i === at);
        el.setAttribute('aria-selected', String(i === at));
      });
      if (hits.length) input.setAttribute('aria-activedescendant', `qo-${at}`);
      else input.removeAttribute('aria-activedescendant');
      list.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
    };
    input.addEventListener('input', () => ((at = 0), show()));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (hits.length) at = (at + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length;
        mark();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (hits[at]) close(hits[at].file);
      }
    });
    requestAnimationFrame(() => input.focus());
    show();
    return h('div', { class: 'qo' }, input, status, list);
  });
}
