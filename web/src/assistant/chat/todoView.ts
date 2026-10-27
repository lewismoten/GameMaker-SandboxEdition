// The game's to-do list in the chat panel: each item with a box to tick, "Ask" to have the
// assistant do it and a remove button; a field to add one's own; and Clear ticked.
import { h, clear } from '../../editor/core/ui';
import { addTodo, clearDone, removeTodo, setDone, todos, type TodoHost, type TodoItem } from './todo';

export interface TodoView {
  el: HTMLElement;
  render(): void;
}

const FROM: Record<TodoItem['from'], string> = { coach: 'from the coach', check: 'from the Level check', you: 'yours' };

export function todoView(host: () => TodoHost | undefined, opts: { ask(text: string): void; canAsk(): boolean }): TodoView {
  const list = h('ul', { class: 'todo-list' });
  const count = h('span');
  const input = h('input', { type: 'text', id: 'todo-new', placeholder: 'Add your own…', maxLength: 300, 'aria-label': 'Add a to-do item' });
  const clearBtn = h('button', { type: 'button', class: 'todo-clear', onclick: () => act((p) => clearDone(p)) }, 'Clear ticked');
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
      clear(list, h('li', { class: 'todo-empty' }, 'This game is open only to look inside, so its list can’t change.'));
      return;
    }
    render();
  }

  function render(): void {
    const p = host();
    const items = p ? todos(p) : [];
    const open = items.filter((x) => !x.done).length;
    count.textContent = items.length ? `(${open} open)` : '';
    clearBtn.hidden = !items.some((x) => x.done);
    if (items.length && !el.dataset.seen) ((el.open = true), (el.dataset.seen = '1'));
    clear(
      list,
      ...(items.length
        ? items.map((x) => {
            const id = `todo-${x.id}`;
            return h(
              'li',
              { class: x.done ? 'done' : '' },
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
                      class: 'todo-ask',
                      disabled: !opts.canAsk(),
                      title: 'Ask the assistant to do this',
                      'aria-label': `Ask the assistant: ${x.text}`,
                      onclick: () => opts.ask(x.text),
                    },
                    'Ask',
                  ),
              h(
                'button',
                { type: 'button', class: 'todo-remove', 'aria-label': `Remove: ${x.text}`, title: 'Remove', onclick: () => act((q) => removeTodo(q, x.id)) },
                '×',
              ),
            );
          })
        : [h('li', { class: 'todo-empty' }, 'Nothing yet. “What should I do next?” checks the game and fills this in.')]),
    );
  }

  return { el, render };
}
