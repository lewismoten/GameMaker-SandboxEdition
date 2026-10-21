// Text screens (.TXT): 31 characters a line, 16 lines a page, shown over the current picture.
// The text box marks each screen page and the 31 character edge; the screen beside it is
// redrawn as you type, page by page, exactly as Display_File draws it.
import './textScreen.css';
import { registerEditor } from '../registry';
import { h, clear, debounce } from '../../core/ui';
import { kindOf, type Project } from '../../core/project';
import { latin1Text, textBytes } from '../../../formats/binary';
import { parseSlideList } from '../../../formats/graphicScripts';
import { displayFile, match, RGB_PURPLE } from '../../../engine/showGraphic';
import { gamePreview } from '../../widgets/mediaShared';
import type { Palette } from '../../../formats/palette';
import { blankScreen, pictureScreen, screenCanvas, textPages, type ScreenPicture } from '../../widgets/mediaPictures';
import { layoutText, pageOfLine, wrapLongLines, LINE_CHARS, PAGE_LINES, type TextLayout } from './textLayout';

const BACKGROUND_KINDS = ['gif', 'bkd', 'fli'];

/** A black screen in the game's palette. Color 0 is not always black (Snowbound's dusk
 *  palette starts with gray), so the screen is filled with the palette's closest to black. */
function blackScreen(palette: Palette): ScreenPicture {
  const pic = blankScreen(palette);
  pic.pixels.fill(match(palette, [0, 0, 0]));
  return pic;
}

/** The picture a text screen is usually shown over: the menu screen for the story,
 *  instructions and credits, or the slide before it in a slide show. */
function usualBackground(project: Project, file: string): string {
  const game = project.game();
  const menu = game.scenes[0]?.files[2];
  if (
    project.usesOf(file).some((u) => u.scene === 0 && [4, 6, 7].includes(u.slot)) &&
    menu &&
    BACKGROUND_KINDS.includes(kindOf(menu)) &&
    project.files.has(menu)
  )
    return project.files.resolve(menu)!;
  for (const lst of project.files.byExtension('lst')) {
    const entries = parseSlideList(project.files.get(lst)!);
    const i = entries.findIndex((e) => project.files.resolve(e.name) === file);
    for (let j = i - 1; j >= 0; j--) {
      const prev = project.files.resolve(entries[j].name);
      if (prev && BACKGROUND_KINDS.includes(kindOf(prev))) return prev;
    }
  }
  return '';
}

registerEditor(['txt'], (host, project, file) => {
  const area = h('textarea', { class: 'ts-input', spellcheck: true, wrap: 'off', 'aria-label': 'Text' });
  area.value = latin1Text(project.files.get(file)!)
    .replace(/\x1a.*$/s, '')
    .replace(/\r\n/g, '\n');
  const guides = h('div', { class: 'ts-guides', 'aria-hidden': 'true' });
  const paper = h('div', { class: 'ts-paper' }, guides, area);
  const status = h('div', { class: 'ts-status' });
  const warnings = h('ul', { class: 'ts-warnings' });
  const pageLabel = h('span', { class: 'ts-page-label' });
  const prevBtn = h('button', { title: 'Previous page', 'aria-label': 'Previous page' }, '◀');
  const nextBtn = h('button', { title: 'Next page', 'aria-label': 'Next page' }, '▶');

  let layout: TextLayout = layoutText(area.value);
  let page = 0;
  let follow = true;
  let background = usualBackground(project, file);

  const gamePalette = () => project.paletteFor(file).palette;
  const over = (): ScreenPicture => (background && pictureScreen(project.files, background)) || blackScreen(gamePalette());

  const preview = gamePreview(project, file, {
    label: '▶ Play as in the game',
    hint: 'Shown as the game shows it, over the picture chosen above.',
    run: async (m, pal) => {
      const pic = over();
      m.screen.setPalette(pic.palette);
      m.screen.pixels.set(pic.pixels);
      m.screen.markDirty();
      await displayFile(m, file, match(pic.palette, RGB_PURPLE), 90, pal);
    },
    onEnd: () => drawPage(),
  });

  const drawPage = () => {
    if (preview.running()) return;
    const lines = layout.lines.length ? linesForScreen() : [];
    const pages = textPages(lines, over(), gamePalette());
    page = Math.max(0, Math.min(page, pages.length - 1));
    screenCanvas(pages[page], 'pixel', preview.canvas);
    pageLabel.textContent = `Page ${page + 1} of ${pages.length}`;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page >= pages.length - 1;
  };

  /** The screen lines, as Display_File reads them. */
  const linesForScreen = (): string[] => {
    const out: string[] = [];
    for (const l of layout.lines) {
      for (let i = 0; i < l.count; i++) out.push(l.text.slice(i * LINE_CHARS, (i + 1) * LINE_CHARS));
    }
    return out;
  };

  const caretLine = () => area.value.slice(0, area.selectionStart).split('\n').length - 1;
  const selectLine = (i: number) => {
    const lines = area.value.split('\n');
    const start = lines.slice(0, i).reduce((n, l) => n + l.length + 1, 0);
    area.focus();
    area.setSelectionRange(start, start + lines[i].length);
    const lh = parseFloat(getComputedStyle(area).lineHeight) || 20;
    paper.scrollTop = Math.max(0, i * lh - paper.clientHeight / 3);
    follow = true;
    syncPage();
  };

  const renderGuides = () => {
    clear(
      guides,
      ...layout.lines.map((l, i) => {
        const startPage = Math.floor(l.start / PAGE_LINES);
        const first = (l.start % PAGE_LINES) + 1;
        const num = l.count === 0 ? '' : l.count === 1 ? `${first}` : `${first}–${((l.start + l.count - 1) % PAGE_LINES) + 1}`;
        const pageTop = l.pageStarts.includes(l.start / PAGE_LINES);
        const pageInside = l.pageStarts.some((p) => p * PAGE_LINES !== l.start);
        return h(
          'div',
          {
            class: [
              'ts-g',
              startPage % 2 ? 'odd' : '',
              pageTop ? 'page-top' : '',
              pageInside ? 'page-inside' : '',
              l.extraBlank ? 'blank' : '',
              l.wraps ? 'wraps' : '',
            ].join(' '),
            dataset: pageTop || pageInside ? { page: `page ${l.pageStarts[0] + 1}` } : undefined,
            title: l.extraBlank
              ? `Line ${i + 1}: exactly ${l.text.length} characters — the game shows an extra blank line after it`
              : l.wraps
                ? `Line ${i + 1}: wraps after 31 characters`
                : undefined,
          },
          h('span', { class: 'ts-num' }, l.extraBlank ? '⚠' : num),
        );
      }),
    );
  };

  const renderStatus = () => {
    const blank = layout.lines.map((l, i) => [l, i] as const).filter(([l]) => l.extraBlank);
    const wraps = layout.lines.map((l, i) => [l, i] as const).filter(([l]) => l.wraps && !l.extraBlank);
    clear(
      status,
      h('strong', null, `${layout.screenLines} screen line${layout.screenLines === 1 ? '' : 's'}`),
      ` · ${layout.pages} page${layout.pages === 1 ? '' : 's'} of ${PAGE_LINES} lines · ${LINE_CHARS} characters a line`,
    );
    const fix = h('button', { class: 'ts-fix', onclick: () => ((area.value = wrapLongLines(area.value)), changed()) }, 'Wrap long lines at words');
    clear(
      warnings,
      ...blank.map(([l, i]) =>
        h(
          'li',
          { class: 'warn' },
          h('button', { class: 'linkish', onclick: () => selectLine(i) }, `Line ${i + 1}`),
          ` is exactly ${l.text.length} characters. The game reads text ${LINE_CHARS} characters at a time, so it shows an extra blank line after it. Make it shorter (or join it with the next line).`,
        ),
      ),
      ...wraps.map(([l, i]) =>
        h(
          'li',
          null,
          h('button', { class: 'linkish', onclick: () => selectLine(i) }, `Line ${i + 1}`),
          ` has ${l.text.length} characters: the game cuts it after ${LINE_CHARS}, even mid-word.`,
        ),
      ),
      blank.length || wraps.length ? h('li', { class: 'fix' }, fix) : null,
    );
  };

  const fit = () => {
    area.style.height = 'auto';
    area.style.width = 'auto';
    area.style.height = `${area.scrollHeight}px`;
    area.style.width = `${Math.max(paper.clientWidth, area.scrollWidth)}px`;
    guides.style.width = area.style.width;
    guides.style.height = area.style.height;
  };

  const syncPage = () => {
    if (follow) page = pageOfLine(layout, caretLine());
    drawPage();
  };

  const save = debounce(() => project.files.set(file, textBytes(area.value.replace(/\n/g, '\r\n'))), 300);
  const changed = () => {
    layout = layoutText(area.value);
    renderGuides();
    renderStatus();
    fit();
    follow = true;
    syncPage();
    save();
  };

  area.addEventListener('input', changed);
  for (const ev of ['click', 'keyup', 'focus']) area.addEventListener(ev, () => ((follow = true), syncPage()));
  prevBtn.addEventListener('click', () => ((follow = false), page--, drawPage()));
  nextBtn.addEventListener('click', () => ((follow = false), page++, drawPage()));

  const backgrounds = (): [string, string][] => [
    ['', 'A black screen'],
    ...project.files
      .names()
      .filter((n) => BACKGROUND_KINDS.includes(kindOf(n)))
      .map((n): [string, string] => [n, n.toUpperCase()]),
  ];
  const bgSelect = h('select', { 'aria-label': 'Shown over' }, ...backgrounds().map(([v, t]) => h('option', { value: v, selected: v === background }, t)));
  bgSelect.addEventListener('change', () => ((background = bgSelect.value), drawPage()));

  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      `Text screens are written over the current picture in purple, ${LINE_CHARS} characters a line and ${PAGE_LINES} lines a page. The dashed lines mark where each page starts; the edge on the right is where the game cuts a line.`,
    ),
    h(
      'div',
      { class: 'ts-layout' },
      h('div', { class: 'ts-editor' }, paper, status, warnings),
      h(
        'div',
        { class: 'ts-side' },
        h(
          'div',
          { class: 'ts-bar' },
          h('label', { class: 'field ts-over' }, h('span', null, 'Shown over'), bgSelect),
          h('span', { class: 'spacer' }),
          prevBtn,
          pageLabel,
          nextBtn,
        ),
        preview.el,
      ),
    ),
  );
  renderGuides();
  renderStatus();
  requestAnimationFrame(fit);
  drawPage();
  const ro = new ResizeObserver(() => fit());
  ro.observe(paper);
  return () => {
    ro.disconnect();
    preview.stop();
  };
});
