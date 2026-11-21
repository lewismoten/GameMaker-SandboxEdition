// Pocket Player install page: shows the Install button for the board the visitor picked.
// The button (ESP Web Tools, vendored in ewt/) is created on the pick, with that board's manifest.
try {
  const t = localStorage.getItem('gm-theme');
  const light = t === 'light' || (t === 'auto' && matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
} catch {
  document.documentElement.dataset.theme = 'dark';
}
const slot = document.getElementById('install-slot');
const MANIFESTS = { 35: 'manifest-35.json', 28: 'manifest-28.json' };
const BOARDS = { 35: 'esp32-3248s035', 28: 'cyd-2432s028' };
// The firmware images are downloaded at production build time (web/scripts/pocketFirmware.ts); a dev server or a build
// without them has none, so say so plainly instead of offering a button that cannot work.
async function hasFirmware(value) {
  try {
    const r = await fetch(`fw/${BOARDS[value]}/firmware.bin`, { method: 'HEAD' });
    return r.ok && !(r.headers.get('content-type') || '').includes('text/html');
  } catch {
    return false;
  }
}
async function show(value) {
  slot.replaceChildren();
  const manifest = MANIFESTS[value];
  if (!manifest) return;
  if (!(await hasFirmware(value))) {
    const p = document.createElement('p');
    p.textContent = 'The firmware is not downloaded in this build, so there is nothing to install here.';
    slot.append(p);
    return;
  }
  const btn = document.createElement('esp-web-install-button');
  btn.setAttribute('manifest', manifest);
  for (const [name, text] of [
    ['unsupported', "This browser can't flash a board. Use desktop Chrome or Edge."],
    ['not-allowed', 'Open this page from https, not a file.'],
  ]) {
    const s = document.createElement('span');
    s.slot = name;
    s.textContent = text;
    btn.append(s);
  }
  slot.append(btn);
}
for (const r of document.querySelectorAll('input[name="board"]')) {
  r.addEventListener('change', () => show(r.value));
  if (r.checked) show(r.value);
}
