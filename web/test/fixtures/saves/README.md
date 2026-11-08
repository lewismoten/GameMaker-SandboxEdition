# Old saves fixtures

One dated folder per release: `<YYYY-MM-DD>-master-<shortsha>/`, written by that release's own code
so `test/oldSaves.test.ts` can prove every newer version still opens it with nothing lost.

Each folder holds (all small):

- `MINE.GMC.json`: a companion (`serializeCompanion`) with notes, a to-do list, release notes and palette reservations.
- `game-maker.gmbackup`: a backup of every section (`makeBackup`) holding a game with its companion and two checkpoints, a DOS save, slot names, a high-score table, achievements and settings. IndexedDB can't run headless, so the browser project store is covered by this serialized form.
- `GAME0.SAV`, `SAVNAMES.DAT`, `BLASTER.HIS`: the DOS save game, slot names and high scores as the engine writes them.
- `settings.json`: the localStorage settings keys (plain strings).

Made by checking the release out in a separate worktree and running a small vite-node script there
(`npx vite-node make-saves-fixture.ts <outDir>` from its `web/`, after `npm run build:packages`) that builds the data with the
release's own functions and writes these files. The script is not kept: to add a release, write the same data with that release's code.

Rule: when a stored format changes (companion, checkpoint record, backup manifest or section, save game, settings key),
add a migration and a new dated fixture folder in the same commit, and extend `oldSaves.test.ts` for what is new.
Never edit or delete an existing fixture: it is what an old release really wrote.
