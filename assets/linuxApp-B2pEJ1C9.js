import{e as f,d as g}from"./macIcon-CuImaGex.js";import{s as y}from"./winIcon-B6hrZ8Nl.js";import{t as w}from"./notices-CNF-s2WU.js";import{S as m}from"./main-BB4EUk5_.js";import"./zip-CAcGIfdl.js";import"./shared-desk-web-play-dos-DOS3LiN4.js";import"./watch-Ci1HG5Rl.js";import"./modulepreload-polyfill-B5Qt9EMX.js";import"./tourButton-DXjuNPQS.js";const p=new TextEncoder;function s(e,t,a,n){const r=typeof n=="string"?p.encode(n):n;if(r.length>a)throw new Error(`Tar field too long: ${typeof n=="string"?n:r.length}`);e.set(r,t)}const l=(e,t)=>e.toString(8).padStart(t-1,"0");function k(e){if(p.encode(e).length<=100)return[e,""];for(let t=e.lastIndexOf("/",e.length-2);t>0;t=e.lastIndexOf("/",t-1)){const[a,n]=[e.slice(0,t),e.slice(t+1)];if(p.encode(n).length<=100&&p.encode(a).length<=155)return[n,a]}throw new Error(`Path too long for a tar archive: ${e}`)}function x(e,t){const a=new Uint8Array(512),n=e.path.endsWith("/"),[r,o]=k(e.path);s(a,0,100,r),s(a,100,8,l(e.mode??(n?493:420),8)),s(a,108,8,l(0,8)),s(a,116,8,l(0,8)),s(a,124,12,l(n?0:e.data?.length??0,12)),s(a,136,12,l(t,12)),a.fill(32,148,156),a[156]=n?53:48,s(a,257,6,"ustar\0"),s(a,263,2,"00"),s(a,265,32,"gamemaker"),s(a,297,32,"gamemaker"),s(a,345,155,o);const i=a.reduce((d,$)=>d+$,0);return s(a,148,8,`${l(i,7)}\0`),a}function b(e,t=new Date){const a=Math.floor(t.getTime()/1e3),n=[];for(const i of e)n.push(x(i,a)),i.data&&!i.path.endsWith("/")&&(n.push(i.data),i.data.length%512&&n.push(new Uint8Array(512-i.data.length%512)));n.push(new Uint8Array(1024));const r=new Uint8Array(n.reduce((i,d)=>i+d.length,0));let o=0;for(const i of n)r.set(i,o),o+=i.length;return r}async function M(e,t){return new Uint8Array(await new Response(new Blob([e]).stream().pipeThrough(t)).arrayBuffer())}async function E(e,t){return M(b(e,t),new CompressionStream("gzip"))}const u=["x86_64","aarch64"],G={x86_64:"linux/GameMakerPlayer-x86_64",aarch64:"linux/GameMakerPlayer-aarch64"};function T(e){return e.replace(/[/\\\u0000-\u001f]+/g,"-").replace(/^[.\s]+|\s+$/g,"").slice(0,64).trim()||"Game"}function h(e){return e.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,64)||"game"}const c=e=>`'${e.replace(/'/g,"'\\''")}'`,A=e=>e.replace(/\\/g,"\\\\").replace(/[\r\n]+/g," ");function S(e){return[e.author,e.year].filter(Boolean).join(", ")}function I(e){return`#!/bin/sh
# Plays ${e.title.replace(/[\r\n]+/g," ")} in a window of its own (Game-Maker: Sandbox Edition).
# Needs WebKitGTK; without it, the game opens in your web browser instead.
here=$(cd "$(dirname "$0")" && pwd)
title=${c(e.title)}
id=${c(h(e.id))}
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
`}function P(e){const t=h(e.id);return`#!/bin/sh
# Installs ${e.title.replace(/[\r\n]+/g," ")}: copies it to ~/.local/share/GameMaker/${t}/app and adds it
# to your applications menu. Nothing outside your home folder is changed.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
title=${c(e.title)}
id=${c(t)}
share="\${XDG_DATA_HOME:-$HOME/.local/share}"
app="$share/GameMaker/$id/app"
mkdir -p "$app" "$share/applications"
if [ "$here" != "$app" ]; then
  cp -f "$here/play.sh" "$here/install.sh" "$here/uninstall.sh" "$here/game.html" "$here/icon.png" "$here/README.txt" "$here/THIRD-PARTY-NOTICES.txt" "$here"/GameMakerPlayer-* "$app/"
fi
chmod 755 "$app/play.sh" "$app/install.sh" "$app/uninstall.sh" "$app"/GameMakerPlayer-*
# Exec: the path in double quotes, with the characters the desktop entry format reserves escaped
exec_path=$(printf '%s' "$app/play.sh" | sed 's/["\`$]/\\\\\\\\&/g')
cat > "$share/applications/gamemaker-$id.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=${A(e.title).replace(/[$`\\]/g,"\\$&")}
Comment=A game made with Game-Maker: Sandbox Edition
Exec="$exec_path"
Icon=$app/icon.png
Terminal=false
Categories=Game;
StartupWMClass=gamemaker-$id
EOF
if command -v update-desktop-database >/dev/null 2>&1; then update-desktop-database "$share/applications" >/dev/null 2>&1 || true; fi
echo "Installed $title. It is in your applications menu (Games); to remove it, run $app/uninstall.sh"
`}function R(e){const t=h(e.id);return`#!/bin/sh
# Removes ${e.title.replace(/[\r\n]+/g," ")} from the applications menu and ~/.local/share/GameMaker/${t}/app.
# Its saved games and high scores stay unless you add --all.
set -eu
title=${c(e.title)}
id=${c(t)}
share="\${XDG_DATA_HOME:-$HOME/.local/share}"
rm -f "$share/applications/gamemaker-$id.desktop"
rm -rf "$share/GameMaker/$id/app"
if [ "\${1:-}" = --all ]; then
  rm -rf "$share/GameMaker/$id" "\${XDG_CACHE_HOME:-$HOME/.cache}/GameMaker/$id"
  echo "Removed $title, with its saved games and high scores."
else
  echo "Removed $title. Its saved games and high scores are still in $share/GameMaker/$id (run with --all to remove them too)."
fi
`}function D(e){const t=S(e);return`${e.title}${t?` (${t})`:""}
${e.fiction?`${e.fiction}
`:""}Made with Game-Maker: Sandbox Edition, a web port of Recreational Software Designs'
Game-Maker 3.0 (1994): ${m}

TO PLAY
  Double-click play.sh (choose "Run" if asked), or in a terminal: ./play.sh
  Some file managers first need play.sh's Properties -> "Allow executing file as program".
  F11 switches to full screen; Ctrl+R restarts the game.

TO ADD IT TO YOUR APPLICATIONS MENU
  ./install.sh      copies it to ~/.local/share/GameMaker/${h(e.id)}/app
  ./uninstall.sh    takes it out again (add --all to remove saved games too)

IT NEEDS WebKitGTK (most desktops already have it):
  Debian, Ubuntu, Mint:  sudo apt install libwebkit2gtk-4.1-0
  Fedora:                sudo dnf install webkit2gtk4.1
  Arch:                  sudo pacman -S webkit2gtk-4.1
Without it, play.sh opens the game in your web browser instead.

Saved games and high scores are kept in ~/.local/share/GameMaker/${h(e.id)}.
The game loads nothing from the internet. It plays in WebKitGTK, so a future update
to it or to your system could break or change the game; the DOS download, in DOSBox,
is the most future-proof. More: ${m}#/linux
`}async function O(e,t){return f(y(g(e,t),1024,56,56,912,256),256,256)}async function _(e){const t=new TextEncoder,a=T(e.title),n=(r,o,i=420)=>({path:`${a}/${r}`,data:t.encode(o),mode:i});return{name:a,files:[{path:`${a}/`,mode:493},n("play.sh",I(e),493),n("install.sh",P(e),493),n("uninstall.sh",R(e),493),n("README.txt",D(e)),n("THIRD-PARTY-NOTICES.txt",w("linux",e.audio)),n("game.html",e.html),{path:`${a}/icon.png`,data:await O(e.picture,e.colors),mode:420},...u.map(r=>({path:`${a}/GameMakerPlayer-${r}`,data:e.players[r],mode:493}))]}}async function F(e,t){return E((await _(e)).files,t)}async function X(e=new URL("./",location.href).href){const t=async r=>{const o=await fetch(new URL(G[r],e)).catch(()=>{});if(!o?.ok)throw new Error("Could not load the Linux player. Reload Game-Maker: Sandbox Edition while online and try again.");return new Uint8Array(await o.arrayBuffer())},[a,n]=await Promise.all(u.map(t));return{x86_64:a,aarch64:n}}export{u as LINUX_ARCHES,X as fetchLinuxPlayers,T as folderName,_ as linuxAppFiles,h as linuxId,F as linuxTarGz,I as playScript,D as readme,c as shQuote};
