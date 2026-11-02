// Look around the game at its checkpoint and as it is now: what changed file by file, then each
// level's map drawn both ways (Before, After, or side by side), with a jump to the next view that
// differs. Pictures are real renders of the game's own blocks and palette (gfx/levelPicture.ts).
import { diffDisks } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { ADVTYPE, parseGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { scenePixels, type LevelPicture } from '../../gfx/levelPicture';
import { GameFiles } from '../../project/files';
import type { StoredCheckpoint } from '../../project/storage';
import { clear, h, modal } from '../core/ui';
import { pictureCanvas } from './pictureCanvas';
import { sceneName } from '../core/uses';
import type { Project } from '../core/project';

const W = 16;
const H = 10;

function canvasOf(p: LevelPicture | undefined, label: string): HTMLElement {
  if (!p) return h('p', { class: 'hint' }, `${label}: nothing to draw (the level has no map, palette or blocks).`);
  const c = pictureCanvas(p);
  c.className = 'disk-compare-pic';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', label);
  return h('figure', null, c, h('figcaption', null, label));
}

const differs = (a?: LevelPicture, b?: LevelPicture) =>
  !a || !b || a.pixels.length !== b.pixels.length || a.pixels.some((v, i) => v !== b.pixels[i]) || a.palette.some((v, i) => v !== b.palette[i]);

export async function compareDialog(project: Project, cp: StoredCheckpoint): Promise<void> {
  const before = new GameFiles(Object.entries(cp.files));
  const after = project.files;
  const diff = diffDisks(new Map(Object.entries(cp.files)), new Map(after.entries()));
  let beforeGame: Game | undefined;
  try {
    beforeGame = parseGame(cp.files[project.gam]);
  } catch {
    beforeGame = undefined;
  }
  const game = project.game();
  const levels = game.scenes.map((s, i) => [s, i] as const).filter(([s]) => s.gametype === ADVTYPE);

  await modal<void>('Compare with the checkpoint', () => {
    let scene = levels[0]?.[1] ?? -1;
    let x = 0;
    let y = 0;
    let mode: 'before' | 'after' | 'both' = 'both';
    const view = h('div', { class: 'disk-compare-view' });
    const status = h('p', { role: 'status', class: 'hint' });
    const shot = (files: GameFiles, g: Game | undefined) => (g?.scenes[scene] ? scenePixels(files, g.scenes[scene], x, y, W, H) : undefined);
    const wrap = (n: number, m: number) => ((n % m) + m) % m;

    const draw = () => {
      const a = shot(before, beforeGame);
      const b = shot(after, game);
      const same = !differs(a, b);
      status.textContent = same ? 'This view looks the same before and after.' : 'This view differs.';
      const pics = [mode !== 'after' ? canvasOf(a, 'Before') : null, mode !== 'before' ? canvasOf(b, 'After') : null];
      for (const btn of root.querySelectorAll<HTMLElement>('[data-mode]')) btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
      clear(view, h('div', { class: 'disk-compare-pics' }, ...pics));
    };
    const nextDiff = () => {
      for (let k = 1; k <= 70; k++) {
        const i = wrap(Math.floor(y / H) * 7 + Math.floor(x / W) + k, 70);
        const [nx, ny] = [(i % 7) * W, Math.floor(i / 7) * H];
        const [sx, sy] = [x, y];
        [x, y] = [nx, ny];
        if (differs(shot(before, beforeGame), shot(after, game))) return draw();
        [x, y] = [sx, sy];
      }
      status.textContent = 'No other view of this level differs.';
    };
    const num = (label: string, get: () => number, set: (v: number) => void) =>
      h(
        'label',
        null,
        label,
        ' ',
        h('input', {
          type: 'number',
          min: '0',
          max: '99',
          value: String(get()),
          onchange: (e: Event) => (set(wrap(Number((e.target as HTMLInputElement).value) || 0, 100)), draw()),
        }),
      );
    const modeBtn = (m: typeof mode, text: string) =>
      h('button', { type: 'button', 'aria-pressed': String(mode === m), 'data-mode': m, onclick: () => ((mode = m), draw()) }, text);

    const files = h(
      'details',
      { open: diff.changed.length + diff.added.length + diff.removed.length < 12 },
      h('summary', null, `${diff.changed.length} changed, ${diff.added.length} added, ${diff.removed.length} removed, ${diff.unchanged} the same`),
      h(
        'ul',
        null,
        ...diff.changed.map((f) => h('li', null, h('strong', null, f.name), `: ${f.summary.join('; ') || 'changed'}`)),
        ...diff.added.map((f) => h('li', null, `+ ${f.name} (new)`)),
        ...diff.removed.map((f) => h('li', null, `− ${f.name} (gone)`)),
      ),
    );
    const root = h(
      'div',
      { class: 'disk-compare' },
      files,
      levels.length
        ? h(
            'div',
            { class: 'disk-compare-controls' },
            h(
              'label',
              null,
              'Level ',
              h(
                'select',
                { onchange: (e: Event) => ((scene = Number((e.target as HTMLSelectElement).value)), draw()) },
                ...levels.map(([, i]) => h('option', { value: String(i) }, sceneName(project, i))),
              ),
            ),
            num(
              'x',
              () => x,
              (v) => (x = v),
            ),
            num(
              'y',
              () => y,
              (v) => (y = v),
            ),
            modeBtn('before', 'Before'),
            modeBtn('after', 'After'),
            modeBtn('both', 'Side by side'),
            h('button', { type: 'button', onclick: nextDiff }, 'Next difference'),
          )
        : h('p', null, 'The game has no levels to draw.'),
      status,
      view,
    );
    draw();
    return root;
  });
}
