# `specials/`: limited-time games

Part of the [source map](../README.md).

A Special is a game built in code (`games/<id>`, about.json `"series": "special"`) that is out
in the Special tab during its calendar window, then hidden there unless this browser kept it.
A BBS arrival can remain available for its registry entry's extra `linger` days after that window.

- `calendar.ts`: windows (a day rule: a fixed date, the nth weekday of a month, Easter, a weekday
  on a date such as Friday the 13th, every such weekday, an ISO week, a month; moved by days,
  lasting days, optionally between two hours), all in local time. `calendar.test.ts`.
- `registry.ts`: every Special, its window, how it reaches the desk (a floppy on the desk, The
  Sandbox BBS, the watch, the window, the phone, or the Special tab only) and its theme.
- `state.ts`: localStorage `gm-specials`: the ones kept (played, opened, copied, picked up,
  downloaded, subscribed) and SPECIALS.EXE's LOCK and UNLOCK; `isListed`. LOCK hides even a kept
  game; UNLOCK lists it regardless of the date. Keeping a game records the first reason and time, not
  an offline copy of the game files. Storage errors are caught, with no in-memory fallback.
  Changes fire `gm-specials-changed` (`project/files.ts` forgets the catalog; `project/catalogWatch.ts` relists).
- `clock.ts`: the Specials' now: the real local time, a test date (SPECIALS DATE,
  `gm-specials-today`), or `?today=YYYY-MM-DD` on the dev server. A valid dev query takes precedence
  over the stored date; a date without a time means local noon. The stored override also applies in production.
- `arrivals.ts`: what waits to arrive each way, and taking it. Wired: the floppy beside the
  Game-Maker box (`desk/props/specialFloppy.ts`) and The Sandbox BBS's file list
  (`retro/bbs/sandbox.ts`). Hooks for the watch, the window and the phone's TURBO BUTTON Disk of
  the Month offer wait for their props.
- `specialsExe.ts`: SPECIALS.EXE at the PC's prompt (`retro/dos/shell.ts`): list, LOCK, UNLOCK,
  RESET (one or ALL) and DATE. Unlisted like EGG.EXE.

`project/special.ts` (`isSpecialGame`, `withSpecials`) keeps unlisted Specials out of the catalog;
the home page's Special tab (`editor/shell/homeCategories.ts`, `homeLibrary.ts`) shows the rest.
A Special is never a Sandbox game, shareware or a Sofa BBS file, and has no static page.
