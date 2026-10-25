// Re-sealing the Mac player for each game, without a Mac: the player binary
// (web/public/mac/GameMakerPlayer, built by mac/build.sh) is ad-hoc signed once, inside a
// template app. Its code signature's CodeDirectory holds, besides the hashes of the code's
// pages (unchanged here), "special slots" with the hashes of the app's Info.plist (slot 1)
// and of its sealed resources list, Contents/_CodeSignature/CodeResources (slot 3). Each
// game's app has its own Info.plist and resources, so this writes their CodeResources and
// puts the two new hashes in every CodeDirectory of every architecture in the binary.
// An ad-hoc signature has no certificate signing the CodeDirectory, so nothing else changes,
// and `codesign --verify --deep --strict` accepts the result.
//
// Formats: Mach-O (mach-o/loader.h, mach-o/fat.h) and the code signature blobs
// (Security framework's cscdefs.h / codesign's CodeDirectory), all big-endian except the
// Mach-O headers.

const FAT_MAGIC = 0xcafebabe;
const MH_MAGIC_64 = 0xfeedfacf;
const MH_MAGIC = 0xfeedface;
const LC_CODE_SIGNATURE = 0x1d;
const CSMAGIC_EMBEDDED_SIGNATURE = 0xfade0cc0;
const CSMAGIC_CODEDIRECTORY = 0xfade0c02;
const SLOT_INFO = 1;
const SLOT_RESOURCES = 3;

type HashName = 'SHA-1' | 'SHA-256';

export async function hash(name: HashName, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest(name, data as BufferSource));
}

/** Where each architecture's Mach-O image starts and ends in the file (one, if it is not universal). */
function machSlices(bin: Uint8Array): [start: number, end: number][] {
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  if (dv.getUint32(0) === FAT_MAGIC) {
    const n = dv.getUint32(4);
    return Array.from({ length: n }, (_, i) => {
      const at = 8 + i * 20;
      const offset = dv.getUint32(at + 8);
      return [offset, offset + dv.getUint32(at + 12)];
    });
  }
  return [[0, bin.length]];
}

/** Where each CodeDirectory is in the file, with its hash kind. */
export function codeDirectories(bin: Uint8Array): { at: number; hash: HashName; hashOffset: number; hashSize: number; specialSlots: number }[] {
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const out: ReturnType<typeof codeDirectories> = [];
  for (const [start] of machSlices(bin)) {
    const magic = dv.getUint32(start, true);
    if (magic !== MH_MAGIC_64 && magic !== MH_MAGIC) throw new Error('The Mac player is not a Mach-O program.');
    const ncmds = dv.getUint32(start + 16, true);
    let cmd = start + (magic === MH_MAGIC_64 ? 32 : 28);
    let sig: number | undefined;
    for (let i = 0; i < ncmds; i++) {
      if (dv.getUint32(cmd, true) === LC_CODE_SIGNATURE) sig = start + dv.getUint32(cmd + 8, true);
      cmd += dv.getUint32(cmd + 4, true);
    }
    if (sig === undefined || dv.getUint32(sig) !== CSMAGIC_EMBEDDED_SIGNATURE) throw new Error('The Mac player is not signed.');
    const count = dv.getUint32(sig + 8);
    for (let i = 0; i < count; i++) {
      const blob = sig + dv.getUint32(sig + 12 + i * 8 + 4);
      if (dv.getUint32(blob) !== CSMAGIC_CODEDIRECTORY) continue;
      const kind = dv.getUint8(blob + 37);
      if (kind !== 1 && kind !== 2) throw new Error(`The Mac player's signature uses an unknown hash (${kind}).`);
      out.push({
        at: blob,
        hash: kind === 1 ? 'SHA-1' : 'SHA-256',
        hashOffset: dv.getUint32(blob + 16),
        hashSize: dv.getUint8(blob + 36),
        specialSlots: dv.getUint32(blob + 24),
      });
    }
  }
  return out;
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The resource rules codesign writes for an app (its defaults); they say what the seal covers.
const RULES = `	<key>rules</key>
	<dict>
		<key>^Resources/</key>
		<true/>
		<key>^Resources/.*\\.lproj/</key>
		<dict>
			<key>optional</key>
			<true/>
			<key>weight</key>
			<real>1000</real>
		</dict>
		<key>^Resources/.*\\.lproj/locversion.plist$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>1100</real>
		</dict>
		<key>^Resources/Base\\.lproj/</key>
		<dict>
			<key>weight</key>
			<real>1010</real>
		</dict>
		<key>^version.plist$</key>
		<true/>
	</dict>
	<key>rules2</key>
	<dict>
		<key>.*\\.dSYM($|/)</key>
		<dict>
			<key>weight</key>
			<real>11</real>
		</dict>
		<key>^(.*/)?\\.DS_Store$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>2000</real>
		</dict>
		<key>^(Frameworks|SharedFrameworks|PlugIns|Plug-ins|XPCServices|Helpers|MacOS|Library/(Automator|Spotlight|LoginItems))/</key>
		<dict>
			<key>nested</key>
			<true/>
			<key>weight</key>
			<real>10</real>
		</dict>
		<key>^.*</key>
		<true/>
		<key>^Info\\.plist$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^PkgInfo$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^Resources/</key>
		<dict>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^Resources/.*\\.lproj/</key>
		<dict>
			<key>optional</key>
			<true/>
			<key>weight</key>
			<real>1000</real>
		</dict>
		<key>^Resources/.*\\.lproj/locversion.plist$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>1100</real>
		</dict>
		<key>^Resources/Base\\.lproj/</key>
		<dict>
			<key>weight</key>
			<real>1010</real>
		</dict>
		<key>^[^/]+$</key>
		<dict>
			<key>nested</key>
			<true/>
			<key>weight</key>
			<real>10</real>
		</dict>
		<key>^embedded\\.provisionprofile$</key>
		<dict>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^version\\.plist$</key>
		<dict>
			<key>weight</key>
			<real>20</real>
		</dict>
	</dict>`;

/**
 * Contents/_CodeSignature/CodeResources for an app whose sealed files are `files` (paths
 * relative to Contents/, e.g. "Resources/game.html"): each file's SHA-1 ("files", for old
 * systems) and SHA-256 ("files2"), as codesign writes it.
 */
async function codeResources(files: [path: string, data: Uint8Array][]): Promise<Uint8Array> {
  const sorted = [...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const hashed = await Promise.all(sorted.map(async ([p, d]) => [p, await hash('SHA-1', d), await hash('SHA-256', d)] as const));
  const files1 = hashed.map(([p, h1]) => `\t\t<key>${xml(p)}</key>\n\t\t<data>\n\t\t${b64(h1)}\n\t\t</data>\n`).join('');
  const files2 = hashed
    .map(([p, , h2]) => `\t\t<key>${xml(p)}</key>\n\t\t<dict>\n\t\t\t<key>hash2</key>\n\t\t\t<data>\n\t\t\t${b64(h2)}\n\t\t\t</data>\n\t\t</dict>\n`)
    .join('');
  const text = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>files</key>
	<dict>
${files1}	</dict>
	<key>files2</key>
	<dict>
${files2}	</dict>
${RULES}
</dict>
</plist>
`;
  return new TextEncoder().encode(text);
}

/**
 * The player binary re-sealed for an app with this Info.plist and these resources (paths
 * relative to Contents/), and the CodeResources file that goes with it.
 */
export async function resealPlayer(
  player: Uint8Array,
  infoPlist: Uint8Array,
  resources: [path: string, data: Uint8Array][],
): Promise<{ binary: Uint8Array; codeResources: Uint8Array }> {
  const sealed = await codeResources(resources);
  const binary = player.slice();
  const dirs = codeDirectories(binary);
  if (!dirs.length) throw new Error('The Mac player has no code directory.');
  for (const d of dirs) {
    if (d.specialSlots < SLOT_RESOURCES) throw new Error('The Mac player was signed without a bundle (rebuild it with mac/build.sh).');
    const slot = (n: number) => d.at + d.hashOffset - n * d.hashSize;
    binary.set((await hash(d.hash, infoPlist)).subarray(0, d.hashSize), slot(SLOT_INFO));
    binary.set((await hash(d.hash, sealed)).subarray(0, d.hashSize), slot(SLOT_RESOURCES));
  }
  return { binary, codeResources: sealed };
}
