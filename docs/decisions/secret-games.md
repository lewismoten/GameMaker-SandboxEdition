# Secret games stay out of everything a player sees

**What:** A game whose `about.json` has `"secret": true` is never named, counted, linked or
hinted at in anything a player sees: the site, the desk, other games, manuals, download lists,
tours and screenshots. Code, commit messages and history may name it, so a developer reading the
repository can find it. The one exception is `downloads.html`, which lists secret games. The
catalog reveals one only after the player finds the eggs, and hides it again if they are lost.

**How the build keeps it out:**

- The build leaves secret games out of `games/index.json`, the catalog, pages, the sitemap and
  pictures, and writes them to `games/extra.json`, fetched only once every egg is found
  (`0d25eb488`, `e7c69703b`).
- The desk's cover for one is found by a hash of its id, so code and chunk names do not name it
  (`c6ed6d9f7`).
- The service worker lists groups by a short hash of their name, so `sw.js` names no game folder
  (`fc425f7ed`).
- The shelf, the home page and the PC's drives follow a secret game appearing or disappearing
  without a reload (`8c27ca667`, `fec97f5df`, `545d06fdd`).

**Why:** The games are a reward for finding the eggs. Naming one, counting it or leaving it in
a list would give the reward away, which appears to be the purpose; the commits describe the
mechanism, not the motive. Test browsers start with no eggs found so a secret game's box never
shows (`AGENTS.md`).

**Where it is written down:** "Secret games" under Content rules in `AGENTS.md`;
`web/src/project/secretGames.ts`; `npm run release:draft` leaves secret-game commits out of
release notes (`docs/package-releases.md`).
