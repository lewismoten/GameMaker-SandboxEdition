// Small DOM helpers for the editor.

type Child = Node | string | number | false | null | undefined | Child[];
type Attrs = Record<string, unknown> & { class?: string; style?: string; dataset?: Record<string, string> };

/** h('button', { class: 'x', onclick: fn }, 'Label') */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    /* eslint-disable @typescript-eslint/no-base-to-string -- attribute values are strings, numbers or true */
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'style') el.setAttribute('style', String(v));
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
      else if (k in el && typeof v !== 'string') (el as unknown as Record<string, unknown>)[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    /* eslint-enable @typescript-eslint/no-base-to-string */
  }
  append(el, children);
  return el;
}

function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}

export function clear(el: Element, ...children: Child[]): void {
  el.replaceChildren();
  append(el, children);
}

export function download(name: string, data: Uint8Array | string, type = 'application/octet-stream'): void {
  const blob = new Blob([data as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function pickFiles(opts: { multiple?: boolean; directory?: boolean; accept?: string } = {}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', multiple: opts.multiple ?? true, accept: opts.accept });
    if (opts.directory) input.setAttribute('webkitdirectory', '');
    input.addEventListener('change', () => resolve([...(input.files ?? [])]));
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });
}

let toastHost: HTMLElement | undefined;
export function toast(message: string, kind: 'info' | 'error' = 'info'): void {
  toastHost ??= document.body.appendChild(h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }));
  const t = h('div', { class: `toast ${kind}` }, message);
  toastHost.append(t);
  setTimeout(() => t.remove(), kind === 'error' ? 8000 : 3500);
}

/** A modal <dialog>. Resolves with the value passed to close(). */
export function modal<T>(title: string, build: (close: (v: T | undefined) => void) => Child): Promise<T | undefined> {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'modal' });
    const close = (v: T | undefined) => {
      dlg.close();
      dlg.remove();
      resolve(v);
    };
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close(undefined);
    });
    append(dlg, [
      h(
        'header',
        { class: 'modal-head' },
        h('h2', null, title),
        h('button', { class: 'modal-close', 'aria-label': 'Close', title: 'Close (Esc)', onclick: () => close(undefined) }, '×'),
      ),
      build(close),
    ]);
    document.body.append(dlg);
    dlg.showModal();
  });
}

export async function promptText(title: string, label: string, value = '', pattern?: string): Promise<string | undefined> {
  return modal<string>(title, (close) => {
    const input = h('input', { type: 'text', value, required: true, pattern, autofocus: true, onfocus: (e: Event) => (e.target as HTMLInputElement).select() });
    // Chrome may focus the dialog's input before it is shown (opened from the keyboard), losing the
    // selection, so typing would add to the name: select it again once the dialog is open.
    requestAnimationFrame(() => {
      if (!input.isConnected) return;
      input.focus();
      input.setSelectionRange(0, input.value.length);
    });
    const form = h(
      'form',
      {
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (input.reportValidity()) close(input.value.trim());
        },
      },
      h('label', null, label, input),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'OK'),
      ),
    );
    return form;
  });
}

export async function confirmDialog(title: string, message: string, ok = 'OK'): Promise<boolean> {
  const r = await modal<boolean>(title, (close) => [
    h('p', null, message),
    h('div', { class: 'buttons' }, h('button', { onclick: () => close(false) }, 'Cancel'), h('button', { class: 'primary', onclick: () => close(true) }, ok)),
  ]);
  return !!r;
}

/** Labeled number input bound to get/set. */
export function numberField(
  label: string,
  get: () => number,
  set: (v: number) => void,
  opts: { min?: number; max?: number; step?: number; title?: string } = {},
): HTMLLabelElement {
  const input = h('input', {
    type: 'number',
    value: String(get()),
    min: opts.min,
    max: opts.max,
    step: opts.step ?? 1,
    'aria-label': label ? undefined : opts.title,
  });
  input.addEventListener('change', () => {
    let v = Math.round(Number(input.value) || 0);
    if (opts.min !== undefined) v = Math.max(opts.min, v);
    if (opts.max !== undefined) v = Math.min(opts.max, v);
    input.value = String(v);
    set(v);
  });
  return h('label', { class: 'field', title: opts.title }, h('span', null, label), input);
}

export function checkField(label: string, get: () => boolean, set: (v: boolean) => void, title?: string): HTMLLabelElement {
  const input = h('input', { type: 'checkbox', checked: get() });
  input.addEventListener('change', () => set(input.checked));
  return h('label', { class: 'check', title }, input, h('span', null, label));
}

export function selectField<T extends string | number>(
  label: string,
  options: [T, string][],
  get: () => T,
  set: (v: T) => void,
  title?: string,
): HTMLLabelElement {
  const sel = h(
    'select',
    { 'aria-label': label ? undefined : title },
    ...options.map(([v, text]) => h('option', { value: String(v), selected: v === get() }, text)),
  );
  sel.addEventListener('change', () => {
    const opt = options.find(([v]) => String(v) === sel.value);
    if (opt) set(opt[0]);
  });
  return h('label', { class: 'field', title }, h('span', null, label), sel);
}

export function textField(label: string, get: () => string, set: (v: string) => void, opts: { maxLength?: number; title?: string } = {}): HTMLLabelElement {
  const input = h('input', { type: 'text', value: get(), maxLength: opts.maxLength });
  input.addEventListener('change', () => set(input.value));
  return h('label', { class: 'field', title: opts.title }, h('span', null, label), input);
}

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number): (...a: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
