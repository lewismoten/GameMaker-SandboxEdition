// Apply a sidebar import as one batch after the author accepts any loss of unsaved work.
import { takeCompanion } from '../../project/companion';
import type { GameFiles } from '../../project/files';
import type { Project } from '../core/project';
import { confirmDialog } from '../core/ui';

export function confirmUnsavedImport(): Promise<boolean> {
  return confirmDialog('Import files?', 'Importing will replace your current unsaved changes.', 'Import');
}

export async function importWorkspaceFiles(project: Project, files: GameFiles): Promise<boolean> {
  const extras = takeCompanion(files);
  const sectionsByFile = Object.entries(extras?.files ?? {});
  if (!files.size && !sectionsByFile.some(([, sections]) => Object.keys(sections).length)) return false;
  if (project.hasUnsavedChanges && !(await confirmUnsavedImport())) return false;
  for (const [file, sections] of sectionsByFile) for (const [key, value] of Object.entries(sections)) project.setExtras(file, key, value);
  for (const [name, bytes] of files.entries()) project.files.set(name, bytes);
  return true;
}
