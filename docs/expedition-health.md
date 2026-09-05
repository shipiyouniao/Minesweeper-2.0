# Expedition health and shields

> Historical delivery notes: the [current combat table](tactical-builds.md), [board interaction rules](board-interaction.md) and [save policy](save-policy.md) supersede older numeric values, hazard markers and replay-compatibility statements below. Current mine hits use red mine markers, including shielded hits; gold flags indicate discovered mines. Only the current expedition implementation is shipped.

This delivery implements the shared-health workstream in [Roadmap #1](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1). It gives ordinary exploration room for a mistake and establishes the resource model for future tactical Boss rooms.

## Playable rules

| Event                          | Result                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| Start any new expedition       | 2 HP out of 2; profession and equipment determine starting shields                                  |
| Reveal a mine with a shield    | Consume 1 shield; HP stays unchanged                                                                |
| Reveal a mine without a shield | Lose 1 HP; continue if HP remains above zero                                                        |
| Survive a mine                 | Mark it with a locked gold flag; keep the mine, its clues, and the player on the safe approach cell |
| Reach an exit                  | Recover 1 HP, capped at maximum, once on that floor (including the final floor)                     |
| Choose a relic or continue     | Carry health and shields forward; no additional healing on floor construction                       |
| Reach zero HP                  | End the run and settle the existing defeat reward once                                              |
| Extract                        | Keep the existing loot settlement; no healing                                                       |

**2/2 (+1)** means two current HP, two maximum HP, and one shield. The bar represents HP only. Shields are separate protection, capped at two, displayed beside health rather than as a passive inventory tool. Damage, shield changes and recovery produce different short synthesized cues, controlled by the shared mute button. Text and accessible meter labels expose the same values without relying on color or sound.

All professions and difficulty tiers currently share the same base health and mine damage. These are initial balance values, not a claim that the larger progression system is finished. The table describes base health rules; [purchasable relic themes](relic-packs.md) can add chest healing, reactive shields and one-time prevention of a lethal hit. Boss attacks and consumable healing items remain future content. The pure vitality model supports damage spilling through multiple shields and healing to a variable maximum without reviving a defeated character; Second wind acts before the engine enters defeat.

## Compatibility and ownership

The **`health-v1`** revision introduced shared health and requires a difficulty. Current **`relics-v1`** departures retain those health rules and also capture owned [relic themes](relic-packs.md). Both revisions preserve the board dimensions, density, openings, seeded layout and floor count from `difficulty-v1`. Historical `health-v1` journals retain their original reward pool. The expedition save envelope stays at version 3 and the storage key stays unchanged.

Existing `original`, `scouting`, and `difficulty-v1` journals retain one HP, their existing shield behavior, and no exit healing. The game identifies this rule in the health panel and help dialog. No old run is silently upgraded, rebalanced or discarded. Missing rules in stored journals still decode to `original`; direct historical domain inputs without rules retain their existing scouting-layout behavior.

Only departure choices and accepted actions are stored. Replay reconstructs damage, shield consumption, gold flags and exit recovery. It never trusts serialized HP or shield values. A terminal transition clears the journal and credits the camp in the same write, so reload cannot award the outcome twice. Difficulty-based result buckets remain as before; historical results with difficulty metadata stay in their tier.

The `.d.ts` `Vitality` contract and pure functions in `src/game/vitality.ts` own combat-resource arithmetic. `ExpeditionSession` continues to own persistence and settlement; browser adapters own rendering and Web Audio. The audio selector reads public resource changes, never hidden mine information.

## Validation

Behavioral coverage includes shield absorption and overflow, damage bounds, healing caps, no resurrection, surviving hazards and impassable locked flags, zero-HP loss, one-time exit healing, final-floor recovery, both descent paths, all five difficulty geometries, historical shield-hit replay, damaged-run restoration and exactly-once death settlement. Both the native TypeScript 7 compiler and the legacy compiler run the same suite.

Browser acceptance checks the combined readout, shield use, HP loss, healing, death, reload, keyboard input, mute, all three translations and narrow-screen layout. The PR carries before/after screenshots. See the separate [profession artwork](dungeon-artwork.md), [camp economy](camp-progression.md) and [relic theme](relic-packs.md) records for their delivery details; tactical Boss encounters remain on the Roadmap.
