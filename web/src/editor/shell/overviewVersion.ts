// Overview › Tools › Version: the game's version and a switch to letter it ("v1.0") on the lower right of
// the title menu picture. Editor-only (the companion, project/companion.ts): the saved files never change;
// only what Play and Export are handed is stamped (project/composeFiles.ts). Off unless the author turns
// it on. The picture beside it is the real menu picture with the stamp, drawn from the game's own files.
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { emptyCompanion, menuVersionOf, VERSION_PATTERN } from '../../project/companion';

export function versionCard(project: Project): HTMLElement {
  const now = menuVersionOf(project.companion);
  const input = h('input', {
    type: 'text',
    id: 'game-version',
    value: now.version,
    maxlength: '10',
    placeholder: '1.0',
    autocomplete: 'off',
    'aria-describedby': 'game-version-hint',
  });
  const show = h('input', { type: 'checkbox', id: 'game-version-show' });
  show.checked = now.show;
  const hint = h('p', { class: 'hint', id: 'game-version-hint' });
  const status = h('p', { class: 'tool-status', role: 'status' });
  const picture = h('div', { class: 'tool-pic version-pic' });

  const render = async (): Promise<void> => {
    const version = input.value.trim();
    const bad = !!version && !VERSION_PATTERN.test(version);
    input.setAttribute('aria-invalid', String(bad));
    show.disabled = !version || bad;
    const on = show.checked && !!version && !bad;
    hint.textContent = bad
      ? 'Use up to 10 letters, digits, dots, dashes or pluses, such as 1.0 or 2.1-beta.'
      : 'Players see it in the lower right of the title menu, in Play and in every download. The saved game files stay as they are.';
    status.textContent = on ? `The menu shows v${version}` : version ? `Version ${version}, not shown on the menu` : 'No version set';
    // the real menu picture (the start scene's menu graphic), stamped as Play and Export will have it
    try {
      const [{ composeFiles }, { decodeGif, isGif }, { paintIndexed }] = await Promise.all([
        import('../../project/composeFiles'),
        import('@lewismoten/gamemaker-sandbox-engine/formats/gif'),
        import('../core/draw'),
      ]);
      const shown = composeFiles(project.files, { ...(project.companion ?? emptyCompanion()), gameVersion: version, showVersion: on });
      const bytes = shown.get(project.game().scenes[0]?.files[2]);
      if (!bytes || !isGif(bytes)) return picture.replaceChildren();
      const img = decodeGif(bytes);
      const canvas = h('canvas', {
        class: 'version-img',
        role: 'img',
        'aria-label': on ? `The title menu with v${version} in the lower right` : 'The title menu',
      });
      paintIndexed(canvas, img.pixels, img.width, img.height, img.palette);
      picture.replaceChildren(canvas);
    } catch {
      picture.replaceChildren();
    }
  };
  const save = () => {
    const version = input.value.trim();
    const ok = !version || VERSION_PATTERN.test(version);
    if (ok) project.setMenuVersion(version, show.checked && !!version);
    void render();
  };
  input.addEventListener('input', save);
  show.addEventListener('change', save);
  void render();
  return h(
    'li',
    { class: 'tool-card' },
    picture,
    h(
      'div',
      { class: 'tool-body' },
      h('h3', { id: 'tool-version' }, 'Game version'),
      status,
      h('div', { class: 'version-field' }, h('label', { for: 'game-version' }, 'Version'), input),
      h('div', { class: 'version-field' }, show, h('label', { for: 'game-version-show' }, 'Show the version on the title menu')),
      hint,
    ),
  );
}
