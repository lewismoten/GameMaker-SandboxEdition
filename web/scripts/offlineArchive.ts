// One deterministic, content-addressed ZIP for the site's explicit offline download.
import { createHash } from 'node:crypto';
import { createZip, type ZipEntry } from '@lewismoten/gamemaker-sandbox-archives';

export async function buildOfflineArchive(entries: ZipEntry[]) {
  // The ZIP writer uses local date fields: a local fixed date is timezone independent.
  const data = await createZip(
    [...entries].sort((a, b) => (a.name < b.name ? -1 : 1)),
    new Date(2000, 0, 1),
  );
  const sha256 = createHash('sha256').update(data).digest('hex');
  return { path: `offline.${sha256}.zip`, sha256, bytes: data.length, data };
}
