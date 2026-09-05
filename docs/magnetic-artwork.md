# Magnetic Knight artwork

Two original transparent PNG sprites were generated with the built-in image-generation tool for this project. They are stored in `public/assets/dungeon/` and distributed under the repository's MIT license. No external character art or recordings are used.

| Asset                 | Role                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `magnetic-knight.png` | Boss portrait, living board actor and translucent charge destination |
| `magnetic-anchor.png` | Numbered grounding station, with a separate calibrated-state outline |

The knight faces right to match the profession artwork. The UI draws field arrows, routes, destination outlines, grounding, energy buildup, collision rings and overloaded core states in CSS/SVG/Web Animations. These effects use actual board geometry and deterministic public state rather than decorative prerecorded footage. Defeated artwork is muted; reduced-motion mode keeps the static forecast.

## Knight prompt

> Create ONE production game sprite: the Magnetic Knight boss for a minimalist tactical Minesweeper dungeon game. Stylized polished toy-like 3D fantasy illustration, readable chunky silhouette at 48px, full body three-quarter view facing RIGHT, compact steel and ivory armored knight with two unmistakable horseshoe magnet gauntlets (one copper-red, one cyan-blue), dark faceless visor with two small cyan eyes, exposed circular electromagnetic core, calm powerful grounded stance. Very few large shapes, clean soft painted edges, restrained accents, no busy engravings, no text or letters, no UI, no scene, no border. Center the complete character with generous 10 percent clear margin on all sides. Truly transparent RGBA background, no floor, no cast shadow beyond the character. Square image. This is the actual boss portrait and board sprite, not a concept sheet. Use built-in generation and return saved local path.

## Anchor prompt

> Create ONE production transparent game icon: an electromagnetic ground anchor for a minimalist tactical Minesweeper dungeon. A low chunky ivory-and-dark-steel octagonal base, large copper coil around a sturdy short upright steel grounding spike, two small opposed cyan and warm-red magnetic terminals, a simple bright cyan loop near the foot. Stylized polished toy-like 3D fantasy item illustration, readable silhouette at 48 pixels, restrained detail, large clean shapes, three-quarter view facing right matching a steel and ivory magnetic knight. The whole object centered with 12 percent clear margins. Real transparent RGBA background, no scene, no floor, no text or letters, no border, no UI. One object only, no sprite sheet.
