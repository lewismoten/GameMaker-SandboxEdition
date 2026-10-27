// Credits, "Software this site uses": the npm packages from deps.json (written from the
// lockfile by scripts/credits.ts): what ships in the site, then the build and test tools,
// collapsed, each direct one with what it is for, and the packages they use with a filter.
import { h } from '../editor/core/ui';
import { section, ext, repoFile } from './section';
import { DEP_NOTES } from './depNotes';
import type { Dep, DepsFile } from './lockDeps';
import file from './deps.json';

const data = file as DepsFile;
const DIRECT = new Set(data.deps.filter((d) => d.direct).map((d) => d.name));

function depItem(d: Dep): HTMLElement {
  // a direct package's note is for that one, not an older copy of it something else pulls in
  const own = d.direct || !DIRECT.has(d.name) ? DEP_NOTES[d.name] : undefined;
  const note = [own, d.usedBy.length ? `Used by ${d.usedBy.join(', ')}.` : ''].filter(Boolean).join(' ');
  return h(
    'li',
    { dataset: { find: [d.name, d.license, d.author ?? '', ...d.usedBy].join(' ').toLowerCase() } },
    h('span', { class: 'dep-name' }, d.repo ? ext(d.repo, d.name) : d.name),
    ' ',
    h('span', { class: 'dep-meta' }, `${d.version} · ${d.license}${d.author ? ` · ${d.author}` : ''}`),
    note && h('span', { class: 'dep-what' }, note),
  );
}

/** The packages the tools use, with a box to narrow them by name, license, author or tool. */
function usedList(pulled: Dep[]): HTMLElement[] {
  const items = pulled.map(depItem);
  const count = h('p', { class: 'dep-count', role: 'status' }, `${pulled.length} packages`);
  const licenses = Object.entries(pulled.reduce<Record<string, number>>((n, d) => ((n[d.license] = (n[d.license] ?? 0) + 1), n), {})).sort(
    (a, b) => b[1] - a[1],
  );
  const input = h('input', {
    type: 'search',
    id: 'dep-filter',
    placeholder: 'e.g. MIT, rollup, eslint',
    autocomplete: 'off',
    oninput: () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      for (const li of items) {
        const hit = !q || li.dataset.find!.includes(q);
        li.hidden = !hit;
        if (hit) shown++;
      }
      count.textContent = q ? `${shown} of ${pulled.length} packages match “${input.value.trim()}”` : `${pulled.length} packages`;
    },
  });
  return [
    h('p', { class: 'dep-licenses' }, 'Licenses: ', ...licenses.flatMap(([l, n], i) => [i ? ', ' : '', h('span', { class: 'dep-chip' }, `${l} ${n}`)])),
    h('div', { class: 'dep-filter' }, h('label', { for: 'dep-filter' }, 'Filter packages'), input, count),
    h('ul', { class: 'credits-deps credits-deps-grid' }, ...items),
  ];
}

export function softwareSection(): HTMLElement {
  const runtime = data.deps.filter((d) => d.runtime);
  const tools = data.deps.filter((d) => !d.runtime);
  const direct = tools.filter((d) => d.direct);
  const pulled = tools.filter((d) => !d.direct);
  const platforms = [...new Set(data.platformBuilds.map((p) => p.name.split('/')[0].replace(/^@/, '')))];
  return section(
    'credits-software',
    'Software this site uses',
    'The open-source tools that build and test the site, and the little that ships.',
    runtime.length
      ? h('ul', { class: 'credits-deps' }, ...runtime.map(depItem))
      : h(
          'div',
          { class: 'credits-callout' },
          h(
            'p',
            null,
            h('b', null, 'What ships: '),
            'no npm packages. ',
            repoFile('web/package.json'),
            ' lists none to run, only tools to build and test with.',
          ),
          h(
            'p',
            null,
            'What runs in your browser is this project’s own code, plus Vite’s small module-preload helper (MIT), which Vite adds to the built pages.',
          ),
        ),
    h(
      'details',
      { class: 'credits-more' },
      h('summary', null, `Build and test tools (${tools.length} npm packages)`),
      h('p', null, 'None of these ship. Versions and licenses are from ', repoFile('web/package-lock.json'), '.'),
      h('h3', { id: 'credits-tools' }, `The tools (${direct.length})`),
      h('ul', { class: 'credits-deps credits-deps-grid' }, ...direct.map(depItem)),
      h('h3', { id: 'credits-tools-use' }, `What they use (${pulled.length})`),
      ...usedList(pulled),
      data.platformBuilds.length > 0 &&
        h(
          'p',
          null,
          `Also ${data.platformBuilds.length} packages made for one operating system or processor each (from ${platforms.join(', ')}); npm installs only the ones that fit the computer.`,
        ),
      h('h3', { id: 'credits-outside-npm' }, 'Outside npm'),
      h(
        'ul',
        { class: 'credits-list' },
        h('li', null, ext('https://ziglang.org/', 'Zig'), ' (MIT) builds the Windows and Linux players; Apple’s Swift compiler builds the Mac player.'),
        h(
          'li',
          null,
          'The Bard of Bizarre games’ song tools run on the developer’s computer with ffmpeg, NumPy and SciPy (BSD), and OpenAI’s ',
          ext('https://github.com/openai/whisper', 'Whisper'),
          ' (MIT) for word timings. Only the note data and clips they make are committed.',
        ),
        h(
          'li',
          null,
          'The tour’s voice clips are made on the developer’s computer by ',
          repoFile('web/scripts/narrate.ts'),
          ', ported from vlapky’s ',
          ext('https://www.npmjs.com/package/pocket-tts-js', 'pocket-tts-js'),
          ' (MIT), running Kyutai’s ',
          ext('https://huggingface.co/kyutai/pocket-tts', 'Pocket TTS'),
          ' (CC BY 4.0) in vlapky’s ',
          ext('https://huggingface.co/vlapky/pocket-tts-onnx', 'ONNX conversion'),
          ' with Microsoft’s ONNX Runtime (MIT), and ffmpeg. Only the clips are committed.',
        ),
        h(
          'li',
          null,
          'Browser checks during development use Playwright (Apache-2.0) and an accessibility checker, run from outside the repository; they are not dependencies of it.',
        ),
      ),
    ),
  );
}
