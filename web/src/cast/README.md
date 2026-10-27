# `cast/`: the Cast page

Part of the [source map](../README.md).

The Cast page (`#/cast`, `castPage.ts`, its people and things in
`castData.ts`): the regulars of the new games on a stage (`castStage.ts`, one frame drawn by
`castStageScene.ts` with `castStageDraw.ts`, the goat's and the camel's business in
`castStageGags.ts`; once it scrolls away,
a small one in a corner, `castMini.ts`), walking with their own
sprites (`castSprite.ts`, from `web/public/cast/sprites.json`) to the Teddy games' theme
(`castSound.ts`), and the games each appears in (`castThumbs.ts`; `cameos.json` for new cameos,
`hidden.json` for the Easter eggs and tin hearts, written by `web/scripts/castHidden.ts`).
