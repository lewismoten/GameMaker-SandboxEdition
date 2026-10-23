// Credits, "Software this site uses": the npm packages from deps.json (written from the
// lockfile by scripts/credits.ts): what ships in the site, then the build and test tools,
// collapsed, each direct one with what it is for and the rest with which tool pulls them in.
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
    null,
    h('span', { class: 'dep-name' }, d.repo ? ext(d.repo, d.name) : d.name),
    ' ',
    h('span', { class: 'dep-meta' }, `${d.version} · ${d.license}${d.author ? ` · ${d.author}` : ''}`),
    note && h('span', { class: 'dep-what' }, note),
  );
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
    runtime.length
      ? h('ul', { class: 'credits-deps' }, ...runtime.map(depItem))
      : h(
          'p',
          null,
          'The site and the downloads ship no npm packages: ',
          repoFile('web/package.json'),
          ' lists none to run, only tools to build and test with. What runs in your browser is this project’s own code, plus Vite’s small module-preload helper (MIT), which Vite adds to the built pages.',
        ),
    h(
      'details',
      { class: 'credits-more' },
      h('summary', null, `Build and test tools (${tools.length} npm packages)`),
      h('p', null, 'None of these ship. Versions and licenses are from ', repoFile('web/package-lock.json'), '.'),
      h('h3', null, 'The tools'),
      h('ul', { class: 'credits-deps' }, ...direct.map(depItem)),
      h('h3', null, `What they use (${pulled.length})`),
      h('ul', { class: 'credits-deps' }, ...pulled.map(depItem)),
      data.platformBuilds.length > 0 &&
        h(
          'p',
          null,
          `Also ${data.platformBuilds.length} packages made for one operating system or processor each (from ${platforms.join(', ')}); npm installs only the ones that fit the computer.`,
        ),
      h('h3', null, 'Outside npm'),
      h(
        'ul',
        null,
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
          'Browser checks during development use Playwright (Apache-2.0) and an accessibility checker, run from outside the repository; they are not dependencies of it.',
        ),
      ),
    ),
  );
}
