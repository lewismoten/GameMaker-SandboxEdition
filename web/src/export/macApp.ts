// Download → Mac: a game as a native Mac app, made right here in the browser (and by
// mac/package.ts with the same code). The app is the small player program from mac/
// (web/public/mac/GameMakerPlayer, one universal binary for Apple silicon and Intel Macs),
// the game's one-web-page export as Contents/Resources/game.html, an Info.plist naming the
// game, and an icon drawn from the game. The player's ad-hoc signature is re-sealed for the
// new Info.plist and resources (macSign.ts), so the app's signature is valid.
//
// It comes as a disk image (.dmg: an ISO 9660 + Rock Ridge image, iso9660.ts, compressed
// as a UDZO image, udif.ts, that opens to the app beside an Applications shortcut to drag
// it onto) or a .zip (the Finder's
// Archive Utility unzips it to the app, still executable).
//
// The app is not notarized by Apple (that needs a paid Apple Developer ID), so the first
// time it is opened macOS asks to confirm (the Download chooser, editor/shell/download.ts, and the #/mac page say how).
import { parseGame } from '../formats/game';
import { decodeGif, isGif, type IndexedImage } from '../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../formats/fli';
import { gamePicture, type FileSource } from '../gfx/levelPicture';
import { createZip } from '../project/zip';
import { SITE_URL } from '../seo/site';
import { createIso } from './iso9660';
import { udzo } from './udif';
import { dsStore } from './dsStore';
import { macIcon, type IconColors } from './macIcon';
import { resealPlayer } from './macSign';
import { thirdPartyNotices } from './notices';

export const PLAYER_PATH = 'mac/GameMakerPlayer';
const EXECUTABLE = 'GameMakerPlayer';

export interface MacAppOptions {
  title: string;
  /** Lower-case letters, digits and dashes: the bundle identifier is com.lewismoten.gamemaker.<id>. */
  id: string;
  /** The one-web-page export of the game (exportSinglePage / fillPage). */
  html: string;
  /** The player program (web/public/mac/GameMakerPlayer). */
  player: Uint8Array;
  version?: string;
  author?: string;
  year?: number;
  /** Shown on the app's icon (iconPicture). */
  picture?: IndexedImage;
  colors?: IconColors;
}

export interface MacAppFile {
  path: string;
  data?: Uint8Array;
  mode: number;
  symlink?: string;
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The app's folder name: the title, without the characters a Mac file name cannot have. */
export function appName(title: string): string {
  const name = title.replace(/[/:\\\u0000-\u001f]+/g, '-').replace(/^[.\s]+|\s+$/g, '').slice(0, 64).trim() || 'Game';
  return `${name}.app`;
}

export function bundleId(id: string): string {
  const clean = id.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'game';
  return `com.lewismoten.gamemaker.${clean}`;
}

export function infoPlist(o: Pick<MacAppOptions, 'title' | 'id' | 'version' | 'author' | 'year'>): string {
  const version = o.version ?? '1.0';
  const by = [o.author, o.year].filter(Boolean).join(', ');
  const credits = `${by ? `By ${by}.\n\n` : ''}Plays with Game-Maker: Sandbox Edition, a web port of Recreational Software Designs' Game-Maker 3.0 (1994).`;
  const copyright = by ? `© ${[o.year, o.author].filter(Boolean).join(' ')}` : '';
  const entries: [string, string][] = [
    ['CFBundleDevelopmentRegion', 'en'],
    ['CFBundleDisplayName', o.title],
    ['CFBundleExecutable', EXECUTABLE],
    ['CFBundleIconFile', 'AppIcon'],
    ['CFBundleIdentifier', bundleId(o.id)],
    ['CFBundleInfoDictionaryVersion', '6.0'],
    ['CFBundleName', o.title.slice(0, 64)],
    ['CFBundlePackageType', 'APPL'],
    ['CFBundleShortVersionString', version],
    ['CFBundleVersion', version],
    ['GMCredits', credits],
    ['GMSite', SITE_URL],
    ['LSApplicationCategoryType', 'public.app-category.games'],
    ['LSMinimumSystemVersion', '11.0'],
    ...(copyright ? ([['NSHumanReadableCopyright', copyright]] as [string, string][]) : []),
  ];
  const body = entries.map(([k, v]) => `\t<key>${k}</key>\n\t<string>${xml(v)}</string>\n`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${body}\t<key>NSHighResolutionCapable</key>
\t<true/>
\t<key>NSSupportsAutomaticGraphicsSwitching</key>
\t<true/>
</dict>
</plist>
`;
}

/**
 * The picture on the icon: the game's first level as the player sees it (16 x 12 blocks,
 * 4:3), or else its title picture (a GIF, or an FLI's last frame).
 */
export function iconPicture(files: FileSource, gam: string): IndexedImage | undefined {
  try {
    const bytes = files.get(gam);
    if (!bytes) return undefined;
    const game = parseGame(bytes);
    const level = gamePicture(files, game, 16, 12);
    if (level) return level;
    const title = files.get(game.scenes[0]?.files[0] ?? '');
    if (title && isGif(title)) return decodeGif(title);
    if (title && isFli(title)) {
      const anim = parseFli(title);
      const c = newFliCanvas(anim);
      for (let i = 0; i < anim.frameCount; i++) applyFliFrame(anim, i, c);
      return { width: anim.width, height: anim.height, pixels: c.pixels, palette: c.palette };
    }
  } catch {
    /* no picture: the icon shows an empty screen */
  }
  return undefined;
}

/** Every file of the app, under "<Title>.app/". */
export async function macAppFiles(o: MacAppOptions): Promise<{ name: string; files: MacAppFile[] }> {
  const enc = new TextEncoder();
  const name = appName(o.title);
  const info = enc.encode(infoPlist(o));
  const { icns } = await macIcon(o.picture, o.colors);
  const resources: [string, Uint8Array][] = [
    ['Resources/AppIcon.icns', icns],
    ['Resources/game.html', enc.encode(o.html)],
  ];
  const { binary, codeResources } = await resealPlayer(o.player, info, resources);
  const files: MacAppFile[] = [
    { path: `${name}/Contents/Info.plist`, data: info, mode: 0o644 },
    { path: `${name}/Contents/PkgInfo`, data: enc.encode('APPL????'), mode: 0o644 },
    { path: `${name}/Contents/MacOS/${EXECUTABLE}`, data: binary, mode: 0o755 },
    ...resources.map(([p, data]) => ({ path: `${name}/Contents/${p}`, data, mode: 0o644 })),
    { path: `${name}/Contents/_CodeSignature/CodeResources`, data: codeResources, mode: 0o644 },
  ];
  return { name, files };
}

/** THIRD-PARTY-NOTICES.txt, beside the app in the .zip and on the .dmg (notices.ts). */
export const NOTICES_FILE = 'THIRD-PARTY-NOTICES.txt';
export const macNotices = () => new TextEncoder().encode(thirdPartyNotices('mac'));

/** The disk image's Finder window: the app, an Applications shortcut to drag it onto, and the notices below. */
export function dmgWindow(name: string): Uint8Array {
  return dsStore({ x: 200, y: 140, width: 600, height: 440, iconSize: 128, icons: { [name]: [160, 170], Applications: [440, 170], [NOTICES_FILE]: [300, 330] } });
}

/** The app in a .zip (Archive Utility makes the app from it, executable), with its notices. */
export async function macAppZip(o: MacAppOptions, date?: Date): Promise<Uint8Array> {
  const { files } = await macAppFiles(o);
  return createZip(
    [...files.map((f) => ({ name: f.path, data: f.data!, mode: 0o100000 | f.mode })), { name: NOTICES_FILE, data: macNotices(), mode: 0o100644 }],
    date,
  );
}

/** The app on a disk image (.dmg) that opens to the app and an Applications shortcut. */
export async function macAppDmg(o: MacAppOptions, date?: Date): Promise<Uint8Array> {
  const { name, files } = await macAppFiles(o);
  const iso = createIso(
    [
      ...files.map((f) => ({ path: f.path, data: f.data, mode: f.mode })),
      { path: 'Applications', symlink: '/Applications', mode: 0o755 },
      { path: NOTICES_FILE, data: macNotices(), mode: 0o644 },
      { path: '.DS_Store', data: dmgWindow(name), mode: 0o644 },
    ],
    { volume: name.replace(/\.app$/, '').slice(0, 32), date, application: 'GAME-MAKER: SANDBOX EDITION' },
  );
  return udzo(iso);
}

/** The player program, from where the web app is served. */
export async function fetchMacPlayer(appBase = new URL('./', location.href).href): Promise<Uint8Array> {
  const res = await fetch(new URL(PLAYER_PATH, appBase)).catch(() => undefined);
  if (!res?.ok) throw new Error('Could not load the Mac player. Reload Game-Maker: Sandbox Edition while online and try again.');
  return new Uint8Array(await res.arrayBuffer());
}

/** Icon colors from an original game's box (its background, darker below). */
export function boxColors(box: { background?: string } | undefined): IconColors | undefined {
  const m = box?.background && /^#([0-9a-f]{6})$/i.exec(box.background);
  if (!m) return undefined;
  const n = parseInt(m[1], 16);
  const dark = [16, 8, 0].map((s) => Math.round(((n >> s) & 255) * 0.45).toString(16).padStart(2, '0')).join('');
  return { top: box!.background!, bottom: `#${dark}` };
}
