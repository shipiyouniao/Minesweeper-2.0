# Tidekeeper

Tidekeeper turns the proposed Tides mode into an Expedition boss. Ordinary Minesweeper deductions open routes through a shuffled arena. Every third **End turn**, movable floor tiles change places. Anchors preserve a small region; holding the tidal core in place sends a countercurrent into the boss's shield.

## Encounter values

| Rule          | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Arena         | Existing five tactical difficulty sizes, 17% mines                             |
| Health        | 20 + twice the difficulty's encounter health scaling                           |
| Actions       | Derived from the actual profession, equipment, training and relic build        |
| Wave attack   | 4 damage before normal defense, brace, shields and revival                     |
| Tide          | Every 3 explicit End turns                                                     |
| Anchors       | 2 per tide, 1 action point each                                                |
| Anchor target | Pawn's tile or a revealed orthogonal neighbor                                  |
| Fixed area    | Clipped 3×3 around each anchor; lasts until the next tide                      |
| Shield        | Two sections; the second starts after reaching half health and ending the turn |
| Shield break  | Reveal the core and include it in an anchor's area when the tide resolves      |
| Melee         | Adjacent, 2 action points; existing attack and relic bonuses apply             |

The broken shield stays open until its health section ends. This leaves time to travel after a successful countercurrent. Damage cannot skip the second section. The tidal core remains a safe landmark, and travels with its tile when unanchored. Two anchors let a player protect a useful route as well as the objective.

## Turn and animation sequence

1. Resolve the published attack against the old board and pawn position.
2. Apply ordinary defense, shields, damage reactions and revival. A defeated expedition stops here.
3. On a tide turn, choose a validated permutation. Walls, their orthogonally adjacent mines, the pawn's floor, boss tile and anchor footprints stay fixed.
4. Move the public tiles, including their marks. The wave crosses the board while the tiles travel to their new positions.
5. An anchored, revealed core sends a visible beam back to the boss and shatters the shield. Anchors expire.
6. Publish the next attack and refresh action points. Its threatened pawn always has a revealed, affordable one-step escape; otherwise the forecast becomes a single-tile attack or a quiet turn.

The domain transition is committed before the animation. Pause, backgrounding, resize, help, language changes and teardown may cancel a performance, but cannot roll back or duplicate its action. Reduced-motion settings replace travel with brief opacity changes. Landing anchors have a descending sprite, expanding chains, a complete footprint flash and a short procedural sound; mute follows the shared preference.

## Tile identity and fairness

The permutation transports mines, cover state, ordinary flags, safe hypotheses, confirmed mines, triggered mines, surveyed cells, travel history and profession mobility markers. Ordinary mistakes remain mistakes. Numbers are recomputed from the new eight-neighbor layout, including at the edge of fixed regions. Existing revealed tiles stay revealed; a quick-open can expand their newly calculated zero clues.

Old scan-row, probe-area and sonar reports describe geometry which no longer exists, so those reports expire. Their individually confirmed discoveries remain on the corresponding tiles. Resources, health, loot, floor triggers and build effects are unchanged by the permutation itself.

Generation uses seeded Fisher–Yates permutations, exact mine counts and bounded rejection. Candidates must leave every retained safe tile connected and solvable from public clues; ordinary guessed flags are cleared only in the validator's private copy. They are never corrected on the player's board. After 128 rejected candidates the terrain stays in place. This constrained sampling is not claimed to be uniform over all valid boards.

## Integration and trial

Tidekeeper is the eighth family in the seeded boss rotation. Checkpoint floors, ordinary floor rewards and camp purchase values remain unchanged. Shared combat upgrades work normally; Breach sigil and Focus lens also reward the countercurrent shield break. The current journal revision is 15; older expeditions return to camp under the [save policy](save-policy.md), without keeping another combat implementation.

Run the production UI in an isolated local trial:

```sh
npm test
npm run build
node scripts/tide-demo.mjs
```

Open `http://127.0.0.1:4819/`. The trial offers a fresh battle, a new seeded board, an accepted journal immediately before anchoring, and one immediately before a countercurrent. These fixtures use legal domain actions and the real build. The preview writes only to its local origin; it adds no debug route to Pages.

Automated checks cover permutation transport, incorrect flags, anchor costs and expiry, fixed footprints, exact mine counts, connectivity, attack-before-shuffle ordering, deterministic replay, and public-clue victories with an unupgraded explorer at all five difficulties. Browser checks exercise pointer and keyboard targeting, cancellation, transition locking, small-screen layout and reduced motion.

See [artwork and generation prompts](tidekeeper-artwork.md). Issue #1 remains open for playtest feedback and the next agreed changes.
