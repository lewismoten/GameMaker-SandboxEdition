// Read a catalog's DOS distribution through the archives SDK, recovering native extensions.
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { adoptPlayer } from '@lewismoten/gamemaker-sandbox-archives/project/importPlayer';
import { GameFiles, IGNORED_FILE, cdName } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';

export async function readHostedZip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const entries = await readZip(bytes);
  const files = new GameFiles(entries.filter((e) => !IGNORED_FILE.test(e.name)).map((e) => [e.name, e.data]));
  adoptPlayer(
    files,
    entries.filter((e) => /\.exe$/i.test(e.name)).map((e) => ({ name: e.name, bytes: e.data })),
  );
  const out = new Map<string, Uint8Array>();
  for (const [name, data] of files.entries()) {
    out.set(name, data);
    // The CD's ISO names replace punctuation with underscores; catalog entries keep those names.
    if (!out.has(cdName(name))) out.set(cdName(name), data);
  }
  return out;
}
