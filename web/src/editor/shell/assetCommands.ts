// The asset gallery's file operations; all writes retain native bytes and companion boundaries.
import type { Project, FileKind } from '../core/project';
import { KIND_LABELS, kindOf } from '../core/project';
import { confirmDialog, download, h, modal, promptText, toast } from '../core/ui';
import { normalize } from '../../project/files';
import { validDosName } from '../../project/health';
import { deleteMessage } from './usedBy';
import { assetNames, primaryAsset, readAsset, sameAssetType, writeAsset, type AssetFile } from './assetFiles';
import { copiedAsset, copyAsset } from './assetClipboard';
import type { AssetAction } from './assetMenu';

export function assetCommands(project: Project, open: (file: string) => void) {
  const locked = () => !!project.readOnly;
  async function newName(asset: AssetFile, title: string): Promise<string | undefined> {
    const dot = asset.name.lastIndexOf('.'),
      base = dot < 0 ? asset.name : asset.name.slice(0, dot),
      ext = dot < 0 ? '' : asset.name.slice(dot + 1);
    let suggestion = normalize(project.freeName(base, ext));
    for (;;) {
      const raw = await promptText(title, 'DOS file name (up to 8 characters, then the extension)', suggestion);
      if (!raw) return;
      const wanted = !raw.includes('.') && ext ? `${raw}.${ext}` : raw;
      if (!validDosName(wanted) || !sameAssetType(asset.name, wanted)) {
        toast('Use a DOS name of the same file type, with up to 8 characters before the extension.', 'error');
        suggestion = raw;
        continue;
      }
      const name = normalize(wanted);
      if (project.files.has(name)) {
        toast(`${name.toUpperCase()} already exists. Choose another name.`, 'error');
        suggestion = raw;
        continue;
      }
      return name;
    }
  }
  async function create(asset: AssetFile, title: string): Promise<void> {
    if (locked()) return;
    const name = await newName(asset, title);
    if (!name || locked()) return;
    writeAsset(project, name, asset);
    open(name);
  }
  async function duplicate(file: string): Promise<void> {
    const asset = readAsset(project, file);
    if (asset) await create(asset, `Duplicate ${file.toUpperCase()}`);
  }
  async function paste(kind: FileKind): Promise<void> {
    const asset = copiedAsset(kind);
    if (asset) await create(asset, `Paste ${asset.name.toUpperCase()}`);
  }
  async function copyHere(kind: FileKind): Promise<void> {
    if (locked()) return;
    const files = assetNames(project, kind);
    if (!files.length) return;
    const source = await modal<string>('Copy a file from this game', (close) =>
      h(
        'div',
        { class: 'kind-grid' },
        ...files.map((file) =>
          h(
            'button',
            { type: 'button', class: 'kind-card', onclick: () => close(file) },
            h('strong', null, file.toUpperCase()),
            h('small', null, `${project.files.get(file)?.byteLength ?? 0} bytes`),
          ),
        ),
      ),
    );
    if (source) await duplicate(source);
  }
  async function replace(file: string): Promise<void> {
    const asset = copiedAsset(kindOf(file));
    if (locked() || !asset || !sameAssetType(asset.name, file) || !project.files.has(file)) return;
    if (
      !(await confirmDialog(
        'Replace file',
        `Replace ${file.toUpperCase()} with the copied ${asset.name.toUpperCase()}? Its current contents and editor extras will be replaced.`,
        'Replace',
      ))
    )
      return;
    if (locked() || !project.files.has(file)) return;
    writeAsset(project, file, asset);
    toast(`Replaced ${file.toUpperCase()}.`);
  }
  async function remove(file: string): Promise<void> {
    if (locked() || primaryAsset(project, file) || !project.files.has(file)) return;
    if (!(await confirmDialog('Delete file', deleteMessage(project, file), 'Delete'))) return;
    if (locked() || primaryAsset(project, file)) return;
    project.files.delete(file);
    for (const section of Object.keys(project.companion?.files[file] ?? {})) project.setExtras(file, section, undefined);
  }
  async function importFiles(kind: FileKind, files: File[]): Promise<void> {
    if (locked()) return;
    let added = 0,
      skipped = 0;
    for (const file of files) {
      const original = normalize(file.name);
      if (kindOf(original) !== kind) {
        skipped++;
        continue;
      }
      const dot = original.lastIndexOf('.'),
        base = dot < 0 ? original : original.slice(0, dot),
        ext = dot < 0 ? '' : original.slice(dot + 1);
      const name = validDosName(original) && !project.files.has(original) ? original : normalize(project.freeName(base, ext));
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (locked()) return;
        writeAsset(project, name, { name: original, bytes, extras: {} });
        added++;
      } catch (e) {
        toast(`Could not add ${file.name}: ${(e as Error).message}`, 'error');
      }
    }
    if (added) toast(`Added ${added} ${added === 1 ? 'file' : 'files'}.`);
    if (skipped) toast(`Choose files belonging to ${KIND_LABELS[kind].toLowerCase()} for this category.`, 'error');
  }
  function actions(file: string): AssetAction[] {
    const asset = copiedAsset(kindOf(file)),
      readonly = locked();
    return [
      { label: 'Edit', run: () => open(file) },
      { label: 'Duplicate…', run: () => void duplicate(file), disabled: readonly },
      {
        label: 'Copy',
        run: () => {
          if (readonly) return;
          copyAsset(project, file);
          toast(`Copied ${file.toUpperCase()}.`);
        },
        disabled: readonly,
      },
      { label: 'Paste to replace…', run: () => void replace(file), disabled: readonly || !asset || !sameAssetType(asset.name, file) },
      { label: 'Delete…', run: () => void remove(file), disabled: readonly || primaryAsset(project, file), danger: true },
      {
        label: 'Download',
        run: () => {
          const bytes = project.files.get(file);
          if (bytes) download(file.toUpperCase(), bytes);
        },
      },
    ];
  }
  return { actions, duplicate, paste, copyHere, importFiles };
}
