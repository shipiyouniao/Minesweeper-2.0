# Reward professions

These two careers are exclusive milestone licenses, absent from the shop. They do not consume or exchange inventory tools. Both have distinct generated portraits used by the camp and board pawn, plus separate skill icons. Existing careers and purchases remain available.

| Career              | Unlock                                        | Starting resources | Active skill                                                                                                                                                           |
| ------------------- | --------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Waymarker / 锚行者  | Claim Return route after 12 cumulative floors | 1 probe, 1 scan    | Place an anchor, then return to it from another square; each stage costs one action, one completed return per floor                                                    |
| Riftwalker / 裂隙师 | Claim Rift pioneer after 50 cumulative floors | 2 probes           | Select a revealed safe square two orthogonal steps away across one confirmed mine or wall; cross and create a two-way walking connection for this room, once per floor |

The anchor stores room identity, including the mirrored realm. Another room cannot use its coordinates. An occupied landing or the player's current square rejects return without spending an action. Placing the anchor alone does not trigger skill-completion rewards or counters; completing the return does. Entering a new floor resets the use and local anchor. Crossing into a boss arena invalidates an ordinary-room anchor; an unused skill can place a new one there.

Rift targets depend on public knowledge: guessed mine flags and hidden landing cells are insufficient. The intermediate cell must be a confirmed mine or wall, never the current boss body. Its mines, flags and adjacent numbers remain intact. Ordinary walking, path previews, movement costs and reachable-frontier search use the same bidirectional connection. Returning through it requires a normal movement action, not another skill charge. It remains scoped to the room/realm; a boss occupying either endpoint or the intervening cell blocks traversal. It never restores over a player to seal the return route.

Landing on a chest physically collects it once. Landing on stairs does not bypass an encounter or automatically claim the floor; explicit stair entry still follows ordinary rules. Both professions spend one action point for each accepted skill stage during combat and cannot act at zero points. Field radio and Pulse coil activate once on skill completion, not anchor placement. The base skill keeps its once-per-floor limit even when moving between ordinary and boss rooms.

The skill panel lists Riftwalker landing buttons using one-based row/column coordinates. Dashed violet outlines mark eligible destinations; solid violet outlines mark the open connection. Teal outlines mark return anchors. The panel also shows the stored anchor's coordinates. Keyboard and touch operate the same typed commands. Portrait, skill, effect and availability text exists in English, Chinese and Japanese.

## Persistence

Licenses are derived from claimed milestone IDs and are checked on departure and replay. No old profession is added to `Camp.upgrades`. The action journal records placement/return and an optional finite target index for the rift skill. Anchor/portal geometry is rebuilt from these accepted intents, never trusted as saved board state. Existing revision-7 departures contain neither new career nor new relic IDs, so their replay remains compatible; this additive release does not retire them.

## Artwork provenance

Created with the built-in imagegen tool, one generation per asset; original PNG alpha is retained and project files are copies of the generated originals. Shared prompt wrapper: “Create one production game asset. [subject] Centered, entire object visible with generous transparent padding, square composition, genuinely transparent background with alpha, no text, no letters, no frame, no ground plane. Save output for asset [id].”

- `public/assets/dungeon/waymarker.png`: “Full body cute chibi dungeon explorer, soft 3D toy render, teal hood and cream coat, brass anchor-shaped beacon in one hand, looping turquoise magical thread in other hand, big simple dark oval eyes, small brown boots. Distinct clean silhouette readable as a 64px board pawn.”
- `public/assets/dungeon/riftwalker.png`: “Full body cute chibi dungeon mage, soft 3D toy render, plum-purple hood and cream tunic, dark oval eyes, opening a violet slit portal with a small tuning-fork staff, small boots. Distinct clean silhouette readable as a 64px board pawn.”
- `public/assets/dungeon/skill-waymarker.png`: “Single magical brass anchor beacon encircled by one looping turquoise return arrow made of light. Cute polished 3D toy-style dungeon skill inventory icon, chunky shapes, extremely readable at 64px. No character.”
- `public/assets/dungeon/skill-riftwalker.png`: “Single short cream stone wall split by a luminous violet oval portal, a small glowing path passes through it. Cute polished 3D toy-style dungeon skill inventory icon, chunky shapes, readable at 64px. No character.”
