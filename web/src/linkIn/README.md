# `linkIn/`: opening a game another site sends

Part of the [source map](../README.md).

Opening a game sent by another site ([`docs/embed.md`](../../../docs/embed.md)),
from start to finish in `start.ts`: `?open=<url>` fetches it (`fetchGame.ts`), `?receive` takes it
from the opener with postMessage (`receive.ts`); `protocol.ts` checks the addresses, messages and
limits, `unpack.ts` reads the files (zip, pack, exported page) without trusting them, `dialogs.ts`
asks the visitor first, `keep.ts` keeps it as a new Imported game, and `notice.ts` is the "not a
real DOS PC" note for the desk and `dos.html`.
