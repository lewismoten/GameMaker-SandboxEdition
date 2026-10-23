// "Download for Linux": a game as a folder that plays in a window of its own, made right here
// in the browser (and by scripts/linuxTar.ts with the same code), saved as <Title>.tar.gz
// (tar keeps the programs executable). Inside the <Title> folder:
//
// - play.sh: runs the player for this computer (x86_64 or aarch64) on the game, or, when
//   WebKitGTK is not installed, opens game.html in the web browser instead;
// - GameMakerPlayer-x86_64 and -aarch64: the small player from linux/ (web/public/linux),
//   a GTK window with WebKitGTK that it loads at run time;
// - game.html: the game's one-web-page export; icon.png: drawn from the game like the Mac
//   app's icon (macIcon.ts);
// - install.sh / uninstall.sh: copy the game to ~/.local/share/GameMaker/<id>/app and add it
//   to the applications menu (a .desktop entry), or take it out again;
// - README.txt: how to play it, and the packages it needs.
//
// Linux asks nothing about signatures; some file managers need "Allow executing file as
// program" ticked (or "Run" chosen) for play.sh.
import { drawIcon, encodeRgbaPng, type IconColors } from './macIcon';
import { shrink } from './winIcon';
import { createTarGz, type TarEntry } from './tar';
import { SITE_URL } from '../seo/site';
import type { IndexedImage } from '../formats/gif';

export type LinuxArch = 'x86_64' | 'aarch64';
export const LINUX_ARCHES: LinuxArch[] = ['x86_64', 'aarch64'];
export const LINUX_PLAYER_PATHS: Record<LinuxArch, string> = { x86_64: 'linux/GameMakerPlayer-x86_64', aarch64: 'linux/GameMakerPlayer-aarch64' };

export interface LinuxAppOptions {
  title: string;
  /** Lower-case letters, digits and dashes: names its folders (~/.local/share/GameMaker/<id>). */
  id: string;
  /** The one-web-page export of the game (exportSinglePage / fillPage). */
  html: string;
  /** The player programs (web/public/linux/GameMakerPlayer-*). */
  players: Record<LinuxArch, Uint8Array>;
  author?: string;
  year?: number;
  picture?: IndexedImage;
  colors?: IconColors;
}

/** The game's folder name: the title, without "/" or control characters, not hidden. */
export function folderName(title: string): string {
  return (
    title
      .replace(/[/\\\u0000-\u001f]+/g, '-')
      .replace(/^[.\s]+|\s+$/g, '')
      .slice(0, 64)
      .trim() || 'Game'
  );
}

export function linuxId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'game';
}

/** A shell word: the text in single quotes. */
export const shQuote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/** A .desktop file's string value (one line; backslashes escaped). */
const desktopValue = (s: string) => s.replace(/\\/g, '\\\\').replace(/[\r\n]+/g, ' ');

function byLine(o: Pick<LinuxAppOptions, 'author' | 'year'>): string {
  return [o.author, o.year].filter(Boolean).join(', ');
}

export function playScript(o: Pick<LinuxAppOptions, 'title' | 'id'>): string {
  return `#!/bin/sh
# Plays ${o.title.replace(/[\r\n]+/g, ' ')} in a window of its own (Game-Maker: Sandbox Edition).
# Needs WebKitGTK; without it, the game opens in your web browser instead.
here=$(cd "$(dirname "$0")" && pwd)
title=${shQuote(o.title)}
id=${shQuote(linuxId(o.id))}
case $(uname -m) in
  x86_64 | amd64) player="$here/GameMakerPlayer-x86_64" ;;
  aarch64 | arm64) player="$here/GameMakerPlayer-aarch64" ;;
  *) player= ;;
esac
if [ -n "$player" ]; then
  "$player" --title "$title" --id "$id" --icon "$here/icon.png" "$here/game.html"
  status=$?
  # 3: no WebKitGTK; 126 and 127: the player could not be run here
  case $status in 3 | 126 | 127) ;; *) exit $status ;; esac
fi
notice="$title needs WebKitGTK to play in a window of its own, so it opens in your web browser instead. README.txt says what to install."
echo "$notice" >&2
if command -v notify-send >/dev/null 2>&1; then notify-send "$title" "$notice" || true; fi
exec xdg-open "$here/game.html"
`;
}

export function installScript(o: Pick<LinuxAppOptions, 'title' | 'id'>): string {
  const id = linuxId(o.id);
  return `#!/bin/sh
# Installs ${o.title.replace(/[\r\n]+/g, ' ')}: copies it to ~/.local/share/GameMaker/${id}/app and adds it
# to your applications menu. Nothing outside your home folder is changed.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
title=${shQuote(o.title)}
id=${shQuote(id)}
share="\${XDG_DATA_HOME:-$HOME/.local/share}"
app="$share/GameMaker/$id/app"
mkdir -p "$app" "$share/applications"
if [ "$here" != "$app" ]; then
  cp -f "$here/play.sh" "$here/install.sh" "$here/uninstall.sh" "$here/game.html" "$here/icon.png" "$here/README.txt" "$here"/GameMakerPlayer-* "$app/"
fi
chmod 755 "$app/play.sh" "$app/install.sh" "$app/uninstall.sh" "$app"/GameMakerPlayer-*
# Exec: the path in double quotes, with the characters the desktop entry format reserves escaped
exec_path=$(printf '%s' "$app/play.sh" | sed 's/["\`$]/\\\\\\\\&/g')
cat > "$share/applications/gamemaker-$id.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=${desktopValue(o.title).replace(/[$`\\]/g, '\\$&')}
Comment=A game made with Game-Maker: Sandbox Edition
Exec="$exec_path"
Icon=$app/icon.png
Terminal=false
Categories=Game;
StartupWMClass=gamemaker-$id
EOF
if command -v update-desktop-database >/dev/null 2>&1; then update-desktop-database "$share/applications" >/dev/null 2>&1 || true; fi
echo "Installed $title. It is in your applications menu (Games); to remove it, run $app/uninstall.sh"
`;
}

export function uninstallScript(o: Pick<LinuxAppOptions, 'title' | 'id'>): string {
  const id = linuxId(o.id);
  return `#!/bin/sh
# Removes ${o.title.replace(/[\r\n]+/g, ' ')} from the applications menu and ~/.local/share/GameMaker/${id}/app.
# Its saved games and high scores stay unless you add --all.
set -eu
title=${shQuote(o.title)}
id=${shQuote(id)}
share="\${XDG_DATA_HOME:-$HOME/.local/share}"
rm -f "$share/applications/gamemaker-$id.desktop"
rm -rf "$share/GameMaker/$id/app"
if [ "\${1:-}" = --all ]; then
  rm -rf "$share/GameMaker/$id" "\${XDG_CACHE_HOME:-$HOME/.cache}/GameMaker/$id"
  echo "Removed $title, with its saved games and high scores."
else
  echo "Removed $title. Its saved games and high scores are still in $share/GameMaker/$id (run with --all to remove them too)."
fi
`;
}

export function readme(o: Pick<LinuxAppOptions, 'title' | 'id' | 'author' | 'year'>): string {
  const by = byLine(o);
  return `${o.title}${by ? ` (${by})` : ''}
Made with Game-Maker: Sandbox Edition, a web port of Recreational Software Designs'
Game-Maker 3.0 (1994): ${SITE_URL}

TO PLAY
  Double-click play.sh (choose "Run" if asked), or in a terminal: ./play.sh
  Some file managers first need play.sh's Properties -> "Allow executing file as program".
  F11 switches to full screen; Ctrl+R restarts the game.

TO ADD IT TO YOUR APPLICATIONS MENU
  ./install.sh      copies it to ~/.local/share/GameMaker/${linuxId(o.id)}/app
  ./uninstall.sh    takes it out again (add --all to remove saved games too)

IT NEEDS WebKitGTK (most desktops already have it):
  Debian, Ubuntu, Mint:  sudo apt install libwebkit2gtk-4.1-0
  Fedora:                sudo dnf install webkit2gtk4.1
  Arch:                  sudo pacman -S webkit2gtk-4.1
Without it, play.sh opens the game in your web browser instead.

Saved games and high scores are kept in ~/.local/share/GameMaker/${linuxId(o.id)}.
The game loads nothing from the internet. More: ${SITE_URL}#/linux
`;
}

/** icon.png: the Mac icon's picture at 256 pixels, cropped as the Windows one is. */
export async function linuxIcon(picture: IndexedImage | undefined, colors?: IconColors): Promise<Uint8Array> {
  return encodeRgbaPng(shrink(drawIcon(picture, colors), 1024, 56, 56, 912, 256), 256, 256);
}

/** Every file of the game's folder. */
export async function linuxAppFiles(o: LinuxAppOptions): Promise<{ name: string; files: TarEntry[] }> {
  const enc = new TextEncoder();
  const name = folderName(o.title);
  const text = (path: string, s: string, mode = 0o644): TarEntry => ({ path: `${name}/${path}`, data: enc.encode(s), mode });
  return {
    name,
    files: [
      { path: `${name}/`, mode: 0o755 },
      text('play.sh', playScript(o), 0o755),
      text('install.sh', installScript(o), 0o755),
      text('uninstall.sh', uninstallScript(o), 0o755),
      text('README.txt', readme(o)),
      text('game.html', o.html),
      { path: `${name}/icon.png`, data: await linuxIcon(o.picture, o.colors), mode: 0o644 },
      ...LINUX_ARCHES.map((a) => ({ path: `${name}/GameMakerPlayer-${a}`, data: o.players[a], mode: 0o755 })),
    ],
  };
}

/** The game's folder as a .tar.gz. */
export async function linuxTarGz(o: LinuxAppOptions, date?: Date): Promise<Uint8Array> {
  return createTarGz((await linuxAppFiles(o)).files, date);
}

/** The player programs, from where the web app is served. */
export async function fetchLinuxPlayers(appBase = new URL('./', location.href).href): Promise<Record<LinuxArch, Uint8Array>> {
  const get = async (a: LinuxArch) => {
    const res = await fetch(new URL(LINUX_PLAYER_PATHS[a], appBase)).catch(() => undefined);
    if (!res?.ok) throw new Error('Could not load the Linux player. Reload Game-Maker: Sandbox Edition while online and try again.');
    return new Uint8Array(await res.arrayBuffer());
  };
  const [x86_64, aarch64] = await Promise.all(LINUX_ARCHES.map(get));
  return { x86_64, aarch64 };
}
