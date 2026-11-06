# Match DOS behavior, bugs included

**What:** The web engine does what PLAYGAME did, quirks and all. A fix that would change what
the original did is recorded as a note, not shipped. Before changing engine behavior, check the
C source in `code/GM`.

**Why:** The engine is a port of `PLAYGAME.C`, and the project's aim is to show and play the
original data exactly as DOS Game-Maker did. It appears that a "corrected" rule would also
change how existing levels play and how a game exported to DOS compares with the web player.

**Where it is written down:** DOS fidelity in `AGENTS.md`; `code/` (kept untouched as the
reference; see "The original repository's files" in `AGENTS.md`).
