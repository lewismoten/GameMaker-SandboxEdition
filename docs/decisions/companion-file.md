# Editor-only data goes in the companion file

**What:** Anything the web editor adds that DOS Game-Maker never had (terrains, stamps,
buildings, release notes, the author's game version, the About text) lives in a small versioned
JSON object, the companion, beside the project's files and never among them. In IndexedDB it is
the project record's `companion` field. DOS, native and web-page exports never carry it. The
"Game files (.zip)" backup adds it as `<game>.GMX`, and importing such a zip takes it out again.

**Why:** Editor features must not change how a game saves or exports to DOS. A game made here
should still open in the original tools, and nothing is lost when a project goes round a backup.

**Where it is written down:** the header of `web/src/project/companion.ts` (the shape and the
rules); DOS fidelity in `AGENTS.md`.
