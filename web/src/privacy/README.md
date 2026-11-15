# privacy/

The Privacy page (`#/privacy`, Settings, then Privacy): what the site keeps on the device, how to
clear it, what is sent and when, and that there is no tracking.

- `privacyPage.ts`: the page.
- `privacyData.ts`: the plain-words descriptions. `KEPT` is a `Record<SectionId, string>`
  typed against [`backup/inventory.ts`](../backup/inventory.ts), so a new section needs a
  description to typecheck. Database names are checked separately by the test, not by that type.
- `privacy.test.ts`: fails when an inventory section or database has no description.
  `backup/inventory.test.ts` is what fails first on a new `gm-*` key or database.
- `privacy.css`: its layout.

These checks keep the descriptions in step with the inventory; they do not inspect network
traffic or prove the page's privacy statements. Check the relevant sending and storage code
when those statements change.
