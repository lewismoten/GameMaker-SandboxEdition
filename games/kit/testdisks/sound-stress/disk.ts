// Standalone tools-built diagnostic. Deliberately no about.json, Starter registration or public output.
import { Disk } from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { buildHeroBlocks, heroPicture } from '../../starter/hero';
import { buildHero } from '../../starter/heroChar';
import { gif, menuPicture, paper, scoresPicture, slotsPicture } from '../../starter/screens';
import { buildSong } from './audio';
import { buildEffects } from './effects';
import { page } from '@lewismoten/gamemaker-sandbox-tools/kit/screenText';
import { wrapWords } from '../../starter/sign';
import { buildRooms } from './rooms';

function textPages(text: string): string {
  const lines = text.split('\n').flatMap((line) => (line ? wrapWords(line, 30, 100) : ['']));
  return page(lines, Math.ceil(lines.length / 16));
}

const NOTES = `SOUND STRESS - TEST DISK\n\nLeft/right: walk. Space: jump over a pad.\nThe right door swaps rooms and resets pads.\nF1: these notes. F3: music. F4: effects.\n\nFull band: wait through the 32-bar loop.\nNine melodic OPL2 voices use nine different\nkit presets. Dense chords plus fast notes.\nOPL2 permits 9 melodic OR 6 melodic plus\n5 rhythm drums, NOT 16 melodic voices.\nSBMUSIC.C sends notes to the Creative driver;\nthe engine CmfPlayer models this allocation.\n\nBand + effects: the SAME song restarts.\nThree gold pads per label; each plays once.\nGray means used. Door resets all pads.\n0.25s / 1s / 5s are nominal durations.\nVOC rate rounds to 10989 Hz (from 11025).\n64K is exactly 65536 TOTAL bytes: a DOS\nboundary probe, NOT supported playback.\nSOUNDC.C reads with a 16-bit count: this\nsize wraps to zero. Save before testing it.\n\nListen: does FM hold, skip or lose a voice\nduring disk reads, VOC playback or looping?\nWait on each first pad to hear its full tail.\nThen cross copies quickly: new VOCs replace\nold ones; this is NOT a digital mixer.\nThe green SCORE pad is a PC-speaker effect.\nTry it during a long VOC (jump over 64K).\nAlso test score first, then another VOC.\nCompare from floppy versus installed disk.\n\nRecord baseline and each pad with matching\n86Box CPU/card/IRQ/disk settings. Use the\nBlackHole/ffmpeg capture note in the private\n.for-lewis/86box/README.md. Record F3/F4\nstates and pad order; do not infer PS/1\ntiming from a browser simulation.\n`;

export function makeDisk(out: string): Disk {
  const disk = new Disk(out);
  const { pal, rooms } = buildRooms();
  const cb = buildHeroBlocks(pal);
  const hero = buildHero(cb);
  hero.meter[3] = 100; // positive money/counter values permit repeated subtract-pad tests
  hero.meter[20] = 100;
  const portrait = heroPicture(cb, 'stand.top', 'stand');
  const book = rooms[0].book;
  const game = newGame('SOUND STRESS');
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'band.cmf',
    'menu.gif',
    'band.cmf',
    'howto.lst',
    'band.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'load.gif',
    'save.gif',
    '',
    ...Array<string>(8).fill(''),
  ];
  end.files = ['howto.lst', '', 'howto.lst', '', ...Array<string>(16).fill('')];
  rooms.forEach((room, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = room.title;
    scene.files = [
      'test.pal',
      `${room.file}.map`,
      `${room.file}.bbl`,
      '',
      '',
      'hero.chr',
      'hero.cbl',
      'test.snd',
      'band.cmf',
      '',
      ...Array<string>(10).fill(''),
    ];
    scene.links[0] = { toScene: i ? 2 : 3, from: { x: 72, y: 19 }, to: { x: 13, y: 19 } };
    game.scenes.push(scene);
    disk.put(`${room.file}.map`, serializeMap(room.map.done()));
    disk.put(`${room.file}.bbl`, serializeBlocks(room.book.finish()));
  });
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 13, y: 19 } };
  disk.put('test.pal', serializePalette(pal.pal));
  disk.put('hero.cbl', serializeBlocks(cb.finish()));
  disk.put('hero.chr', serializeCharacter(hero));
  const { sounds, vocs } = buildEffects();
  disk.put('test.snd', serializeSoundSet(sounds));
  for (const [name, voc] of Object.entries(vocs)) disk.put(`${name}.voc`, voc);
  disk.put('band.cmf', buildSong());
  disk.put('title.gif', gif(paper(pal, book, 'SOUND STRESS'), pal));
  disk.put('title.lst', serializeSlideList([{ name: 'title.gif', pause: 2 }]));
  disk.put('menu.gif', gif(menuPicture(pal, book, portrait, 'SOUND STRESS'), pal));
  disk.put('scores.gif', gif(scoresPicture(pal, book, 'TEST SCORES'), pal));
  disk.put('load.gif', gif(slotsPicture(pal, book, 'LOAD TEST'), pal));
  disk.put('save.gif', gif(slotsPicture(pal, book, 'SAVE TEST'), pal));
  disk.put('howto.txt', textPages(NOTES));
  disk.put('howto.lst', serializeSlideList([{ name: 'howto.txt' }]));
  disk.put(
    'credits.txt',
    textPages(
      'Diagnostic code, music and text: Hermes OpenAI Codex GPT-6.1 Sol.\nKit artwork and instruments: Game-Maker Sandbox Edition.\nOriginal DOS engine: Recreational Software Designs.\n',
    ),
  );
  disk.put('credits.lst', serializeSlideList([{ name: 'credits.txt' }]));
  disk.put('soundtst.gam', serializeGame(game));
  return disk;
}
