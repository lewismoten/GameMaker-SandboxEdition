// Download → Windows: a game as a Windows program (one .exe), made right here in the
// browser (and by scripts/winExe.ts with the same code). The program is the small player
// from win/ (web/public/win/GameMakerPlayer-x64.exe or -arm64.exe), which plays the game in
// Microsoft Edge WebView2, with these resources put into it (peResources.ts):
//
// - RCDATA "GAME": the game's one-web-page export;
// - RCDATA "INFO": its title, id (the folder of its saved games, %LOCALAPPDATA%\GameMaker\<id>),
//   credits and the site's address, as UTF-8 key=value lines;
// - its icon, drawn from the game like the Mac app's (winIcon.ts);
// - its version information, which the Explorer and the Task Manager show (the title);
// - RCDATA "NOTICES": the third-party notices (notices.ts), which the window menu opens.
//
// It comes as the .exe itself, or in a .zip. It is not code-signed (that needs a paid
// certificate and the author's private key), so Windows SmartScreen asks to confirm the
// first time (the Download chooser, editor/shell/download.ts, and the #/windows page say how).
import { createZip } from '../project/zip';
import { SITE_URL } from '../seo/site';
import { readResources, writeResources, RT, type PeResource } from './peResources';
import { groupIcon, winIconImages } from './winIcon';
import { thirdPartyNotices } from './notices';
import type { IndexedImage } from '../formats/gif';
import type { IconColors } from './macIcon';

export type WinArch = 'x64' | 'arm64';
export const WIN_PLAYER_PATHS: Record<WinArch, string> = { x64: 'win/GameMakerPlayer-x64.exe', arm64: 'win/GameMakerPlayer-arm64.exe' };

export interface WinAppOptions {
  title: string;
  /** Lower-case letters, digits and dashes: names the folder its saved games are kept in. */
  id: string;
  /** The one-web-page export of the game (exportSinglePage / fillPage). */
  html: string;
  /** The player program (web/public/win/GameMakerPlayer-*.exe). */
  player: Uint8Array;
  version?: string;
  author?: string;
  year?: number;
  /** Our own games: made now, presented as a 1990s release (fiction.ts), in the About text. */
  fiction?: string;
  /** Shown on the icon (macApp.ts's iconPicture). */
  picture?: IndexedImage;
  colors?: IconColors;
}

const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

/** The program's file name: the title, without the characters a Windows file name cannot have. */
export function exeName(title: string): string {
  let name = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 64)
    .replace(/[.\s]+$/, '');
  if (!name || RESERVED.test(name)) name = name ? `${name} game` : 'Game';
  return `${name}.exe`;
}

/** The game's id as a folder name. */
export function winId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'game';
}

export function credits(o: Pick<WinAppOptions, 'author' | 'year' | 'fiction'>): string {
  const by = [o.author, o.year].filter(Boolean).join(', ');
  return `${by ? `By ${by}.\n\n` : ''}${o.fiction ? `${o.fiction}\n\n` : ''}Plays with Game-Maker: Sandbox Edition, a web port of Recreational Software Designs' Game-Maker 3.0 (1994).`;
}

/** RCDATA "INFO": key=value lines (a value's backslashes and newlines escaped), read by win/Player/main.c. */
export function infoText(o: Pick<WinAppOptions, 'title' | 'id' | 'author' | 'year' | 'fiction'>): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n');
  return `title=${esc(o.title)}\nid=${esc(winId(o.id))}\ncredits=${esc(credits(o))}\nsite=${esc(SITE_URL)}\n`;
}

/** Parses INFO (for tests and tools). */
export function parseInfo(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) out[line.slice(0, eq)] = line.slice(eq + 1).replace(/\\(.)/g, (_, c: string) => (c === 'n' ? '\n' : c));
  }
  return out;
}

// ---- version information (VS_VERSIONINFO) ---------------------------------------------

const utf16z = (s: string) => {
  const out = new Uint8Array((s.length + 1) * 2);
  for (let i = 0; i < s.length; i++) new DataView(out.buffer).setUint16(i * 2, s.charCodeAt(i), true);
  return out;
};
const pad4 = (n: number) => (4 - (n & 3)) & 3;

/** One block of a version resource: length, value length, type (1 text), key, then the value and the children, each 4-byte aligned. */
function versionBlock(key: string, value: Uint8Array | string | undefined, children: Uint8Array[] = []): Uint8Array {
  const k = utf16z(key);
  const v = typeof value === 'string' ? utf16z(value) : value ?? new Uint8Array(0);
  let size = 6 + k.length;
  size += pad4(size);
  const valueAt = size;
  size += v.length;
  const childAt: number[] = [];
  for (const c of children) {
    size += pad4(size);
    childAt.push(size);
    size += c.length;
  }
  const out = new Uint8Array(size);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, size, true);
  dv.setUint16(2, typeof value === 'string' ? value.length + 1 : v.length, true);
  dv.setUint16(4, typeof value === 'string' || value === undefined ? 1 : 0, true);
  out.set(k, 6);
  out.set(v, valueAt);
  children.forEach((c, i) => out.set(c, childAt[i]));
  return out;
}

function versionNumbers(version: string): [number, number, number, number] {
  const parts = version.split(/[^0-9]+/).filter(Boolean).map((p) => Math.min(65535, parseInt(p, 10)));
  return [parts[0] ?? 1, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 0];
}

/** The RT_VERSION resource: the Explorer's Details tab, and the Task Manager's name for the program (FileDescription). */
export function versionInfo(o: Pick<WinAppOptions, 'title' | 'id' | 'version' | 'author' | 'year'>): Uint8Array {
  const version = o.version ?? '1.0';
  const [a, b, c, d] = versionNumbers(version);
  const fixed = new Uint8Array(52);
  const f = new DataView(fixed.buffer);
  f.setUint32(0, 0xfeef04bd, true); // signature
  f.setUint32(4, 0x00010000, true); // structure version
  f.setUint32(8, (a << 16) | b, true); // file version
  f.setUint32(12, (c << 16) | d, true);
  f.setUint32(16, (a << 16) | b, true); // product version
  f.setUint32(20, (c << 16) | d, true);
  f.setUint32(24, 0x3f, true); // flags mask
  f.setUint32(32, 0x00040004, true); // VOS_NT_WINDOWS32
  f.setUint32(36, 1, true); // VFT_APP
  const by = o.author || 'Game-Maker: Sandbox Edition';
  const strings: [string, string][] = [
    ['CompanyName', by],
    ['FileDescription', o.title],
    ['FileVersion', version],
    ['InternalName', winId(o.id)],
    ['LegalCopyright', o.author ? `© ${[o.year, o.author].filter(Boolean).join(' ')}` : ''],
    ['OriginalFilename', exeName(o.title)],
    ['ProductName', o.title],
    ['ProductVersion', version],
    ['Comments', credits(o).replace(/\n+/g, ' ')],
  ];
  const table = versionBlock(
    '040904B0', // US English, Unicode
    undefined,
    strings.filter(([, v]) => v).map(([k, v]) => versionBlock(k, v)),
  );
  const translation = new Uint8Array([0x09, 0x04, 0xb0, 0x04]);
  return versionBlock('VS_VERSION_INFO', fixed, [versionBlock('StringFileInfo', undefined, [table]), versionBlock('VarFileInfo', undefined, [versionBlock('Translation', translation)])]);
}

// ---- the program ------------------------------------------------------------------------

/** The game's program: the player with the game, its info, icon and version information in its resources. */
export async function winExe(o: WinAppOptions): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const replaced = (r: PeResource) => r.type === RT.ICON || r.type === RT.GROUP_ICON || r.type === RT.VERSION || (r.type === RT.RCDATA && (r.name === 'GAME' || r.name === 'INFO' || r.name === 'NOTICES'));
  const kept = readResources(o.player).filter((r) => !replaced(r));
  const images = await winIconImages(o.picture, o.colors);
  return writeResources(o.player, [
    ...kept,
    ...images.map((img, i): PeResource => ({ type: RT.ICON, name: i + 1, lang: 0, data: img.data })),
    { type: RT.GROUP_ICON, name: 1, lang: 0, data: groupIcon(images, 1) },
    { type: RT.VERSION, name: 1, lang: 0, data: versionInfo(o) },
    { type: RT.RCDATA, name: 'GAME', lang: 0, data: enc.encode(o.html) },
    { type: RT.RCDATA, name: 'INFO', lang: 0, data: enc.encode(infoText(o)) },
    { type: RT.RCDATA, name: 'NOTICES', lang: 0, data: enc.encode(thirdPartyNotices('windows')) },
  ]);
}

/** The program in a .zip, with its third-party notices beside it. */
export async function winExeZip(o: WinAppOptions, date?: Date): Promise<Uint8Array> {
  return createZip([{ name: exeName(o.title), data: await winExe(o) }, { name: 'THIRD-PARTY-NOTICES.txt', data: new TextEncoder().encode(thirdPartyNotices('windows')) }], date);
}

/** Which player suits this computer: arm64 on Windows on Arm (when the browser says), else x64 (which Arm PCs run too). */
export async function preferredArch(): Promise<WinArch> {
  type UAData = { platform?: string; getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }> };
  const ua = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
  try {
    if (ua?.platform === 'Windows' && ua.getHighEntropyValues) {
      const { architecture, bitness } = await ua.getHighEntropyValues(['architecture', 'bitness']);
      if (architecture === 'arm' && bitness === '64') return 'arm64';
    }
  } catch {
    /* x64 */
  }
  return 'x64';
}

/** The player program, from where the web app is served. */
export async function fetchWinPlayer(arch: WinArch = 'x64', appBase = new URL('./', location.href).href): Promise<Uint8Array> {
  const res = await fetch(new URL(WIN_PLAYER_PATHS[arch], appBase)).catch(() => undefined);
  if (!res?.ok) throw new Error('Could not load the Windows player. Reload Game-Maker: Sandbox Edition while online and try again.');
  return new Uint8Array(await res.arrayBuffer());
}
