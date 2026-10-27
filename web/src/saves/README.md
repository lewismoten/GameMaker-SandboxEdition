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
