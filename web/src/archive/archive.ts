// archive.html: fetches every file of the site (offline.json), a few at a time, so a web archive's
// "save page" records them. Nothing links here. It registers no service worker, writes no storage and
// shows counts only: never a file's or a game's name.
import { fetchOrder, partCount, takePart, type Manifest } from './plan';

const AT_ONCE = 4;

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const say = (text: string) => ($('status').textContent = text);

async function fetchOne(url: string): Promise<boolean> {
  for (let tries = 0; tries < 2; tries++) {
    try {
      // 'reload': past the browser's cache, so the archive's crawler sees the request
      const r = await fetch(url, { cache: 'reload' });
      await r.arrayBuffer();
      if (r.ok) return true;
    } catch {
      /* try once more */
    }
  }
  return false;
}

async function run(): Promise<void> {
  const q = new URLSearchParams(location.search);
  let manifest: Manifest;
  try {
    manifest = (await (await fetch('./offline.json', { cache: 'reload' })).json()) as Manifest;
  } catch {
    say('The list of files is not here. This page works on the published site.');
    return;
  }
  const order = fetchOrder(manifest, q.get('games') === '1');
  const part = Math.max(0, Number(q.get('part')) || 0);
  const list = takePart(order, part);
  const base = new URL('./', location.href);
  const bar = $('bar') as HTMLProgressElement;
  bar.max = Math.max(1, list.length);
  if (part) $('part').textContent = `Part ${part} of ${partCount(order)}.`;
  let done = 0;
  let failed = 0;
  let next = 0;
  const update = () => {
    bar.value = done + failed;
    say(`${done + failed} of ${list.length} files${failed ? `, ${failed} not available` : ''}`);
  };
  update();
  const worker = async () => {
    while (next < list.length) {
      const [path] = list[next++];
      if (await fetchOne(new URL(path, base).href)) done++;
      else failed++;
      update();
    }
  };
  await Promise.all(Array.from({ length: AT_ONCE }, worker));
  const end = $('done');
  end.hidden = false;
  end.textContent = failed ? `Done. ${failed} of ${list.length} files could not be fetched.` : `Done. All ${list.length} files were fetched.`;
}

void run();
