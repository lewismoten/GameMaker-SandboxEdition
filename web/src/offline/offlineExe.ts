// OFFLINE.EXE on the desk PC (C:\DOS): the web's "Play offline" (offlineDialog.ts) as a 1995
// text-mode program in Game-Maker's colors. It says what a copy of the whole site costs,
// downloads it with a progress bar (Esc stops; what came in is kept), and once it is all in
// says so, with R to remove it again.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '../retro/text/cp437';
import { hasRoom, makeOffline, offlineStatus, removeOffline, sizeText, type OfflineProgress, type OfflineStatus } from './offlineCopy';

const X = 9;
const W = 62;
const TOP = 5;
const H = 14;
const TEXT = attr(15, 1);
const DIM = attr(7, 1);

/** Words wrapped to `n` columns. */
function wrap(text: string, n: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if (line && line.length + 1 + w.length > n) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

export async function runOfflineExe(ui: Ui): Promise<void> {
  const s = ui.screen;
  s.cursorVisible = false;
  s.gameMakerColors();
  const frame = (heading: string, keys: string) => {
    s.fill(0, 0, 79, 24, attr(7, 0), 176);
    s.write(0, 0, TITLEATTR, toCp437(' OFFLINE.EXE  Take-Along Copy 1.0'.padEnd(57) + 'Sandbox Software 1995 ').slice(0, 80));
    s.window(X, TOP, W, H, MENUATTR, SHADATTR);
    s.write(X + Math.floor((W - heading.length - 2) / 2), TOP - 1, attr(15, 1), toCp437(` ${heading} `));
    s.write(0, 24, BARATTR, toCp437(keys).padEnd(80).slice(0, 80));
  };
  const lines = (rows: [string, number?][]) => {
    let y = TOP + 1;
    for (const [text, a] of rows) for (const l of text ? wrap(text, W - 4) : ['']) if (y < TOP + H - 1) s.write(X + 2, y++, a ?? TEXT, toCp437(l.padEnd(W - 4)));
  };
  const games = (st: OfflineStatus) => st.files.filter((f) => f.path.endsWith('.gmpak')).length;
  const space = (st: OfflineStatus) => (st.quota !== undefined && st.usage !== undefined ? `Room for the site here: about ${sizeText(Math.max(0, st.quota - st.usage))} free.` : '');

  try {
    frame('TAKE IT ALONG', ' Please wait...');
    lines([['Checking what is on this computer already...']]);
    let st = await offlineStatus();
    let note = '';
    for (;;) {
      if (!st.supported) {
        frame('TAKE IT ALONG', ' Esc Quit');
        lines([[st.reason ?? 'An offline copy cannot be made here.'], [''], ['Each part still works offline once you have used it.', DIM]]);
        const k = await ui.keys.next();
        if (k.key === 'Escape' || k.key === 'Enter' || k.key.toUpperCase() === 'Q') return;
        continue;
      }
      if (st.ready) {
        frame('READY OFFLINE', ' R Remove offline copies   Esc Quit');
        lines([
          [`√ Ready offline. All ${games(st)} games, this desk, Game-Maker, the editors, the manuals and the boxes are on this computer (${sizeText(st.wireTotal)}).`],
          [''],
          ['Everything works with no connection.'],
          [''],
          [note, DIM],
          [space(st), DIM],
        ]);
        const k = (await ui.keys.next()).key.toUpperCase();
        if (k === 'ESCAPE' || k === 'Q' || k === 'ENTER') return;
        if (k === 'R') {
          frame('READY OFFLINE', ' Please wait...');
          lines([['Removing the offline copy...']]);
          await removeOffline(st).catch(() => undefined);
          note = 'Removed. Parts you use are kept again as you use them.';
          st = await offlineStatus();
        }
        continue;
      }
      const partial = st.missing.length < st.files.length;
      const room = hasRoom(st, st.storedMissing);
      frame('TAKE IT ALONG', room ? ' Y Download   N or Esc Quit' : ' Esc Quit');
      lines([
        [
          st.wanted && partial
            ? `Your offline copy needs an update: ${st.missing.length} files are new or changed.`
            : `Copies the whole site to this computer, so it runs with no connection: all ${games(st)} games, this desk, Game-Maker, the editors, the manuals and the boxes.`,
        ],
        [''],
        [`Download: ${sizeText(st.wireMissing)}   Kept on disk: about ${sizeText(st.storedMissing)}`],
        [space(st), DIM],
        [room ? '' : 'Not enough room left on this computer for it.'],
        [note, DIM],
        [room ? 'Download it now? (Y/N)' : ''],
      ]);
      note = '';
      const k = (await ui.keys.next()).key.toUpperCase();
      if (k === 'ESCAPE' || k === 'N' || k === 'Q') return;
      if (k !== 'Y' || !room) continue;

      // the download, with a bar of blocks; Esc stops it
      const stop = new AbortController();
      let p: OfflineProgress = { done: 0, total: st.missing.length, bytes: 0, totalBytes: st.wireMissing };
      const draw = () => {
        frame('DOWNLOADING', ' Esc Stop');
        const bar = W - 4;
        const filled = Math.round((p.bytes / Math.max(1, p.totalBytes)) * bar);
        lines([['Copying the site to this computer...'], ['']]);
        s.write(X + 2, TOP + 3, attr(14, 1), toCp437('█'.repeat(filled) + '░'.repeat(bar - filled)));
        s.write(X + 2, TOP + 5, TEXT, toCp437(`${sizeText(p.bytes)} of ${sizeText(p.totalBytes)}   ${p.done} of ${p.total} files`.padEnd(W - 4)));
      };
      draw();
      const run = makeOffline(st, (q) => (p = q), stop.signal);
      let finished = false;
      void run.finally(() => (finished = true));
      while (!finished) {
        await new Promise((r) => setTimeout(r, 120));
        for (let k2 = ui.keys.poll(); k2; k2 = ui.keys.poll()) if (k2.key === 'Escape') stop.abort();
        draw();
      }
      const result = await run;
      if (!result.ok) note = result.message;
      st = await offlineStatus();
    }
  } finally {
    s.resetPalette();
    s.clear();
  }
}
