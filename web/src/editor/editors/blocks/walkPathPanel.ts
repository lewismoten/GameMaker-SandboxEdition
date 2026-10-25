// The background block editor's "Walking path" box: marks the picked blocks as a path or road
// the walkthrough bot keeps to (check/walk/walkPaths.ts, the companion file's "walkPaths"
// section of the .bbl, never in the game's files), guesses them from the set's terrains, and
// clears them. A look-only game keeps the marks in memory, so they can be tried there.
import { h } from '../../core/ui';
import type { Project } from '../../core/project';
import { guessWalkPaths, readWalkPaths, setWalkPaths } from '../../check/walk/walkPaths';

interface WalkPathPanel {
  el: HTMLElement;
  /** Shows the picked blocks' marks again (another block picked, or the marks changed). */
  refresh(): void;
}

const listOf = (n: number[]) => (n.length > 4 ? `${n.slice(0, 3).join(', ')} and ${n.length - 3} more` : n.join(', '));

export function walkPathPanel(o: {
  project: Project;
  file: string;
  /** The blocks picked in the list (the current one first when only one is). */
  picked: () => number[];
  /** Told after the marks change (to mark the block list). */
  changed: () => void;
}): WalkPathPanel {
  const { project, file } = o;
  const input = h('input', { type: 'checkbox' });
  const text = h('span');
  const check = h('label', { class: 'check walk-path-check' }, input, text);
  const count = h('p', { class: 'hint', role: 'status', 'aria-live': 'polite' });
  const terrains = () => project.extras<unknown>(file, 'terrains', []);
  const guessed = () => guessWalkPaths(Array.isArray(terrains()) ? (terrains() as Parameters<typeof guessWalkPaths>[0]) : []);
  const guessBtn = h('button', { type: 'button' }, 'Guess from terrains');
  const clearBtn = h('button', { type: 'button' }, 'Clear all');
  const set = (blocks: Iterable<number>, said: string) => {
    setWalkPaths(project, file, blocks);
    o.changed();
    refresh();
    count.textContent = `${said} ${count.textContent}`;
  };
  input.addEventListener('change', () => {
    const now = new Set(readWalkPaths(project, file));
    for (const b of o.picked()) {
      if (input.checked) now.add(b);
      else now.delete(b);
    }
    set(now, '');
  });
  guessBtn.addEventListener('click', () => {
    const g = guessed();
    set(new Set([...readWalkPaths(project, file), ...g]), `Marked ${g.length} block${g.length === 1 ? '' : 's'} from the terrains.`);
  });
  clearBtn.addEventListener('click', () => set([], 'Cleared.'));

  function refresh(): void {
    const marks = new Set(readWalkPaths(project, file));
    const picked = o.picked();
    const on = picked.filter((b) => marks.has(b)).length;
    input.checked = on > 0 && on === picked.length;
    input.indeterminate = on > 0 && on < picked.length;
    text.textContent = picked.length > 1 ? `Blocks ${listOf(picked)} are a walking path or road` : `Block ${picked[0]} is a walking path or road`;
    count.textContent = marks.size
      ? `${marks.size} block${marks.size === 1 ? '' : 's'} of this set marked: ${listOf([...marks])}.`
      : 'No blocks marked: the bot takes the quickest way.';
    const g = guessed();
    guessBtn.disabled = !g.length || g.every((b) => marks.has(b));
    guessBtn.title = g.length
      ? 'Marks the blocks of this set’s path terrains and of terrains named like a road or path (map editor’s terrain brushes)'
      : 'This set has no path terrain, or none named like a road or path, to guess from';
    clearBtn.disabled = !marks.size;
  }

  const el = h(
    'section',
    { class: 'walk-paths stack', 'aria-labelledby': `walk-paths-${file}` },
    h('h3', { id: `walk-paths-${file}` }, 'Walking path'),
    h(
      'p',
      { class: 'hint' },
      'Make a walkthrough keeps to these blocks where it costs only a little more time, the way a person walks along a road. Only the editor keeps this; the game never sees it.',
    ),
    check,
    h('div', { class: 'row' }, guessBtn, clearBtn),
    count,
  );
  refresh();
  return { el, refresh };
}
