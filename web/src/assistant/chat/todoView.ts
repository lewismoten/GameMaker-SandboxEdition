// The game's to-do list in the chat panel, in three groups (Doing, To do, Done): each item with
// a box to tick, a Doing switch, "Ask" to have the assistant do it (which moves it to Doing) and a
// remove button; a field to add one's own; and Clear done.
import { h, clear } from '../../editor/core/ui';
import { addTodo, clearDone, grouped, removeTodo, setDoing, setDone, todos, type TodoHost, type TodoItem } from './todo';

export interface TodoView {
  el: HTMLElement;
  render(): void;
}

const FROM: Record<TodoItem['from'], string> = { coach: 'from the coach', check: 'from the Level check', you: 'yours', ai: 'from the assistant' };

export function todoView(host: () => TodoHost | undefined, opts: { ask(text: string): void; canAsk(): boolean }): TodoView {
  const list = h('div', { class: 'todo-groups' });
  const count = h('span');
  const input = h('input', { type: 'text', id: 'todo-new', placeholder: 'Add your own…', maxLength: 300, 'aria-label': 'Add a to-do item' });
  const clearBtn = h('button', { type: 'button', class: 'todo-clear', onclick: () => act((p) => clearDone(p)) }, 'Clear done');
  const el = h(
    'details',
    { class: 'chat-todo' },
    h('summary', null, 'To-do ', count),
    list,
    h(
      'form',
      {
        class: 'todo-add',
        onsubmit: (e: Event) => {
          e.preventDefault();
          const t = input.value.trim();
          if (t) act((p) => addTodo(p, t));
          input.value = '';
        },
      },
      input,
      h('button', { type: 'submit' }, 'Add'),
      clearBtn,
    ),
  );

  /** Changes the list; a game opened only to look inside keeps nothing, and says so. */
  function act(fn: (p: TodoHost) => unknown): void {
    const p = host();
    if (!p) return;
    try {
      fn(p);
    } catch {
      clear(list, h('p', { class: 'todo-empty' }, 'This game is open only to look inside, so its list can’t change.'));
      return;
    }
    render();
  }

  function row(x: TodoItem): HTMLElement {
    const id = `todo-${x.id}`;
    return h(
      'li',
      { class: x.done ? 'done' : x.doing ? 'doing' : '' },
      h('input', {
        type: 'checkbox',
        id,
        checked: x.done,
        onchange: (e: Event) => act((q) => setDone(q, x.id, (e.target as HTMLInputElement).checked)),
      }),
      h('label', { for: id, title: `${FROM[x.from]}, ${x.added}` }, x.text),
      x.done
        ? null
        : h(
            'button',
            {
              type: 'button',
              class: 'todo-doing',
              'aria-pressed': String(!!x.doing),
              title: x.doing ? 'Back to To do' : 'Mark as Doing',
              'aria-label': `Doing: ${x.text}`,
              onclick: () => act((q) => setDoing(q, x.id, !x.doing)),
            },
            x.doing ? '◼' : '▶',
          ),
      x.done
        ? null
        : h(
            'button',
            {
              type: 'button',
              class: 'todo-ask',
              disabled: !opts.canAsk(),
              title: 'Ask the assistant to do this (it moves to Doing)',
              'aria-label': `Ask the assistant: ${x.text}`,
              onclick: () => (act((q) => setDoing(q, x.id, true)), opts.ask(x.text)),
            },
            'Ask',
          ),
      h(
        'button',
        { type: 'button', class: 'todo-remove', 'aria-label': `Remove: ${x.text}`, title: 'Remove', onclick: () => act((q) => removeTodo(q, x.id)) },
        '×',
      ),
    );
  }

  function render(): void {
    const p = host();
    const items = p ? todos(p) : [];
    const g = grouped(items);
    count.textContent = items.length ? `(${g.doing.length ? `${g.doing.length} doing, ` : ''}${g.todo.length} to do)` : '';
    clearBtn.hidden = !g.done.length;
    if (items.length && !el.dataset.seen) ((el.open = true), (el.dataset.seen = '1'));
    const group = (key: string, name: string, xs: TodoItem[]) =>
      xs.length
        ? h(
            'section',
            { class: `todo-group todo-${key}`, 'aria-labelledby': `todo-h-${key}` },
            h('h3', { id: `todo-h-${key}` }, name, ' ', h('span', { class: 'todo-n' }, `(${xs.length})`)),
            h('ul', { class: 'todo-list' }, ...xs.map(row)),
          )
        : null;
    clear(
      list,
      ...(items.length
        ? [group('doing', 'Doing', g.doing), group('todo', 'To do', g.todo), group('done', 'Done', g.done)]
        : [h('p', { class: 'todo-empty' }, 'Nothing yet. “What should I do next?” checks the game and fills this in.')]),
    );
  }

  return { el, render };
}
