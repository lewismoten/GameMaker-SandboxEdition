# Opening games from your site

Game-Maker: Sandbox Edition can open a game that lives on another site. A visitor clicks a
link or a button on your page, and the game opens to play or to edit in one of three places:

| `in=` | Where it opens |
| --- | --- |
| `desk` | The 1994 desk: the game's disk goes in the PC's drive A:. |
| `dos` | DOS Game-Maker (`dos.html`): the PC on its own page. |
| `web` | Today's web interface: the full-window player, or the editors. |

| `mode=` | What happens |
| --- | --- |
| `play` (the default) | The game plays: on the desk and the DOS page with PLAYGAME, on the web in the player. |
| `edit` | A copy opens to change: in Game-Maker's designers on the desk and the DOS page, in today's editors on the web. |

Leave out `in` and the game opens wherever the visitor last worked (the desk or today's web).

There are two ways in. Both end the same way: Game-Maker shows the visitor what the game is
and where it came from, and opens nothing until they say yes.

- **A link** with the game's address, when your server lets other sites read the files.
- **window.open plus postMessage**, when it doesn't, or when the files are on the visitor's
  computer or made by your page.

The examples use the public site, `https://lewismoten.github.io/GameMaker-SandboxEdition/`.
Any copy of the site works the same way.

## 1. A link

```text
https://lewismoten.github.io/GameMaker-SandboxEdition/?open=<address of the game>&in=<desk|dos|web>&mode=<play|edit>
```

The same request can also go in the hash, which some hosts keep when they redirect:

```text
https://lewismoten.github.io/GameMaker-SandboxEdition/#/open?url=<address of the game>&in=dos&mode=edit
```

Encode the game's address with `encodeURIComponent`. Examples:

```text
…/?open=https%3A%2F%2Fgames.example%2Fsnowday.zip&in=web&mode=play
…/?open=https%3A%2F%2Fgames.example%2Fsnowday%2FSNOWDAY.GAM&in=desk
…/?open=https%3A%2F%2Fgames.example%2Fsnowday.html&in=dos&mode=edit
```

Only `http:` and `https:` addresses are fetched. A relative address is read from the
Game-Maker site itself.

### What the address can point at

- **A .zip of the game's folder.** Folders inside it are fine. DOS programs (`.EXE`, `.COM`,
  `.BAT` and the like) are left out.
- **A .gam file**, with the game's other files in the same folder on your server. Game-Maker
  reads the .gam and fetches each file it names, plus the files those name in turn (a slide
  list's pictures, a sound set's samples, the high score file). Names are tried as the game
  writes them, then in upper case. A file that isn't there is skipped, as DOS would.
- **A game pack** (`.gmpak`, gzipped or not): the format the site uses for its own games.
- **A web page made by "Export as one web page".** It carries the whole game inside it.

The first .gam found is played, unless the export or message names one.

### CORS: what your server must send

The game is fetched by the visitor's browser from the Game-Maker page, so your server has to
allow another site to read it. Every file must be served with this header:

```text
Access-Control-Allow-Origin: *
```

You can also name the Game-Maker site instead of `*`:
`Access-Control-Allow-Origin: https://lewismoten.github.io`. GitHub Pages already sends
`Access-Control-Allow-Origin: *`, so a game in a GitHub Pages site links in as it is. The
request carries no cookies.

If the header is missing, the browser won't let Game-Maker read the file. The visitor then sees
"The game could not be fetched", with a pointer to this page. Use postMessage instead.

## 2. window.open and postMessage

No CORS is needed for this way. Your page opens Game-Maker in a new window and hands it the
files directly, from one window to the other inside the visitor's browser.

```text
your page                                      Game-Maker (…/?receive&in=…&mode=…)
---------                                      ---------------------------------
window.open(…?receive…)  ───────────────────▶  loads
                         ◀──────────────────── {type: 'gm-ready', version: 1, limits}
{type: 'gm-files', name, files, in, mode} ──▶  checks the files, asks the visitor
                         ◀──────────────────── {type: 'gm-received', name, files}
                                               or {type: 'gm-error', reason, message}
```

1. **Open** `…/?receive&in=<desk|dos|web>&mode=<play|edit>`. The hash form
   `…/#/receive?in=…&mode=…` works too. Add `&from=<your origin>` (for example
   `&from=https://games.example`). Game-Maker then sends `gm-ready` only to that origin, and
   listens only to it. Don't pass `noopener`: Game-Maker needs `window.opener` to answer you.
   Call `window.open` in the click handler itself, before any `await`, or a popup blocker may
   stop it.
2. **Wait for `gm-ready`.** Check that `event.source` is the window you opened and that
   `event.origin` is the Game-Maker site's origin.
3. **Send `gm-files`** to that origin (never `'*'`), with the files' ArrayBuffers listed as
   transferables so they move instead of being copied:

   ```js
   gm.postMessage(
     {
       type: 'gm-files',
       name: 'Snow Day', // optional: the name shown and kept (60 characters at most)
       files: { 'SNOWDAY.GAM': buf1, 'SNOWDAY.MAP': buf2 /* … */ }, // name → ArrayBuffer or typed array
       in: 'desk', // optional: overrides the address's in=
       mode: 'play', // optional: overrides the address's mode=
       gam: 'SNOWDAY.GAM', // optional: which .gam to play when there are several
     },
     'https://lewismoten.github.io',
     [buf1, buf2 /* … */],
   );
   ```

   `files` may also hold a single .zip, .gmpak or exported .html, which is opened like a link.
   Folders in file names (`SNOWDAY/SNOWDAY.MAP`) are dropped, as DOS names have none.
4. **Read the answer.** You get `gm-received` (`{type, name, files}`) once the visitor has said
   yes and the game is kept. Otherwise you get `gm-error` (`{type, reason, message}`). Its
   `reason` is one of:
   - `declined`: the visitor said no;
   - `invalid`: the message or a file is malformed or damaged;
   - `no-game`: no .gam came with the files;
   - `too-big`: over the limits;
   - `storage`: the browser wouldn't store it.

   Game-Maker waits 60 seconds for `gm-files` after `gm-ready`. It reads only the first
   `gm-files` message. Messages of other types are ignored.

**An iframe instead of a window.** If your page frames Game-Maker
(`<iframe src="…/?receive&in=web&from=…">`), the frame sends `gm-ready` to its parent, and the
rest is the same. Post to `iframe.contentWindow`. A new window is usually better: the desk and
the DOS page need room, and the visitor sees the site's own address.

### A complete small sender

[examples/send-game.html](examples/send-game.html) is a working sample. Pick a game's files,
choose where it opens, and press the button. To try it, serve that folder
(`python3 -m http.server 8000` in `docs/examples`) and open
`http://localhost:8000/send-game.html`. Add `?site=<address>` to send to another copy of
Game-Maker. The heart of it:

```html
<input id="files" type="file" multiple />
<button id="send">Open in Game-Maker</button>
<script>
  const GM = 'https://lewismoten.github.io/GameMaker-SandboxEdition/';
  const GM_ORIGIN = new URL(GM).origin;

  document.getElementById('send').addEventListener('click', () => {
    const picked = [...document.getElementById('files').files];
    const url = `${GM}?receive&in=web&mode=play&from=${encodeURIComponent(location.origin)}`;
    const gm = window.open(url, 'gamemaker'); // in the click itself; no "noopener"
    const payload = Promise.all(picked.map(async (f) => [f.name, await f.arrayBuffer()]));
    let sent = false;
    addEventListener('message', async function onMessage(event) {
      if (event.source !== gm || event.origin !== GM_ORIGIN) return;
      if (event.data?.type === 'gm-ready' && !sent) {
        sent = true;
        const entries = await payload;
        gm.postMessage({ type: 'gm-files', files: Object.fromEntries(entries) }, GM_ORIGIN, entries.map(([, b]) => b));
      } else if (event.data?.type === 'gm-received' || event.data?.type === 'gm-error') {
        removeEventListener('message', onMessage);
        console.log(event.data);
      }
    });
  });
</script>
```

## Limits

| What | Limit |
| --- | --- |
| Files in one game | 1,024 |
| One file | 16 MB |
| The whole game, unpacked | 48 MB |
| Waiting for `gm-files` | 60 seconds |
| A game's name | 60 characters |

A .zip or pack is checked against these limits as it is unpacked. A zip that unpacks to more
than its directory says is refused.

## Safety and privacy

- **The visitor decides.** Nothing opens until they press "Open to play" or "Open to edit" in a
  dialog that names where the game came from (your site's host), the game, and how many files
  and bytes it has.
- **Nothing is uploaded.** The files go from your page, or your server, into the visitor's
  browser, and stay there. The game is kept in that browser's storage, like a game the visitor
  imported themselves. It is listed under Imported, named for where it came from, for example
  "Snow Day (from games.example)". Saved games and high scores need it kept.
- **Nothing is overwritten.** Each game is kept as a new game of its own. Playing the very same
  game from the same site again reuses its copy, unless the visitor has changed it since.
- **Edit makes a copy.** Edit mode opens the visitor's own copy. Your files are never changed,
  and nothing is sent back to you but the `gm-received` or `gm-error` answer.
- **Nothing is run.** Game-Maker reads the files as game data only: maps, pictures, sounds and
  the .gam's scene list. DOS programs are left out. Damaged files are turned away with a plain
  message.
- **Only your window.** In the postMessage way, Game-Maker listens only to the window that
  opened it (or the page that frames it), and only to the origin in `from=` when you give one.
  It answers only that origin.
- **Shareware stays as released.** A game that matches one of the CD's shareware games plays
  from the site's own copy, with its author's notice. It is never kept or opened to edit.

## The "not a real DOS PC" note

When a game sent this way opens on the desk or in DOS Game-Maker, the visitor sees this note
once per browser session:

> **This is not a real DOS PC.** Game-Maker and its PLAYGAME player are re-implemented here
> in the browser, from their released C source; no DOS or x86 code runs. A game that relies on
> how real DOS or a real PC behaves may act differently here. To run the original programs,
> use DOSBox.

If your page describes the game as a DOS game, say the same. Game-Maker's file formats are
kept byte for byte, so a game that plays here also plays in DOS Game-Maker under
[DOSBox](https://www.dosbox.com/). The reverse holds unless the game leans on something only
real DOS does.
