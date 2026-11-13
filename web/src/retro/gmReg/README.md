# `retro/gmReg/`: Game-Maker's registration and copy check

Part of [`retro/`](../README.md) and the [source map](../../README.md). CHK.EXE (`code/GM/CHK.C`): what GM ran before its menu, the unregistered copy's copy protection, and the paper around it on the desk.

Entry points: `retro/computer.ts` loads `retro/gm.ts` for Game-Maker; `runGameMaker` there calls `chk.ts` on the main startup path, not when resuming MENU.EXE. `regDesk.ts` tells the desk what is being asked.

- `chk.ts`: CHK.EXE; `GM REGISTER` asks for the name and number.
- `copyCheck.ts`: CHK.C manualcheck(): asking for a word from the manual.
- `registration.ts`: registration as CHK.EXE checked it.
- `regDesk.ts`: what CHK.EXE is asking right now, for the desk around the PC.
- `regSide.ts`, `regSideLater.ts`, `regSide.css`: the Owner's Guide and registration card beside the monitor (the second fetches the first when needed).
- `regGuidePanel.ts`, `regCardPanel.ts`, `mailCard.ts`: the guide, the product card and the mail-in card.
- `replyMail.ts`: RSD's paper reply, delivered by the room once a card is mailed.
- `tourPretend.ts`: the PC pretends it is unregistered while the guided tour plays on the DOS page.

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: `replyMail.test.ts`.

Check: `cd web && npx vitest run src/retro/gmReg`.
