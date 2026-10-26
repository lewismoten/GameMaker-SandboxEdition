// "New animation" offers the animation maker: a blank scene or a generated intro, cast or
// story, saved as a new .FLI (and its scene in the companion) and opened in the Scene maker.
// Only this small part loads with the file picker; the maker itself loads when chosen.
import type { Project } from '../../../core/project';
import { registerMaker } from '../../../tools/makers';

async function makeScene(project: Project): Promise<string | undefined> {
  const [{ h, modal }] = await Promise.all([import('../../../core/ui'), import('./scene.css')]);
  const kinds = [
    ['blank', '🎬 A blank scene', 'Start with an empty picture and add text, characters, monsters and blocks.'],
    ['intro', '🎬 Intro', 'The title over the first level, with the hero walking across.'],
    ['cast', '🎭 Cast', 'Each hero and monster in turn, close up, with a name card.'],
    ['story', '📜 Story', 'The story text typed over the levels.'],
  ] as const;
  const kind = await modal<(typeof kinds)[number][0]>('Make an animation', (close) =>
    h(
      'div',
      { class: 'stack scn-generate' },
      ...kinds.map(([k, label, about]) =>
        h('button', { type: 'button', class: 'scn-gen-choice', onclick: () => close(k) }, h('strong', null, label), h('span', null, about)),
      ),
    ),
  );
  if (!kind) return undefined;
  const [{ emptyScene, SCENE_SECTION }, { generateScene }, { sceneAssets }, { renderScene, sceneFli }] = await Promise.all([
    import('./sceneModel'),
    import('./sceneGenerate'),
    import('./sceneAssets'),
    import('./sceneRender'),
  ]);
  const src = {
    files: project.files,
    game: () => project.game(),
    paletteFor: (f: string) => project.paletteFor(f),
    name: project.name,
    extras: <T>(f: string, s: string, fb: T) => project.extras(f, s, fb),
  };
  const scene = kind === 'blank' ? emptyScene() : generateScene(kind, src);
  const name = project.freeName(kind === 'blank' ? 'scene' : kind, 'fli');
  project.setExtras(name, SCENE_SECTION, scene);
  project.files.set(name, sceneFli(scene, renderScene(scene, sceneAssets(scene, src))));
  return name;
}

registerMaker('fli', { label: '🎬 Make a scene (intro, cast, story)…', run: makeScene });
