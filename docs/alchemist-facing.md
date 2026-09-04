# Alchemist facing correction

The shared `public/assets/dungeon/alchemist.png` portrait now faces right in camp choices, purchase cards and the board. The original purple costume and green potion remain recognizable. The skill icon is unchanged.

The built-in image generation tool edited the existing portrait. The first mirrored output painted a checkerboard instead of transparency and was rejected. A second background-extraction edit produced the selected transparent cutout. The source asset was replaced at the user's request; no CSS flip is applied on top.

## Mirror prompt

Edit the provided alchemist character asset by horizontally mirroring the entire image left-to-right, so the character faces RIGHT and holds the green potion on the RIGHT side of the image. Preserve the exact same character design, purple hood, gold trim, green potion, pose, proportions, lighting, details, centered square framing and transparent alpha background. This is only a horizontal mirror of the existing artwork; do not redesign or add anything. No text, no frame, no background.

## Transparent cutout correction

Background extraction only. Remove the entire white and light-gray checkerboard background from this RIGHT-facing alchemist sprite. The output must have actual transparent alpha pixels outside the character, not a drawn checkerboard and not a solid color. Keep exactly the right-facing character, potion on the right, costume, colors, proportions, edges and square framing unchanged. No redesign, no text, no shadows on background. Transparent RGBA PNG cutout.
