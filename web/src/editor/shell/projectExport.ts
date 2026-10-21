// Saving a project out of the browser: as a zip of its files, as an offline web app, as a
// single web page, or as a DOS game folder with PLAYGAME (see ../../export).
import { download, toast } from '../core/ui';
import { loadProject } from '../../project/storage';
import { createZip } from '../../project/zip';
import { exportWebApp } from '../../export/exportWebApp';
import { exportSinglePage } from '../../export/exportSinglePage';
import { exportDos } from '../../export/exportDos';
import { parseGame } from '../../formats/game';

export async function downloadProject(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  const zip = await createZip(p.files.entries().map(([name, data]) => ({ name: name.toUpperCase(), data })));
  download(`${p.record.gam.replace(/\.gam$/i, '')}.zip`, zip, 'application/zip');
}

export async function exportProject(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  try {
    toast('Building web app…');
    const title = parseGame(p.files.get(p.record.gam)!).scenes[0]?.desc || p.record.name;
    const { name, zip } = await exportWebApp(p.files, { title, gam: p.record.gam });
    download(name, zip, 'application/zip');
    toast(`Saved ${name}. Unzip it onto any static web host.`);
  } catch (e) {
    toast((e as Error).message, 'error');
  }
}

export async function exportProjectPage(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  try {
    toast('Building web page…');
    const title = parseGame(p.files.get(p.record.gam)!).scenes[0]?.desc || p.record.name;
    const { name, html } = await exportSinglePage(p.files, { title, gam: p.record.gam });
    download(name, html, 'text/html');
    toast(`Saved ${name}. Open it in any browser to play — no internet needed.`);
  } catch (e) {
    toast((e as Error).message, 'error');
  }
}

export async function exportProjectForDos(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  try {
    const title = parseGame(p.files.get(p.record.gam)!).scenes[0]?.desc || p.record.name;
    const { name, zip, exe } = await exportDos(p.files, { title, gam: p.record.gam });
    download(name, zip, 'application/zip');
    toast(`Saved ${name}. In DOSBox, run ${exe} from the unzipped folder.`);
  } catch (e) {
    toast((e as Error).message, 'error');
  }
}
