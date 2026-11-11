# `linkIn/`: opening a game another site sends

Part of the [source map](../README.md).

Opening a game sent by another site ([`docs/embed.md`](../../../docs/embed.md)),
from start to finish in `start.ts`: `?open=<url>` asks permission to contact the external host, then fetches it (`fetchGame.ts`), `?receive` takes it
from the opener with postMessage (`receive.ts`); `protocol.ts` checks the addresses, messages and
limits, `unpack.ts` reads the files (zip, pack, exported page) without trusting them, `dialogs.ts`
asks for download consent and then confirms the inspected game, `keep.ts` keeps it as a new Imported game, and `notice.ts` is the "not a
real DOS PC" note for the desk and `dos.html`.

Cancel passes an abort signal through every linked fetch and closes its response reader. Exported HTML games use the same bounded decoder as local HTML imports.
