// Overview › Tools › About this game: title, author, company, year, description, story, genre, website,
// license and credits. Editor-only (the companion, project/companion.ts): the game's files never change.
// They make the FILE_ID.DIZ in the DOS download (shown live, as a BBS showed it: 10 lines of 45
// characters), and the visible credits and search-engine data of the one-page web download.
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { aboutOf, ABOUT_TEXT_KEYS, type AboutGame, type Credit } from '../../project/aboutGame';
import { DIZ_LINES, DIZ_WIDTH, fileIdDizLines } from '../../project/fileIdDiz';

const LABELS: Record<(typeof ABOUT_TEXT_KEYS)[number], string> = {
  title: 'Title',
  author: 'Author',
  company: 'Company',
  year: 'Year',
  description: 'Short description',
  story: 'Story',
  genre: 'Genre',
  website: 'Website',
  license: 'License',
};
const WIDE = new Set(['description', 'story']);

export function aboutCard(project: Project): HTMLElement {
  const now = aboutOf(project.companion);
  const inputs = new Map<string, HTMLInputElement | HTMLTextAreaElement>();
  const fields = h('div', { class: 'about-fields' });
  for (const k of ABOUT_TEXT_KEYS) {
    const id = `about-${k}`;
    const long = WIDE.has(k);
    const input = long
      ? h('textarea', { id, rows: k === 'story' ? '4' : '2', autocomplete: 'off' })
      : h('input', { id, type: 'text', ...(k === 'website' ? { inputmode: 'url' } : {}), autocomplete: 'off', maxlength: k === 'year' ? '4' : '120' });
    input.value = now[k] ?? '';
    input.addEventListener('input', save);
    inputs.set(k, input);
    fields.append(h('label', { for: id, class: long ? 'about-wide' : '' }, LABELS[k], input));
  }

  const creditList = h('div', { class: 'about-credits', role: 'group', 'aria-label': 'Credits' });
  const addRow = (c: Credit = { role: '', name: '' }) => {
    const role = h('input', { type: 'text', placeholder: 'Role, such as Music', 'aria-label': 'Credit role', value: c.role, maxlength: '60' });
    const name = h('input', { type: 'text', placeholder: 'Name', 'aria-label': 'Credit name', value: c.name, maxlength: '80' });
    const remove = h('button', { type: 'button', 'aria-label': 'Remove this credit', onclick: () => (row.remove(), save()) }, '×');
    const row = h('div', { class: 'about-credit' }, role, name, remove);
    role.addEventListener('input', save);
    name.addEventListener('input', save);
    creditList.append(row);
  };
  for (const c of now.credits ?? []) addRow(c);
  const add = h('button', { type: 'button', class: 'about-add', onclick: () => addRow() }, 'Add a credit');

  const diz = h('pre', { class: 'about-diz', id: 'about-diz', 'aria-label': 'FILE_ID.DIZ preview' });
  const count = h('p', { class: 'hint', id: 'about-diz-hint' });
  const status = h('p', { class: 'tool-status', role: 'status' });

  const read = (): AboutGame => {
    const out: AboutGame = {};
    for (const k of ABOUT_TEXT_KEYS) out[k] = inputs.get(k)!.value;
    out.credits = [...creditList.querySelectorAll<HTMLElement>('.about-credit')].map((r) => {
      const [role, name] = [...r.querySelectorAll('input')];
      return { role: role.value, name: name.value };
    });
    return out;
  };
  function render(): void {
    const about = aboutOf({ ...(project.companion ?? { format: 'gamemaker-companion', version: 1, files: {} }), about: read() });
    const version = typeof project.companion?.gameVersion === 'string' ? project.companion.gameVersion : undefined;
    const lines = fileIdDizLines(about, project.name ?? '', version);
    diz.textContent = lines.length ? lines.join('\n') : '(Add a title to see it.)';
    count.textContent = `${lines.length} of ${DIZ_LINES} lines, up to ${DIZ_WIDTH} characters each, plain ASCII.`;
    status.textContent = Object.keys(about).length ? 'Saved with the project.' : 'Nothing filled in yet.';
  }
  function save(): void {
    project.setAbout(read());
    render();
  }
  render();

  return h(
    'li',
    { class: 'tool-card about-card' },
    h(
      'div',
      { class: 'tool-body' },
      h('h3', { id: 'tool-about' }, 'About this game'),
      h(
        'p',
        { class: 'hint' },
        'Used by the downloads only, never in the game files. The DOS download gets a FILE_ID.DIZ from it; the web page shows the credits and tells search engines what the game is.',
      ),
      fields,
      h('h4', null, 'Credits'),
      creditList,
      add,
      h('h4', null, 'FILE_ID.DIZ in the DOS download'),
      diz,
      count,
      status,
    ),
  );
}
