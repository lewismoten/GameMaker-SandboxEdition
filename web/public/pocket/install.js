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
const MANIFESTS = { '35': 'manifest-35.json', 28: 'manifest-28.json' };
function show(value) {
  slot.replaceChildren();
  const manifest = MANIFESTS[value];
  if (!manifest) return;
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
