# Variant difficulty rules

Twin and Expedition each offer five difficulty tiers. Choose a tier at camp before an expedition, or above the Twin boards before starting a new pair. Changing a running Twin pair requires confirmation; an active expedition keeps its departure rules.

| Tier     | Twin size, each | Mines per Twin board | Expedition size | Floors | Expedition mine density, first to last |
| -------- | --------------- | -------------------- | --------------- | ------ | -------------------------------------- |
| Relaxed  | 9 × 9           | 10                   | 9 × 9           | 3      | 15% → 19%                              |
| Standard | 12 × 12         | 22                   | 11 × 11         | 5      | 18% → 24%                              |
| Advanced | 16 × 16         | 44                   | 13 × 13         | 7      | 20% → 26%                              |
| Expert   | 20 × 20         | 76                   | 15 × 15         | 9      | 22% → 28%                              |
| Abyss    | 24 × 24         | 120                  | 17 × 17         | 12     | 24% → 30%                              |

These are initial playable tuning values. Expedition interpolates density evenly over the selected floor count, then rounds board area × density to the nearest whole mine. Seeded shuffling places exactly that many mines. The catalog is in `src/game/variant-difficulty.ts`, with contracts in `src/types/variant-difficulty.d.ts`.

Dungeon generation retains connected walkable terrain, reachable treasure and exits, and complete blank-region opening. Twin still partitions one shuffled candidate list into disjoint mine sets, reserving the first move and its neighbors on both boards. Input, scanner rows, probe previews, counters and pathfinding use the generated board's dimensions.

## Board display

The default view fits the full board to its panel. **Larger cells** switches to 44-pixel targets; scroll or swipe inside the panel to reach the rest of the board. **Fit board** restores the overview. Keyboard movement scrolls focused cells into view. Board actions preserve the zoom setting and scroll position; a new floor starts with a fresh viewport. The two Twin panels scroll independently.

## Persistence and records

New Twin pairs store a tier and the `difficulty-v1` rules revision. New expeditions use `relics-v1`, retaining the same difficulty geometry and [health and exit recovery](expedition-health.md) while capturing owned [relic themes](relic-packs.md). Existing `health-v1` expeditions retain their original reward pool, and `difficulty-v1` expeditions retain their original damage rules. Rebalancing this catalog requires a new rules revision, not changing the meaning of an existing journal. Each mode has one active run, and its departure tier is restored after refresh. The last expedition choice is remembered at camp.

Historical runs without difficulty metadata keep the original 9 × 9 geometry: Twin has 12 mines per board; Expedition has five floors with 15, 17, 19, 21 and 23 mines. The existing `original` / `scouting` opening and compass behavior remains unchanged. Old results appear under **Original rules**, rather than being assigned to a new tier.

Each mode retains the latest ten results **per tier**, plus up to ten historical results. Results are grouped by tier in the records dialog. Classic records and saves remain separate. Invalid difficulty names, unsupported revisions and out-of-bounds actions are rejected at the storage boundary.

## Longer expeditions and staged delivery

The current relic pool is finite. Once every available relic is owned, the reward screen offers **Continue to next floor**, preserving the current build and floor-entry effects without adding duplicate relics. The final configured floor ends the expedition normally.

Shared health is now available; see the [health rules](expedition-health.md). Boss rooms, new professions, and the larger relic catalog are separate workstreams in [Roadmap #1](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1). The [camp pricing foundation](camp-progression.md) combines affordable opening choices with a most-expensive-item target of at most ten successful Abyss clears. [Difficulty rewards](expedition-rewards.md) increase final settlement from a reference 204 supplies on Relaxed to 1,431 on Abyss. These are planning scenarios; profession/content expansion and measured playtime balance remain pending.

## Verification

Behavior tests cover every tier, every configured floor, exact mine counts, truthful clues, connected terrain, blank expansion, large-coordinate replay, scanner bounds, old journals, per-tier record retention and complete runs through relic-pool exhaustion. UI acceptance also checks difficulty replacement/cancellation, zoom and scrolling, keyboard focus, targeted tools and narrow layouts in a browser.
