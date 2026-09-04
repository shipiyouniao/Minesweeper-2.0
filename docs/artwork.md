# Original artwork

- `docs/assets/readme-banner.png`: an original wide README cover created with the built-in image generation tool. The 2172 × 724 PNG is stored unchanged. It uses the game's ivory, charcoal, cobalt, and sage palette, with editorial typography and ceramic Minesweeper tiles. It is a decorative composition rather than a playable board. The image stays in `docs/` so it does not add to the deployed game's assets.
- `public/assets/quiet-board.png`: created with the built-in image generation tool for this refresh. It is a decorative ceramic Minesweeper still life; the board itself is rendered as accessible HTML buttons.
- `public/favicon.svg` and `src/icons.ts`: original SVG artwork written for the app. Classic and Twin boards use scalable flag, mine and control icons. Expedition uses the new generated dungeon sprites described below.
- The in-game illustration is decorative (`alt=""`) and never carries information needed to play. There are no external image or font requests in the game. The README cover has descriptive alternative text, and its title is repeated as a normal Markdown heading.

## Image generation prompt

Use case: stylized-concept. Asset type: original decorative illustration for a minimal Minesweeper web game. Create one square 1024x1024 image. A small beautifully composed cluster of nine gently rounded ivory ceramic square tiles arranged as a three-by-three Minesweeper grid in a slightly elevated isometric view. One central tile carries a tiny elegant cobalt-blue triangular paper flag on a thin dark pole. Two revealed tiles show a simple small cobalt numeral 1 and subdued teal numeral 2. One tiny charcoal spherical mine with short blunt radial studs sits separately beside the grid, friendly and geometric, not weapon-like. Refined editorial 3D still life, matte ceramic and paper, very restrained detail, soft natural studio daylight and subtle contact shadows. Warm off-white seamless background exactly near #f5f4ef. Center the objects within the middle 70% with generous clean negative space on every edge. Palette warm ivory, cobalt #3457db, charcoal #262b30, hint of sage. Quiet, playful, clean design-object aesthetic. No lettering apart from the two numerals, no logo, no watermark, no border, no hands, no scenery, no noisy texture. The objects must remain easily legible when displayed at 240 pixels wide.

The selected output is 1254 × 1254 pixels. It is saved in the repository unchanged; CSS controls its display size and edge blending.

## README cover prompt

Generated with the built-in image generation tool on September 3, 2026. No reference image was supplied.

Use case: editorial repository banner. Create one finished, beautifully typeset wide horizontal README cover image, 3:1 aspect ratio, around 1800 by 600 pixels. This is for Minesweeper 2.0, a minimal browser game and TypeScript 7 experiment. Palette: warm ivory background #f5f4ef, deep charcoal #262b30, vivid cobalt blue #3457db, tiny sage accents. Refined minimalist Swiss editorial layout with generous whitespace and meticulous alignment. Left 55%: small widely spaced uppercase eyebrow 'A LITTLE ROOM TO THINK', very large crisp dark sans-serif title on one line 'Minesweeper', a restrained cobalt rounded capsule directly below reading '2.0', then smaller dark gray subtitle 'A TypeScript 7 experiment'. Beautiful precise English typography, no other words. Right 40%: sculptural isometric cluster of matte ivory ceramic Minesweeper tiles, a raised cobalt triangular flag on one tile, subtle blue 1 and sage 2 numerals on revealed tiles, a small friendly charcoal geometric mine beside the cluster. Soft daylight, fine ambient shadows, tactile rounded edges, quiet premium design-object aesthetic. Extremely subtle thin blue grid traces behind the tiles, fading into background. Keep every element comfortably inside margins; do not crop text or objects. Flat rectangular canvas, no outer border, no mockup frame, no watermark, no gradients on the text, no photorealistic surroundings. The result should read clearly at GitHub README width and harmonize with an ivory-and-cobalt interface.

## Dungeon sprites

Nine transparent PNG assets were generated for the explorer, terrain, landmarks and square inventory controls. See [the complete prompt set and asset map](dungeon-artwork.md). Cell descriptions and numbers remain accessible text.
