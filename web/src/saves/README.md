# `saves/`: Saves & scores

Part of the [source map](../README.md).

The home page's "Saves & scores" panel (`savesPanel.ts`, loaded by
`button.ts`): a game's saved games (with a map of the saved level, `saveMapView.ts`) and high
scores, with ⓘ notes (`tip.ts`). `savesPanel.ts` opens the dialog and keeps the panel's state
(`panelState.ts`); the parts draw from it: the list on the left (`panelNav.ts`), a slot
(`slotView.ts`, its values `slotField.ts`, where the hero is `slotWhere.ts`, About this save
`aboutSave.ts`, and what is done to a slot `slotActions.ts`), the high scores (`scoresView.ts`)
and the backups (`backupsView.ts`). `closeGuard.ts` asks before leaving unsaved changes;
`panelText.ts` holds the shared words and the yes-or-no question.

Slot fields and high-score edits stay in working copies until **Save changes**;
**Undo changes** discards that working copy. Importing a save, making a new save and
deleting a slot write immediately instead. Those writes and Save changes call the
panel's safety-backup step first; importing or deleting a slot requests a fresh backup.
The underlying file formats, storage writes and backups belong to
[`project/saveData/`](../project/saveData/README.md), not the views.

For a target with a home-page key, the address keeps the selected view:
`#/game/<key>?saves=3` opens slot 3, while `?saves=scores` and `?saves=backups`
open those views. Closing removes the `saves` parameter. Without an explicit initial
view, the panel chooses the first occupied slot, or high scores if no slot is occupied.
