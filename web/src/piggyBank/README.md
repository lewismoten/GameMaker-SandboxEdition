# `piggyBank/`: leftover game money

Part of the [source map](../README.md).

`hook.ts` hears a catalog game's real session and stores its visible money counter only when it
wins. `money.ts` keeps the latest completed amount for each game beside the score trophies'
save data, so backups carry it. The Desk display reads this record.
