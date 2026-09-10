# An Answer in the Tower

This is the second playable authored stage of the watchtower arc, following **Watchtower outer galleries**. Enter it at the upper tower landing after clearing the galleries. It is a three-floor encounter, not the completed five-plus-one chapter.

## What changes for the player

A broken voice answers from inside the tower. Nia, a signal technician, is trapped by a guardian still enforcing an old evacuation order: people without registered homes cannot leave. That includes the protagonist. Disconnecting the tower's powered gates creates the route to her; dialogue follows those physical changes instead of sending the player back to report an item pickup.

| Floor                    | Encounter                       | Required action                                                     | Optional outcome                                                               |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A Broken Call            | A voice without a face          | Isolate the relay's neighboring knots and disconnect the first gate | None                                                                           |
| A Name Without a Home    | A separate sealed registry      | Disconnect the main passage and continue toward Nia                 | Open the upper-left branch and physically collect an outsider's arrival record |
| Prisoner of an Old Order | Nia behind two powered barriers | Disable both relays and physically reach Nia                        | The preserved record changes the rescue and camp exchanges                     |

The record mentions a **homeward beacon** and contains a partial star chart. Without it, Nia still remembers the beacon's direction; skipping the branch never destroys the main lead or blocks the rescue. With it, her camp conversation identifies two observation points. Their later destinations are not implemented in this increment. Dialogue and working names remain open to playtesting.

After clearance Nia appears in camp and can be approached and spoken to. There is no compulsory return-item hand-in. The stage grants **80 supplies once**, in the existing shared wallet. There is no additional cash payout for the record, retreat or defeat. The record is a persistent narrative outcome, not a new equippable item. Completed stages currently cannot be replayed; recovery of a skipped record belongs to later content, not a hidden replay button.

## Relay rules

Relays have ordinary eight-neighbor mine numbers. Flag the hazards and uncover all safe neighbors, then physically operate the relay. Its readiness uses only the visible number, revealed neighbors and flags. It does not inspect hidden mine values. Placing flags alone does not remotely operate a relay, and repeating an already used relay has no effect.

Closed gates occupy terrain: walking and zero expansion cannot pass through them. Disconnecting a relay opens its associated gate without revealing the room behind it or changing mine numbers. Required relays must be disabled before the floor exit resolves. The registry's extra relay is optional. Existing profession skills and equipment keep their normal rules; a mobility build can offer an alternative route, but cannot bypass required relay objectives.

The layouts use different entrance positions and passage directions. They are authored, fixed boards, with public-clue, tool-free, damage-free solution tests for both record outcomes. These checks establish solvability; they are not a claim of final difficulty balance. The relay component is independent of the campaign selector and can be placed in later generated floors. Random placement and combination validation are still future work.

## Presentation and lifecycle

- Relays and gates reuse the Bastion family's original pylon/core assets. Nia uses a new original transparent chibi sprite; see [art provenance](story-artwork.md).
- Gates flash as their power drains before the next conversation begins. Speaking portraits react, and the opening voice is visually obscured until the signal connects.
- Dialogue uses grapheme-aware typewriter presentation and Nia's own synthesized voice. The first advance finishes the current line; the next advances the exchange. Mute and reduced motion use the existing preferences.
- Mouse clicks, keyboard activation and touch use the same physical action pipeline. Long presses retain the common annotation controls.
- Completed exchanges persist per stage. World return and reentry preserve health, tools, builds and the current attempt. If the page closes during the rescue ending, returning to the story recovers that exchange from the settled stage outcome; it does not reconstruct the retired run or award supplies again. Story performances do not grant supplies or action progress.

## Ownership and validation

`campaign-catalog.ts` owns stable stage IDs, replay revisions, prerequisites, floor counts and first-clear amounts. Each stage has its own entry under the versioned `campaign.stages` collection. `VariantRepository` projects the selected stage while preserving other stages, the roguelite journal and shared camp. The former single campaign slot migrates once to `tower-galleries`; no old gameplay engine is retained.

The playable revisions are `tower-road-v4` and `tower-relay-v1`. The existing roguelite rules revision is unchanged: this increment adds a separately identified authored layout and an optional circuit component, leaving existing generated floors and accepted replay behavior intact. Story schema 4 protects the new stage collection from older clients that only understand the single slot. Unknown future stage IDs, schemas and engine revisions remain write-protected.

Behavior coverage checks public solvability, gate/flood behavior, explicit operation, both record outcomes, independent saves, first-clear settlement, restoration, prerequisites and future-version protection. Browser coverage in `tests/browser/signal.mjs` traverses the complete rescue through desktop and touch controls and checks the English/Japanese entry and relay interaction. Run it after compiling tests with `PLAYWRIGHT_MODULE` pointing to Playwright and `GAME_URL` pointing to the game server.
