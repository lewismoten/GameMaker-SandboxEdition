# `eggs/`: the felt eggs

Part of the [source map](../README.md).

The felt eggs hidden in the Sandbox games (`eggs.ts`): which are found
(`eggState.ts`, from saved games), the shadow box on the desk (`eggDisplay.ts`), its viewer
(`eggViewer.ts`), and `EGG.EXE` (`eggExe.ts`).

- `eggUv.ts` is what black light brings out on them (the shelf's `desk/props/eggGlow.ts` and the
  viewer agree on it), laid out on `eggTexture.ts`'s covering size so the desk needn't load the
  egg art (`eggArt.ts`).
- `teddyEgg.ts` is Teddy's special egg, a bonus (never one of the felt eggs) that joins the
  shadow box once all three Teddy adventures' eggs are found; `eggPile.ts` draws it, a little
  pile of felt sausages with a whiff rising, not an egg shape.
- `bonus.ts` holds two more eggs kept apart from the felt eggs, loaded only once the felt eggs are
  all found (looked at in `bonusViewer.ts`): `bonusArt.ts` draws the rotten egg, its IOU note
  and the cake stand, `pastryEgg.ts` the pastry egg, both on `eggShell.ts`'s wrapped and lit
  shell; `diamondHeart.ts` is the heart the IOU promises, which the tin heart trophy shows too.
  `musicBox.ts` is a little synthesized music box.
