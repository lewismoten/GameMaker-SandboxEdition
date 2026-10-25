// The instruction and level card generators: their words fit the text screen, their keys come
// from the game, and the files they write play in the scene's slot with text that reads well.
import { describe, expect, it } from 'vitest';
import { PICKUPSEQ, parseCharacter, serializeCharacter } from '../../../formats/character';
import { parseSlideList } from '../../../formats/graphicScripts';
import { serializeGame } from '../../../formats/game';
import { GameFiles } from '../../../project/files';
import { testGame } from '../../check/testGame';
import { textContrast } from '../../check/checks/textContrast';
import { textPages } from '../../check/textScreens';
import { addCard, INSTRUCTIONS_SLOT } from './cardWire';
import { CARD_WIDTH, instructionLines, keyLines, levelCardLines, playOrder, wrapCard } from './cardText';

const ROWS = ['##########', '#........#', '#E.S.....#', '##########'];

describe('card words', () => {
  it('wraps to 30 letters, cutting a word too long for a line', () => {
    const lines = wrapCard('Find the three golden keys and open the vault before the clock runs out. Supercalifragilisticexpialidocious!');
    expect(lines.every((l) => l.length <= CARD_WIDTH)).toBe(true);
    expect(lines[0]).toBe('Find the three golden keys and');
  });

  it('takes the keys from the game’s characters', () => {
    const t = testGame(ROWS);
    expect(keyLines(new GameFiles(t.files))).toEqual(['Left/Right: move']);
    // a pick-up key keeps its whole name
    const chr = parseCharacter(t.files.get('test.chr')!);
    chr.sequences[PICKUPSEQ].key = 34 << 8;
    t.files.set('test.chr', serializeCharacter(chr));
    expect(keyLines(new GameFiles(t.files))).toContain('G: pick up');
  });

  it('puts the goal first and PLAYGAME’s keys last, with no page starting blank', () => {
    const lines = instructionLines({ title: 'How to play Test', goal: 'Reach the exit.', keys: 'Left/Right: move', dangers: '', items: '' });
    expect(lines.slice(0, 4)).toEqual(['HOW TO PLAY TEST', '', 'YOUR GOAL', 'Reach the exit.']);
    expect(lines.at(-3)).toBe('F1 help      F2 status');
    expect(lines.indexOf('WATCH OUT FOR')).toBe(-1);
  });

  it('says which level of how many, and keeps to one page', () => {
    const lines = levelCardLines({ name: 'The Cellar', number: 3, total: 10, goal: 'Find the lamp.', hint: 'The lamp is behind the barrels.' });
    expect(lines.slice(0, 2)).toEqual(['THE CELLAR', 'Level 3 of 10']);
    expect(lines).toContain('Hint: The lamp is behind the');
    expect(levelCardLines({ name: 'x', number: 1, total: 1, goal: 'word '.repeat(200), hint: '' })).toHaveLength(16);
  });

  it('counts levels in the order play meets them', () => {
    const t = testGame(ROWS);
    const s = t.game.scenes[2];
    t.game.scenes.push({ ...s, links: s.links.map((l) => ({ ...l })) }, { ...s, links: s.links.map((l) => ({ ...l })) });
    // 2 leads to 4, 4 to 3
    s.links[0] = { ...s.links[0], toScene: 4 };
    t.game.scenes[4].links[0] = { ...t.game.scenes[4].links[0], toScene: 3 };
    expect(playOrder(t.game)).toEqual([2, 4, 3]);
  });
});

describe('the card in the game', () => {
  it('writes a backdrop, a list and the page into the instructions slot, and reads well', () => {
    const t = testGame(ROWS);
    const files = new GameFiles(t.files);
    const project = { files, freeName: (b: string, e: string) => `${b}.${e}` };
    const lines = instructionLines({ title: 'How to play', goal: 'Reach the exit.', keys: 'Left/Right: move', dangers: 'Spikes hurt.', items: '' });
    expect(addCard(project, t.game.scenes[0], INSTRUCTIONS_SLOT, 'howto', lines, true)).toEqual(['howto.lst', 'howto.gif', 'howto.txt']);
    expect(parseSlideList(files.get('howto.lst')!)).toEqual([
      { name: 'howto.gif', pause: 0 },
      { name: 'howto.txt', pause: undefined },
    ]);
    files.set('test.gam', serializeGame(t.game));
    const pages = textPages(t.game, files);
    expect(pages.map((p) => [p.role, !!p.under])).toEqual([['instructions', true]]);
    expect(textContrast(t.game, files)).toEqual([]);
  });
});
