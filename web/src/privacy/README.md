# privacy/

The Privacy page (`#/privacy`, Settings, then Privacy): what the site keeps on the device, how to
clear it, what is sent and when, and that there is no tracking.

- `privacyPage.ts`: the page.
- `privacyData.ts`: the plain-words descriptions, typed against `backup/inventory.ts`
  (`SectionId`, the IndexedDB stores), so a new kind of stored data does not typecheck until it is described.
- `privacy.test.ts`: fails when an inventory section or database has no description.
  `backup/inventory.test.ts` is what fails first on a new `gm-*` key or database.
- `privacy.css`: its layout.
