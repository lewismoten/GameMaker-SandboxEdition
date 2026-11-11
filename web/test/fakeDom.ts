// A tiny fake DOM for node tests of dialog code: elements with listeners, children and focus.
type Fn = (e: Record<string, unknown>) => void;
export class FakeEl {
  listeners = new Map<string, Fn[]>();
  children: FakeEl[] = [];
  attrs: Record<string, string> = {};
  dataset: Record<string, string> = {};
  className = '';
  textContent = '';
  open = false;
  isConnected = false;
  constructor(
    public tag: string,
    private doc: FakeDoc,
  ) {}
  addEventListener(t: string, f: Fn) {
    (this.listeners.get(t) ?? this.listeners.set(t, []).get(t)!).push(f);
  }
  removeEventListener(t: string, f: Fn) {
    this.listeners.set(
      t,
      (this.listeners.get(t) ?? []).filter((x) => x !== f),
    );
  }
  fire(t: string, e: Record<string, unknown> = {}): Record<string, unknown> {
    const ev = {
      target: this,
      stopped: false,
      stopImmediatePropagation() {
        ev.stopped = true;
      },
      stopPropagation() {
        ev.stopped = true;
      },
      preventDefault() {},
      ...e,
    };
    for (const f of this.listeners.get(t) ?? []) f(ev);
    return ev;
  }
  setAttribute(k: string, v: string) {
    this.attrs[k] = v;
  }
  hasAttribute(k: string) {
    return k in this.attrs;
  }
  appendChild(c: FakeEl) {
    this.children.push(c);
    return c;
  }
  append(...cs: FakeEl[]) {
    for (const c of cs) {
      this.children.push(c);
      c.isConnected = this.isConnected;
    }
  }
  replaceChildren() {
    this.children = [];
  }
  querySelector() {
    return new FakeEl('span', this.doc);
  }
  querySelectorAll() {
    return [];
  }
  closest() {
    return this;
  }
  contains(n: FakeEl) {
    return n === this;
  }
  remove() {
    this.isConnected = false;
  }
  focus() {
    this.doc.activeElement = this;
  }
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
    this.fire('close');
  }
}
export class FakeDoc {
  activeElement: FakeEl | null = null;
  body = new FakeEl('body', this);
  constructor() {
    this.body.isConnected = true;
  }
  createElement(tag: string) {
    return new FakeEl(tag, this);
  }
  createTextNode(t: string) {
    const n = new FakeEl('#text', this);
    n.textContent = t;
    return n;
  }
}
export class FakeWin {
  listeners = new Map<string, Fn[]>();
  addEventListener(t: string, f: Fn) {
    (this.listeners.get(t) ?? this.listeners.set(t, []).get(t)!).push(f);
  }
  removeEventListener(t: string, f: Fn) {
    this.listeners.set(
      t,
      (this.listeners.get(t) ?? []).filter((x) => x !== f),
    );
  }
  count(t: string) {
    return (this.listeners.get(t) ?? []).length;
  }
  fire(t: string, e: Record<string, unknown>) {
    for (const f of [...(this.listeners.get(t) ?? [])]) f(e);
  }
}
