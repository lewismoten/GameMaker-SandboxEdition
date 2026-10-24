# The web player: old game folders on your own site

The web player is one `.html` file that plays Game-Maker games in the browser. Put it on any
web host, next to folders of Game-Maker games as they were on a DOS disk, and it plays them.
It needs nothing else: the engine, music and styles are inside the file. The only other file it
reads is an optional `games.json` that lists the folders.

Try it with this project's games at
<https://lewismoten.github.io/GameMaker-SandboxEdition/player/>, and download it from
<https://lewismoten.github.io/GameMaker-SandboxEdition/web-player.html> (or with "Download this
player" at the bottom of any copy of it).

## Setting it up

```
my-site/
  player.html        the web player (any name works)
  games.json         optional: the list of games
  nebula/            a game's folder, as it was on disk
    NEBULA.GAM
    NEBULA.MAP
    ...
  castle/
    CASTLE.GAM
    ...
```

1. Copy each game's folder to the host as it is: its `.GAM` file and every file it uses (maps,
   blocks, characters, monsters, palettes, sounds, music, pictures, text screens). Upper,
   lower or mixed case all work.
2. Put the web player beside the folders.
3. Add `games.json` beside it to show a list of games to choose from.

The player must be served by a web server: opened straight from a disk (`file://`), the
browser does not let it read the folders. A local server such as `python3 -m http.server`
works for trying it out.

## games.json

```json
{
  "title": "My old games",
  "games": [
    { "title": "Nebula Patrol", "folder": "nebula/", "gam": "NEBULA.GAM" },
    { "title": "Castle Quest", "folder": "castle/" }
  ]
}
```

A plain array of games (without `"title"`) works too. For each game:

| Field      | Needed | What it is                                                                                                                      |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `"folder"` | yes    | The game's folder, relative to `games.json` (or a full `https://` address).                                                     |
| `"gam"`    | no     | The game file in the folder. Without it, the player tries the folder's name (`castle/` → `castle.gam`, then `CASTLE.GAM`).      |
| `"title"`  | no     | The name shown in the list. The folder's name otherwise.                                                                        |
| `"id"`     | no     | What `?game=` calls it, and what its saves are kept under. The folder's name otherwise (lower case, letters, digits, `-`, `_`). |
| `"files"`  | no     | Extra file names to fetch from the folder, beyond the ones the `.GAM` names.                                                    |
| `"author"` | no     | Shown under the title.                                                                                                          |
| `"year"`   | no     | Shown under the title.                                                                                                          |
| `"about"`  | no     | A line about the game, shown under the title.                                                                                   |

A web host cannot list a folder, so the player works out which files a game needs from the
`.GAM`: every level's files and its high-score file, then the files those name (a sound set's
sounds, a slide show's pictures, a backdrop's picture). It also fetches `README.TXT`,
`LICENSE.TXT` and the usual order-form names, and shows a shareware author's notice from them.
A file nothing names, such as an extra picture a text screen does not list, needs `"files"`.

## Addresses

- `player.html` shows the list (or, with no `games.json`, how to set one up and a box to type
  a folder's name).
- `player.html?game=nebula` starts that game: a listed game's id or folder, or a folder beside
  the page (`?game=castle`, or `?game=old/CASTLE.GAM` for a game file with another name).
- `player.html?list=more.json` reads another list. Lists and folders typed into `?game=` must
  be on the same site as the player.

## Saves and high scores

Everything a game writes (its high scores, saved games and their names) is kept in the
browser's IndexedDB for that site, per game id, and is there the next time the game is
played. The list page shows each game's saves and can:

- **Export all (.zip)** or **Export** one game: a zip with a folder per game id holding the
  files as DOS wrote them (`nebula/NEBULA.HIS`, `nebula/GAME0.SAV`). A game's folder can
  also be copied into the DOS game's folder.
- **Import (.zip)**: puts the files of such a zip back, each replacing the file of the same
  name.
- **Delete** a game's saves.

When a browser does not allow storage (some private windows), saves last until the page
closes; the page says so.

## What it is

It is the web player of [Game-Maker: Sandbox Edition](../README.md), a fork of RSD
Game-Maker 3.0 (Game-Maker 3.0 by Recreational Software Designs, 1991–1995), under the MIT
License. It is not a real DOS PC: PLAYGAME is re-implemented in the browser from its released
C source, and no DOS or x86 code runs, so a game that relies on how real DOS or a real PC
behaves may act differently. To run the original programs, use DOSBox. The games belong to
their makers; the player only plays the files beside it.

To open a game on this site instead (with the editor, the desk and DOS Game-Maker), see
[Opening games from your site](embed.md).
