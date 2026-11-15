// A laser kit's build notes read in the page, never saved as Markdown: the kit's README as a page with its headings, lists and tables, and
// real pictures of the build between them (the 3D assembly view drawn at the end of each sub-assembly, then the cut sheets' own previews).
// The reader can save the page as one self-contained HTML file (pictures inside it) or print it, which is also how it becomes a PDF.
import './kitNotes.css';
import { h } from '../../editor/core/ui';
import { readMarkdown, element } from './markdownBlocks';
import type { LaserKit } from '../../desk/boxes/laserKits';

/** The page's own look, in the dialog and in the saved file. */
const CSS = `
.kn-doc{font:16px/1.5 system-ui,sans-serif;color:#251b16;background:#fff;max-width:46rem;margin:0 auto;padding:1rem}
.kn-doc h1{font-size:1.5rem;margin:0 0 .5rem}.kn-doc h2{font-size:1.2rem;margin:1.5rem 0 .4rem}.kn-doc h3{font-size:1rem}
.kn-doc code{background:#f4eee2;padding:0 .25em;border-radius:3px}.kn-doc pre{background:#f4eee2;padding:.5rem;overflow:auto}
.kn-doc table{border-collapse:collapse}.kn-doc th,.kn-doc td{border:1px solid #cfc9bb;padding:.2rem .5rem;text-align:left}
.kn-doc figure{margin:1rem 0;break-inside:avoid}.kn-doc img{max-width:100%;height:auto;background:#f4eee2;border:1px solid #cfc9bb;border-radius:6px}
.kn-doc figcaption{font-size:.9rem}
`;

/** A kit's README without its maker's command: the first code block and what follows it up to the next heading are for whoever builds the files. */
export function playerSections(source: string) {
  const all = readMarkdown(source);
  const first = all.findIndex((s) => s.blocks.some((b) => b.tag === 'pre'));
  if (first < 0) return all;
  const s = all[first];
  all[first] = {
    ...s,
    blocks: s.blocks.slice(
      0,
      s.blocks.findIndex((b) => b.tag === 'pre'),
    ),
  };
  return all;
}

const dataUrl = (blob: Blob) =>
  new Promise<string>((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(typeof r.result === 'string' ? r.result : '');
    r.onerror = () => no(r.error);
    r.readAsDataURL(blob);
  });

/** One figure: a picture (a data URL, so the saved page carries it) and its words. */
const figure = (src: string, alt: string, words: string, width?: number) =>
  h('figure', null, h('img', { src, alt, ...(width ? { width: String(width) } : {}) }), h('figcaption', null, words));

/** Real renders of the 3D assembly view: the end of each sub-assembly, or six steps spread over the build when the kit has none. */
async function stepFigures(kit: LaserKit): Promise<HTMLElement[]> {
  if (!kit.assembly) return [];
  const [{ assemblyModel }, { assemblyView }] = await Promise.all([import('../../desk/boxes/kitAssemblyModel'), import('../../desk/boxes/kitAssemblyDraw')]);
  const model = assemblyModel(kit.assembly);
  const canvas = document.createElement('canvas');
  const view = assemblyView(canvas, model);
  view.fixed = 480;
  const n = model.steps.length;
  const marks: { step: number; title: string }[] = model.sections.length
    ? model.sections.map((s, i) => ({ step: (model.sections[i + 1]?.step ?? n + 1) - 1, title: s.title }))
    : [0, 1, 2, 3, 4, 5].map((i) => {
        const step = Math.round((n * i) / 5);
        return { step, title: step ? `Step ${step}` : 'All the parts, apart' };
      });
  return marks.map((m, i) => {
    view.step = Math.max(0, Math.min(n, m.step));
    view.draw();
    const done = model.steps[Math.ceil(view.step) - 1];
    const words = `${m.title}${done ? `: ${done.caption}` : ''}`;
    return figure(canvas.toDataURL('image/png'), `${kit.title}, ${m.title}`, `${i + 1}. ${words}`, 480);
  });
}

/** The kit's cut sheets as pictures. */
async function sheetFigures(kit: LaserKit): Promise<HTMLElement[]> {
  const out: HTMLElement[] = [];
  for (const p of kit.previews) {
    try {
      const r = await fetch(`${kit.base}${p.file}`);
      if (r.ok) out.push(figure(await dataUrl(await r.blob()), p.alt, p.alt));
    } catch {
      /* a preview that won't load is left out, never replaced by a stand-in */
    }
  }
  return out;
}

/** The notes page for a kit, from its README text. */
async function kitNotesPage(kit: LaserKit, source: string): Promise<HTMLElement> {
  const sections = playerSections(source);
  const [steps, sheets] = await Promise.all([stepFigures(kit), sheetFigures(kit)]);
  const doc = h('article', { class: 'kn-doc' });
  sections.forEach((s, i) => {
    if (s.title) doc.append(h((['h1', 'h2', 'h3'] as const)[Math.min(3, s.level || 2) - 1], null, s.title));
    doc.append(...s.blocks.map(element));
    // the pictures follow the introduction, before the first "##" section
    if (i === Math.max(0, sections.findIndex((x) => x.level > 1) - 1)) {
      if (steps.length) doc.append(h('h2', null, 'The build, step by step'), ...steps);
      if (sheets.length) doc.append(h('h2', null, 'The cut sheets'), ...sheets);
    }
  });
  return doc;
}

/** One HTML file with its styles and pictures inside. */
function standalone(title: string, doc: HTMLElement): string {
  const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{margin:0;background:#fff}${CSS}</style></head><body>${doc.outerHTML}</body></html>\n`;
}

/** Opens the build notes of `kit` (its README at `href`) in a dialog: read, Save as web page, Print or save as PDF. */
export function openKitNotes(kit: LaserKit, href: string, from?: HTMLElement): void {
  const dialog = h('dialog', { class: 'kn', 'aria-label': `${kit.title}: build notes` });
  const body = h(
    'div',
    { class: 'kn-body', tabindex: 0, role: 'region', 'aria-label': 'Build notes' },
    h('p', { class: 'kn-wait', role: 'status' }, 'Making the pictures…'),
  );
  const save = h('a', { class: 'oc-btn kn-save', role: 'button', 'aria-disabled': 'true' }, 'Save as web page');
  // a link with role=button: Space presses it like a button
  save.addEventListener('keydown', (e) => e.key === ' ' && save.getAttribute('aria-disabled') !== 'true' && (e.preventDefault(), save.click()));
  const print = h('button', { type: 'button', class: 'oc-btn', disabled: true, onclick: () => window.print() }, 'Print or save as PDF');
  const close = h('button', { type: 'button', class: 'oc-btn', onclick: () => dialog.close() }, 'Close');
  dialog.append(
    h('div', { class: 'kn-bar' }, h('strong', { class: 'kn-title' }, `${kit.title}: build notes`), save, print, close),
    h('style', null, CSS),
    body,
  );
  dialog.addEventListener('keydown', (e) => e.key === 'Escape' && e.stopPropagation());
  let url = '';
  dialog.addEventListener('close', () => {
    if (url) URL.revokeObjectURL(url);
    dialog.remove();
    from?.focus({ preventScroll: true });
  });
  document.body.append(dialog);
  dialog.showModal();
  body.focus({ preventScroll: true });
  void fetch(href)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then((text) => kitNotesPage(kit, text))
    .then((doc) => {
      body.replaceChildren(doc);
      url = URL.createObjectURL(new Blob([standalone(`${kit.title}: build notes`, doc)], { type: 'text/html' }));
      save.href = url;
      save.setAttribute('download', `${(href.split('/').slice(-2, -1)[0] || 'kit').replace(/[^\w-]/g, '-')}-build-notes.html`);
      save.removeAttribute('aria-disabled');
      print.disabled = false;
    })
    .catch(() => body.replaceChildren(h('p', { role: 'alert' }, 'The build notes would not load. Close this and try again.')));
}
