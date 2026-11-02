// Opening a second GAM must never edit, persist or query the primary game's scene model.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Project } from '../core/project';
import { makeReadOnly } from '../core/readOnly';
import { GameFiles } from '../../project/files';
import { ADVTYPE, emptyScene, newGame, parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { gameProject } from './gameProject';

function owner() {
  const main = newGame('Primary title'),
    second = newGame('Second title');
  second.scenes[1] = emptyScene(ADVTYPE);
  second.scenes[1].files[0] = 'alt.pal';
  second.scenes[1].files[2] = 'shared.bbl';
  const files = new GameFiles([
    ['main.gam', serializeGame(main)],
    ['second.gam', serializeGame(second)],
    ['alt.pal', new Uint8Array(768).fill(3)],
  ]);
  const project = new Project('scope', 'Directory name', 'main.gam', files);
  files.onChange = undefined;
  return project;
}
afterEach(() => vi.restoreAllMocks());

describe('Integrator GAM context', () => {
  it('keeps the primary context and its CD aliases unchanged', () => {
    const p = owner();
    expect(gameProject(p, 'MAIN.GAM')).toBe(p);
    p.files.set('main_g.gam', p.files.get('main.gam')!);
    p.gam = 'main-g.gam';
    expect(gameProject(p, 'MAIN_G.GAM')).toBe(p);
  });
  it('reads and writes only the opened GAM, including external undo bytes', () => {
    const p = owner(),
      primary = p.files.get('main.gam')!.slice(),
      original = p.files.get('second.gam')!.slice(),
      main = p.game(),
      scoped = gameProject(p, 'SECOND.GAM');
    expect(scoped.game().scenes[0].desc).toBe('Second title');
    const changed = scoped.game();
    changed.scenes[0].desc = 'Changed second';
    scoped.saveGame(changed);
    expect(parseGame(p.files.get('second.gam')!).scenes[0].desc).toBe('Changed second');
    expect(p.files.get('main.gam')).toEqual(primary);
    expect(p.game()).toBe(main);
    expect(main.scenes[0].desc).toBe('Primary title');
    expect(p.gam).toBe('main.gam');
    p.files.set('second.gam', original);
    expect(scoped.game().scenes[0].desc).toBe('Second title');
  });
  it('scopes scene queries while persistence and extras retain the real owner', async () => {
    const p = owner(),
      scoped = gameProject(p, 'second.gam');
    expect(p.usesOf('shared.bbl')).toEqual([]);
    expect(scoped.usesOf('shared.bbl')).toEqual([{ scene: 1, slot: 2 }]);
    expect(scoped.paletteFor('shared.bbl').source).toBe('alt.pal');
    let persisted = '',
      extrasOwner = '';
    vi.spyOn(p, 'saveNow').mockImplementation(function (this: Project) {
      persisted = this.gam;
      return Promise.resolve();
    });
    const extras = vi.spyOn(p, 'setExtras').mockImplementation(function (this: Project) {
      extrasOwner = this.gam;
    });
    await scoped.saveNow();
    scoped.setExtras(scoped.gam, 'view', {});
    expect(persisted).toBe('main.gam');
    expect(extrasOwner).toBe('main.gam');
    expect(extras).toHaveBeenCalledWith('second.gam', 'view', {});
  });
  it('refuses read-only writes and discards a rejected parsed edit', () => {
    const p = owner(),
      scoped = gameProject(p, 'second.gam'),
      before = p.files.get('second.gam')!.slice(),
      attempted = vi.fn();
    makeReadOnly(p, { title: 'Scope', attempted });
    const changed = scoped.game();
    changed.scenes[0].desc = 'Denied';
    expect(() => scoped.saveGame(changed)).toThrow();
    expect(attempted).toHaveBeenCalledWith('second.gam');
    expect(p.files.get('second.gam')).toEqual(before);
    expect(scoped.game().scenes[0].desc).toBe('Second title');
  });
});
