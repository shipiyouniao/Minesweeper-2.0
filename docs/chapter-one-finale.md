# Chapter One: the control room and northwest blockade

The main route now contains five exploration stages and one guardian stage, each with three authored floors. The fifth stage stays inside the old tower. The sixth begins beyond a new physical northwest route. These are campaign stages with independent attempts; the existing randomized roguelite remains available separately.

## Route and outcomes

| Place                | Entry requirement                                                                          | What the player does                                                                                  | Permanent outcome                                                         |
| -------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Control Room         | Clear Old Waterway, recover the beacon, and reach the control console at the tower landing | Isolate device neighborhoods, route supply to each console, and reopen the exit branch                | Restore the west line; lower the northwest bridge; earn 180 supplies once |
| Northwest Old Bridge | Restore the west line; walk to the northwest doorway on North Road                         | Cross the river on the restored bridge                                                                | Discover the blockade approach and unlock its camp shortcut               |
| Blockade Approach    | Cross the bridge                                                                           | Walk to the guardian entrance or use the southern camp path                                           | Preserve the explored scene and a reversible shortcut; no extra currency  |
| Northwest Bastion    | Clear Control Room and physically reach the blockade entrance                              | Repair two approach floors, then disable the guardian's two shield pylons and repair its exposed core | Open the blockade; complete the main task; earn 240 supplies once         |

The atlas shows the bridge and blockade in its previously empty northwest area. Selecting their map nodes only inspects a location. Actual travel uses scene doorways, keeps explored cells, and unlocks the shortcut on the first bridge crossing. Returning to camp permits the same workshop, profession, equipment and title choices used elsewhere.

The separate `restore-west-line` and `open-blockade` story tasks award no additional currency. Their completion follows the corresponding durable outcomes. Combined first-clear rewards for all six stages are 790 supplies; ordinary missions and achievements remain separate.

## Authored terrain and pacing

| Stage / floor                      | Board   | Mines | Manual safe excavations in the reference solution    |
| ---------------------------------- | ------- | ----- | ---------------------------------------------------- |
| Control Room / Bridge supply       | 17 × 17 | 43    | 46                                                   |
| Control Room / Alarm circuit       | 19 × 17 | 51    | 98                                                   |
| Control Room / West-line control   | 19 × 19 | 60    | 78                                                   |
| Northwest Bastion / Outer watch    | 17 × 15 | 35    | 52                                                   |
| Northwest Bastion / Sealed gallery | 19 × 17 | 51    | 86                                                   |
| Northwest Bastion / Guardian gate  | 13 × 11 | 26    | Tactical excavation and movement share action points |

The five exploration floors use new explicit mine maps, not transformed earlier maps or a runtime seed pool. At least 20% of playable exploration terrain contains mines. Every required control has a nonzero ordinary clue. Opening a power door reveals the doorway itself, not the room beyond it. Safe terrain is orthogonally connected when its authored gates are open; otherwise isolated safe cells are walls.

The reference solutions use public numbers, inferred flags and public wiring labels. They require neither guessed excavations, purchased equipment, scans nor profession skills. Control Room takes 372 accepted intents in the exhaustive reference route. The complete blockade stage takes 365, including a 33-turn guardian solution with the starting profession and the two normally selected floor relics. These are automated acceptance baselines, not expected human completion times or a final difficulty rating.

The guardian arena is smaller than the exploration chambers because walking now spends points. It starts with 12 revealed cells, 26 mines, two regional shield controls and 40 guardian health. Both controls must be solved before core damage is possible. One weakens incoming attacks; the other extends the attack window. The existing visible attack forecast, brace, core reopening, shield absorption and equipment/relic effects remain operative. Below half health, each announced cross instead centers on the player's position at the start of that turn. One orthogonal step cannot escape both arms; players need two movement points or can brace against the hit, creating a tradeoff with two-point attacks. The footprint stays frozen until end-turn and is shown in the illustrated guide. Randomized Bastion encounters retain their existing forecast pattern. The encounter starts directly on floor three; there is no extra random room after its exit.

## Story and presentation

The control room explains the fourth stage's warning: the guardian is holding a damaged gate, and leyline knots have entered its control circuit. Cutting the main power would release the gate too. The player restores individual branches instead.

At the blockade the guardian warns the player before its involuntary attacks. The two pylon deductions and core attacks serve the repair. The ending leaves the guardian alive, reopens a useful supply route, and confirms that it heard the protagonist at the old western crossing on the night of the arrival. The location is a real next lead; the crossing itself belongs to future content and is not represented as a playable location yet.

Conversations use the existing chibi cast, distinct voices and interactive typewriter buttons. The restored-line conversation visibly lowers a bridge on a small route diagram. Device switches retain accepted-action pulses and sound; northwest scene crossings animate into view; battle damage, attacks and shield changes retain the tactical performances. Reduced-motion preferences suppress travel and bridge animations. The campaign uses its own guardian conversation instead of stacking the generic encounter prologue over it. Contextual help uses the illustrated three-step device or boss guide.

## Persistence and validation

The new slots are `tower-control` / `tower-control-v1` and `northwest-bastion` / `northwest-bastion-v1`. Existing map rows and stage revisions remain intact. The additive northwest scenes fit the existing bounded world-checkpoint format, so current attempts do not retire. Incompatible future envelopes remain read-only.

Accepted stage intents replay from authored content. First-clear rewards, task outcomes and journal removal commit together. Ending ledgers permit an interrupted conclusion to resume after settlement without paying again. Earlier campaign slots and the paused roguelite journal remain independent. The shared camp supplies, profession, equipment, training, title and ordinary milestone systems retain their existing boundaries.

Behavior coverage checks both public-clue solutions, topology, clue truth, required controls, combat build effects, every accepted intent across reload, once-only rewards, physical entrances, world travel, the camp shortcut and future-save protection. `tests/browser/chapter-finale.mjs` exercises the two complete stages and their connecting route through actual desktop and touch controls. It also checks illustrated help, long-press flags, the guardian dialogue, settlement and the northwest atlas.

`tests/browser/finale-presentation.mjs` checks the illustrated guides, interrupted ending recovery, atlas navigation, and reduced-motion behavior at 320 px, 390 px and 3840 px, covering all three languages. Its motion-enabled checks verify accepted keyboard switch feedback, the lowering bridge animation, and the distinct player, Nia and guardian voices.

The main six-stage arc is complete. Additional side stages, later chapters, exploration variants and configurable Recollection remain Roadmap II work; this increment does not close that roadmap.
