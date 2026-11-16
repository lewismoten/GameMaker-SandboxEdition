// OFFLINE.EXE on the desk PC (C:\DOS): the web's "Play offline" (offlineDialog.ts) as a 1995
// text-mode program in Game-Maker's colors. It says what a copy of the whole site costs,
// downloads selected files (Esc stops; the previous complete copy stays), and once it is all in
// says so, with R to remove it again.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { hasRoom, makeOffline, offlineStatus, removeOffline, sizeText, type OfflineProgress, type OfflineStatus } from './offlineCopy';
import { offlineTiers, type OfflineTier } from './tiers';

const X = 9;
const W = 62;
const TOP = 3;
const H = 18;
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
    for (const [text, a] of rows)
      for (const l of text ? wrap(text, W - 4) : ['']) if (y < TOP + H - 1) s.write(X + 2, y++, a ?? TEXT, toCp437(l.padEnd(W - 4)));
  };
  const space = (st: OfflineStatus) =>
    st.quota !== undefined && st.usage !== undefined ? `Room for the site here: about ${sizeText(Math.max(0, st.quota - st.usage))} free.` : '';

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
      const tiers = Object.entries(offlineTiers) as [OfflineTier, string][];
      const room = hasRoom(st, st.storedMissing);
      frame(st.ready ? 'READY OFFLINE' : 'TAKE IT ALONG', ' 1-8 Toggle tier   Y Save selection   R Remove   Esc Quit');
      lines([
        ['Core is always included. Video needs the internet.'],
        ...tiers.slice(1).map(([id, label], i): [string] => [`${i + 1} [${st.tiers.includes(id) ? 'X' : ' '}] ${label}`]),
        [`Download: ${sizeText(st.wireMissing)}   Free space needed: ${sizeText(st.storedMissing)}`],
        [space(st), DIM],
        [st.ready ? 'Ready offline. Selected tiers are kept here.' : 'Verified files resume. The old copy stays until ready.'],
        [room ? note : 'Not enough room for the replacement.', DIM],
      ]);
      note = '';
      const k = (await ui.keys.next()).key.toUpperCase();
      if (k === 'ESCAPE' || k === 'N' || k === 'Q') return;
      if (/^[1-8]$/.test(k)) {
        const id = tiers[Number(k)][0];
        st = await offlineStatus(st.tiers.includes(id) ? st.tiers.filter((t) => t !== id) : [...st.tiers, id]);
        continue;
      }
      if (k === 'R') {
        await removeOffline(st);
        st = await offlineStatus();
        continue;
      }
      if (k !== 'Y' || !room || st.ready) continue;

      // the download, with a bar of blocks; Esc stops it
      const stop = new AbortController();
      let p: OfflineProgress = { done: 0, total: st.missing.length, bytes: 0, totalBytes: st.wireTotal };
      const draw = () => {
        frame('VERIFYING FILES', ' Esc Stop');
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
      st = await offlineStatus(st.tiers);
    }
  } finally {
    s.resetPalette();
    s.clear();
  }
}
