// The quick switcher's ranking and the recent files it remembers in the companion file.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { Project } from '../core/project';
import { newGame, emptyScene, serializeGame, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { quickHits, noteOpened, recentFiles } from './quickOpen';
import { serializeBackdrop, serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { newSoundSet, serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { embeddedFiles, fileUses } from '../core/uses';
import { deleteMessage, replaceMessage } from './usedBy';

function project(): Project {
  const game = newGame('Test');
  const lvl = emptyScene(ADVTYPE);
  lvl.desc = 'Meadow';
  lvl.files[1] = 'one.map';
  game.scenes.push(lvl);
  const files = new GameFiles([
    ['test.gam', serializeGame(game)],
    ['one.map', new Uint8Array(1)],
    ['forest.bbl', new Uint8Array(1)],
    ['for.pal', new Uint8Array(1)],
  ]);
  return new Project('t', 'Test', 'test.gam', files);
}

describe('quick switcher', () => {
  it('ranks names that start with the query first, then words, then scenes', () => {
    const p = project();
    expect(
      quickHits(p, 'for')
        .map((x) => x.file)
        .sort(),
    ).toEqual(['for.pal', 'forest.bbl']);
    expect(quickHits(p, 'meadow')).toEqual([{ file: 'one.map', note: 'Used by Meadow' }]);
    expect(quickHits(p, 'palettes').map((x) => x.file)).toEqual(['for.pal']);
  });

  it('lists recent files first, kept in the companion only', () => {
    const p = project();
    const before = p.files.entries().map(([n, b]) => [n, b.slice()]);
    noteOpened(p, 'one.map');
    noteOpened(p, 'forest.bbl');
    expect(recentFiles(p)).toEqual(['forest.bbl', 'one.map']);
    expect(
      quickHits(p, '')
        .slice(0, 2)
        .map((x) => x.file),
    ).toEqual(['forest.bbl', 'one.map']);
    expect(p.files.entries()).toEqual(before);
  });

  it('warns before replacing or deleting a sample used only by a sound set', () => {
    const p = project();
    const set = newSoundSet();
    set.digital.splice(0, 3, 'PING', 'PING', ' SKIP');
    p.files.set('game.snd', serializeSoundSet(set));
    p.files.set('bad.snd', new Uint8Array());
    expect(embeddedFiles(p, 'GAME.SND')).toEqual(['PING.voc', 'PING.voc']);
    expect(fileUses(p, 'ping.voc')).toEqual([{ file: 'game.snd', text: 'sound set game.snd', count: 2 }]);
    expect(deleteMessage(p, 'ping.voc')).toContain('sound set game.snd');
    expect(replaceMessage(p, 'ping.voc', 'pong.voc')).toContain('sound set game.snd');
  });

  it('keeps slide shows and backdrops visible in both directions', () => {
    const p = project();
    p.files.set('intro.lst', serializeSlideList([{ name: 'intro.bkd' }, { name: 'photo.gif' }]));
    p.files.set('intro.bkd', serializeBackdrop({ x: 0, y: 0, gif: 'PHOTO.GIF' }));
    expect(embeddedFiles(p, 'INTRO.LST')).toEqual(['intro.bkd', 'photo.gif']);
    expect(embeddedFiles(p, 'INTRO.BKD')).toEqual(['PHOTO.GIF']);
    expect(fileUses(p, 'photo.gif').map((u) => u.file)).toEqual(['intro.lst', 'intro.bkd']);
  });

  it('names an editor-only preview palette and ignores stale owners', () => {
    const p = project();
    p.setExtras('forest.bbl', 'showPalette', 'FOR.PAL');
    p.setExtras('missing.bbl', 'showPalette', 'for.pal');
    expect(fileUses(p, 'for.pal').map((u) => u.text)).toEqual(['forest.bbl editor preview']);
  });

  it('names an animation that keeps a file in its Scene Maker scene', () => {
    const p = project();
    p.files.set('intro.fli', new Uint8Array(1));
    p.files.set('sky.gif', new Uint8Array(1));
    p.files.set('hero.chr', new Uint8Array(1));
    p.files.set('hero.cbl', new Uint8Array(1));
    // as an older editor stored it: one background, no ids, an upper-case name
    p.setExtras('intro.fli', 'scene', {
      background: { kind: 'picture', file: 'SKY.GIF' },
      tracks: [
        {
          items: [
            { kind: 'actor', source: { type: 'chr', chr: 'hero.chr', cbl: 'hero.cbl', seq: -1 } },
            { kind: 'block', bbl: 'forest.bbl', block: 3 },
            { kind: 'block', bbl: 'forest.bbl', block: 4 },
          ],
        },
      ],
    });
    p.setExtras('gone.fli', 'scene', { background: { kind: 'picture', file: 'sky.gif' } });
    expect(fileUses(p, 'sky.gif')).toEqual([{ file: 'intro.fli', text: 'intro.fli Scene Maker source', count: 1 }]);
    expect(fileUses(p, 'forest.bbl')).toEqual([{ file: 'intro.fli', text: 'intro.fli Scene Maker source', count: 2 }]);
    expect(fileUses(p, 'hero.cbl').map((u) => u.file)).toEqual(['intro.fli']);
    expect(embeddedFiles(p, 'INTRO.FLI')).toEqual(['SKY.GIF', 'hero.chr', 'hero.cbl', 'forest.bbl', 'forest.bbl']);
    expect(deleteMessage(p, 'sky.gif')).toContain('intro.fli Scene Maker source');
    expect(replaceMessage(p, 'sky.gif', 'sea.gif')).toContain('intro.fli Scene Maker source');
  });

  it('names what uses a file before deleting it', () => {
    const p = project();
    expect(deleteMessage(p, 'one.map')).toMatch(/still used by: Meadow · map/);
    expect(deleteMessage(p, 'forest.bbl')).toMatch(/No known references/);
  });
});
