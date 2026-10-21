GameMaker
=========

This is the source code and executables for Recreational Software Design's GameMaker product, released in 1994.

**This repository is a modified fork, named Game-Maker: Sandbox Edition.** Andy Stone released Game-Maker's source under the
MIT License in 2014; this fork by Lewis Moten adds a browser version (written with Claude
Opus 5.5) that reads and writes the original file formats, a recreated "1994 desk", and
new Sandbox Software games. See [NOTICE.md](NOTICE.md) for the credits, the history and
third-party trademarks, and [LICENSE](LICENSE) for the license.

You can learn more about this product here:

[http://en.wikipedia.org/wiki/Game-Maker]

[http://www.aderack.com/game-maker]


Web Version
===========

The [`web`](web) folder holds a browser version of Game-Maker written in TypeScript
(Vite, HTML canvas, Web Audio). It edits and saves games in the original file formats,
opens original game folders, plays the CD's games (the shareware ones play-only, with
their authors' notices), and exports your games as installable offline web apps or as
DOS folders that run in DOSBox.

Where things are:

- [`web/`](web) — the browser app (see [web/src/README.md](web/src/README.md) for a map of
  the source: the 1994 desk, today's editor, the file formats, the engine and player).
- [`games/`](games) — the Sandbox Software games, each built in code into real Game-Maker
  files (see [games/README.md](games/README.md)).
- `cd/`, `code/`, `runtime/`, `tools/` — the original 2014 release: the CD image, the DOS
  source, an installed copy and the Borland compiler (described below).

It is published at https://lewismoten.github.io/GameMaker-SandboxEdition/ by the GitHub Actions
workflow in `.github/workflows/pages.yml`. See [web/README.md](web/README.md) for
details.

Using This Repository
=====================

After cloning this repository on your machine, you will see the following directories:

cd:  The GameMaker cd image first released in 1994.  This can be used to install GameMaker and contains all the sample games
code: The GameMaker source code (and other stuff)
runtime: This is an image of a typical "c:" disk with GameMaker installed.  This makes it easy to run GameMaker inside a dosbox.
tools: Compilers

First step: install dosbox.  [http://www.dosbox.com/]

Next "cd" to the root directory of this repository.

Now run dosbox.

Inside your dosbox, run:

mount c runtime

Now you can run GameMaker with:

    c:
    cd c:\gm
    gm

To start working with the source code, run:

    c:
    dev.bat

This will mount the compiler into the "t:" directory, and the source code into "d:".

Now to compile everything:

    d:
    cd gm
    del *.obj
    del *.exe
    creatall

To create a single program:

    create palchos
    create blocedit

(etc)

In today's world, I've been editing the code outside of dosbox in linux/emacs and then (in the dosbox window) hit ctrl-f4 to sync the disk inside dosbox with the external changes. YMMV.

