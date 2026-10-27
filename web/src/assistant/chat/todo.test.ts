// The to-do list and credits in the companion data: a refreshed list replaces the coach's open
// items but keeps ticked ones and the person's own; nothing lands among the game's files; and the
// credit lines are read back for the downloads.
import { describe, expect, it } from 'vitest';
import { emptyCompanion, getSection, setSection, type Companion } from '../../project/companion';
import { addCredit, addTodo, clearDone, companionCredits, credits, grouped, refreshTodos, removeTodo, setDoing, setDone, todos, type TodoHost } from './todo';
import { todoTool } from './todoTool';
import { MemoryContext } from '../tools/memoryContext';
import { GameFiles } from '../../project/files';

function host(): TodoHost & { companion: Companion } {
  const companion = emptyCompanion();
  return {
    gam: 'mygame.gam',
    companion,
    extras: <T>(file: string, section: string, fallback: T) => getSection(companion, file, section, fallback),
    setExtras: (file: string, section: string, value: unknown) => setSection(companion, file, section, value),
  };
}

describe('the to-do list', () => {
  it('keeps ticked items and the person’s own when the coach runs again', () => {
    const p = host();
    const first = refreshTodos(p, ['Add an exit to Level 1.', 'Name the P key on a text screen.'], 'coach', new Date('2026-10-26T12:00:00Z'));
    expect(first.map((x) => x.text)).toEqual(['Add an exit to Level 1.', 'Name the P key on a text screen.']);
    expect(first[0]).toMatchObject({ done: false, from: 'coach', added: '2026-10-26' });
    setDone(p, first[0].id, true);
    addTodo(p, 'Draw a better title picture');
    addTodo(p, 'draw a better title picture!');
    const again = refreshTodos(p, ['Give the game won scene a picture.', 'Add an exit to level 1'], 'coach');
    expect(again.map((x) => [x.text, x.done])).toEqual([
      ['Give the game won scene a picture.', false],
      ['Draw a better title picture', false],
      ['Add an exit to Level 1.', true],
    ]);
    expect(todos(p)).toEqual(again);
  });

  it('moves items through Doing, To do and Done, and the coach leaves the assistant’s items alone', () => {
    const p = host();
    const [a, b] = refreshTodos(p, ['One', 'Two'], 'check');
    addTodo(p, 'Three', new Date(), 'ai');
    setDoing(p, b.id, true);
    expect(Object.values(grouped(todos(p))).map((xs) => xs.map((x) => x.text))).toEqual([['Two'], ['One', 'Three'], []]);
    setDone(p, b.id, true);
    setDone(p, a.id, true);
    setDoing(p, a.id, true);
    expect(Object.values(grouped(todos(p))).map((xs) => xs.map((x) => x.text))).toEqual([['One'], ['Three'], ['Two']]);
    refreshTodos(p, ['Four'], 'coach');
    expect(todos(p).map((x) => x.text)).toEqual(expect.arrayContaining(['Three', 'Four']));
  });

  it('the todo tool lists, adds, starts and ticks by number, and redraws the panel', async () => {
    const p = host();
    let redrawn = 0;
    const tool = todoTool(
      new MemoryContext(new GameFiles([]), 'mygame.gam'),
      () => p,
      () => redrawn++,
    );
    expect((await tool.run({})).content[0]).toMatchObject({ text: 'The to-do list is empty.' });
    await tool.run({ add: ['Add a locker room level', 'Give the hero a sweatband'] });
    const r = await tool.run({ start: [2], done: [1] });
    expect((r.content[0] as { text: string }).text).toBe('Doing:\n1. Give the hero a sweatband\nDone (1): Add a locker room level');
    expect(todos(p).every((x) => x.from === 'ai')).toBe(true);
    expect(redrawn).toBe(2);
  });

  it('ticks, removes and clears, and empties its section when nothing is left', () => {
    const p = host();
    const [a, b] = refreshTodos(p, ['One', 'Two'], 'check');
    setDone(p, a.id, true);
    expect(clearDone(p).map((x) => x.text)).toEqual(['Two']);
    removeTodo(p, b.id);
    expect(todos(p)).toEqual([]);
    expect(p.companion.files['mygame.gam']).toBeUndefined();
  });

  it('credits each model once, for the downloads to show', () => {
    const p = host();
    addCredit(p, 'qwen3 via Ollama');
    addCredit(p, 'qwen3 via Ollama');
    addCredit(p, 'gpt-4o via OpenAI');
    expect(credits(p)).toEqual(['Assistant: qwen3 via Ollama', 'Assistant: gpt-4o via OpenAI']);
    expect(companionCredits(p.companion, 'mygame.gam')).toEqual(credits(p));
    expect(companionCredits(undefined, 'mygame.gam')).toEqual([]);
  });
});
