// Back up / restore, the Settings menu's item (settingsMenu.ts loads this when it is chosen):
// the Back up dialog, and from it "Restore from a file…", which reads the file and checks it
// through before the Restore dialog shows what it would do.
import { modal, h, pickFiles } from '../editor/core/ui';
import { exportDialog } from './exportDialog';
import { EXTENSION, readBackup } from './file';
import { importDialog } from './importDialog';
import { BackupError } from './sections/types';
import './backup.css';

export async function openDataBackup(): Promise<void> {
  if ((await exportDialog()) === 'restore') await restoreFromFile();
}

/** Asks for a backup file, then shows the Restore dialog (or why the file can't be used). */
export async function restoreFromFile(): Promise<void> {
  const [file] = await pickFiles({ multiple: false, accept: `${EXTENSION},.zip` });
  if (!file) return;
  let backup;
  try {
    backup = await readBackup(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    const message = e instanceof BackupError ? e.message : `This file can’t be read (${(e as Error).message}).`;
    await modal<void>('This file can’t be restored', (close) => [
      h('p', { class: 'backup-lead' }, message),
      h('p', { class: 'backup-about' }, 'Nothing was changed.'),
      h('div', { class: 'buttons' }, h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(undefined) }, 'OK')),
    ]);
    return;
  }
  await importDialog(backup);
}
