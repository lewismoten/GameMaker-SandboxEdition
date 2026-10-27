// The to-do list and credits in the companion data: a refreshed list replaces the coach's open
// items but keeps ticked ones and the person's own; nothing lands among the game's files; and the
// credit lines are read back for the downloads.
import { describe, expect, it } from 'vitest';
import { emptyCompanion, getSection, setSection, type Companion } from '../../project/companion';
import { addCredit, addTodo, clearDone, companionCredits, credits, refreshTodos, removeTodo, setDone, todos, type TodoHost } from './todo';

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
