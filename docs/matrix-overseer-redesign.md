# Matrix Overseer: crystal hunt redesign

Status: implemented in rules revision 13. This records the approved replacement of the full-board nonogram boss; standalone Survey remains a nonogram mode. See [Matrix Overseer](matrix-overseer.md) for current rules and measured acceptance results.

## Why change the fight

The previous encounter encouraged solving and flagging the entire nonogram before moving. Three predetermined prism circuits then require physical confirmation of otherwise deduced safe squares. Free flagging, repeated travel and quiet-turn calibration restrictions make puzzle solving and combat feel separate. More instructions explain these restrictions but do not remove the repetition.

The replacement uses ordinary Minesweeper for navigation and a small crystal-location puzzle for choosing objectives. Progress comes from reaching and extracting useful objects under combat pressure.

## Ordinary minefield

- Reveal ordinary adjacent-mine numbers and use normal zero-cell flood opening.
- Shuffle an exact mine quota on every new encounter. Vary entrance, boss position, irregular obstacles, observation regions and their approaches; remove the guaranteed perimeter/central-cross layout and fixed prism stations.
- Keep mines, opened clues and crystals stable during a fight. A later phase activates another region; it does not invalidate earlier deductions.
- Require connected playable terrain, a useful safe opening and reachable objective approaches. Reject layouts that require guessing to reach the required objectives with the published clues.
- Ordinary flags and cancellable safety notes remain free planning aids. Neither charges the boss-breaking mechanism.

## Hidden refractive crystals

Refractive crystals are objects on safe terrain, separate from mines. Ordinary floor numbers count mines only. Revealing or flood-opening a crystal's square exposes safe ground but does not reveal or collect the crystal itself.

Each shield phase activates one clearly outlined **3 × 3 observation region** containing **three or four crystals**. A compact observation panel gives ordered row/column runs for the crystals in that region, not for mines across the battlefield. A `1 1` clue on a three-cell row means crystal, empty, crystal; the player never needs a second full-board rule set.

The small panel and the corresponding battlefield region highlight each other's selected cell. Players may mark a suspected crystal position without spending AP. These marks are hypotheses and are not automatically certified against hidden contents.

The observation panel starts collapsed behind a square observation control, beside the normal combat tools. Opening it does not consume AP. It shows the nine-cell local map, its crystal clues and the selected target on the main board. It can be closed immediately after choosing a route. The battlefield retains its ordinary mine numbers and does not acquire full-width nonogram headers.

Mines and walls inside the region exclude crystal positions, providing a connection between ordinary exploration and crystal deduction. Crystal layouts must already be uniquely solvable from their public local clues; these exclusions can simplify the small puzzle further.

### Extraction

1. Work out a promising crystal location from the local observation panel.
2. Open a safe route and reveal the target floor square using ordinary expedition movement and excavation.
3. Stand on or orthogonally adjacent to that square, then use **Attune** for **1 AP**.

A correct attunement reveals and immediately collects that crystal. An empty attunement spends its AP and records that square as empty; it causes no extra arbitrary damage. Attempting to revisit an already resolved attunement is blocked with an explicit explanation and no AP cost. A mine or wall cannot be an attunement target.

Both crystals and ruled-out locations remain visible in the observation panel. Movement, digging and attunement form the tactical cost; merely marking the correct solution never awards charge.

## Two shield phases

- Each phase needs **two collected crystals**. The region contains three or four, so the player can choose the more accessible pair and leave the others.
- Collecting the second crystal immediately shows a beam striking the boss and breaking its shield. There is no additional prism click, full-line completion check or quiet-turn requirement.
- The player can attack immediately with any remaining AP. That health band's shield stays broken permanently, allowing the player to choose a safe approach and attack pace.
- Boss health has **two bands**. Standard tuning starts at 30 total health, with the phase boundary at 15. Reaching that boundary activates the second observation region after the current turn resolves.
- There is no expiring shield window or repeat activation action. Reaching the next health band is the only event that introduces another shield and objective region.
- Crystal extraction works on quiet turns. Those turns are opportunities to prepare or attack, not a hidden interaction restriction.
- Extra crystals from the completed region are inert. There is no completion bonus that quietly encourages clearing every region anyway.

The required total is four extractions across two small observation regions. Players do not need to solve the full minefield, flag every mine, reveal every safe square or collect every crystal.

## Combat pressure and build choices

Enemy attacks remain turn based, publicly forecast and resolved only when ending the turn. Use player-position and objective-area line attacks with known safe escape options; freeze each forecast before actions begin. Deliberation and marking never advance the enemy timer.

- Extra AP and movement discounts improve extraction routes and leave more time to attack.
- Probes, scanners and profession reconnaissance establish safe approaches. They retain their normal mine-scanning meaning and do not directly reveal hidden crystals.
- Attack bonuses reduce the number of exposed combat turns; defense, shields and healing support riskier paths.
- Adjacent attunement lets a player reach a crystal without always standing on its exact square. Its position still matters because the actor must physically reach its neighborhood.

Keep the observation panel at 3 × 3 on all five difficulties. Increase ordinary minefield pressure and boss tuning rather than making the nonogram portion dominate higher tiers. The initial standard-difficulty playtest target is roughly 10–15 turns; this is a design target, not a measured result.

## Generation and implementation boundaries

Use the existing seeded shuffle and normal dungeon connectivity tools. Generate a fresh playable encounter from the run seed/checkpoint; the dedicated preview should offer **New board** in addition to restarting the current board. The previous preview always reloaded one fixed seed, which amplified the repeated-layout experience.

Generate two small regions with their own stable crystal runs. Do not expose the later region's crystal clues before its phase. Select among validated local layouts, then validate placement against safe terrain and reachable approaches. Avoid routes that require clearing the entire minefield just to connect the two objectives.

A bounded enumeration of all 3 × 3 layouts found 54 uniquely solvable placements with three crystals and 86 with four. The existing public line solver finishes all 140 without guessing. These counts include rotations/reflections; they establish feasibility of a small varied clue set, not 140 distinct puzzle structures or a gameplay-quality claim.

Keep named state and action contracts in `.d.ts` modules. Mine generation, crystal deduction, attunement and shield transitions remain pure; the expedition session owns replay and the view owns targeting/observation UI. Add a concrete attunement command rather than overloading ordinary flags with hidden effects.

Reuse the Matrix Overseer artwork, with generated crystal, observation-tool and attunement assets in the same style. Animate extraction, charge delivery and shield fracture so the cause of exposure is visible.

Retain the first-defeat goal and existing title effect against an exposed Matrix core. Replace the three-reflection achievement condition with defeating the boss without an empty attunement; retain its existing reward and previously claimed ownership. Rules revision 13 retires old active journals under the established camp-return policy.

## Playtest acceptance

- A player can explain the loop after the illustrated guide: reveal safe routes, locate crystals locally, extract two, then attack.
- Several fresh boards produce different openings, objective routes and extraction choices.
- A successful run never requires solving a full-board nonogram or walking to every deduced safe square.
- Collecting two crystals is sufficient even when other crystal and safe cells remain unresolved.
- Marking, empty attunement, collection, quiet turns, permanent shield breaks and phase transitions have explicit feedback.
- The ordinary fixed action dock, responsive board/sidebar, keyboard focus and complete mouse/touch/keyboard controls remain consistent with other bosses.
- Verify at least two contrasting builds and an unupgraded explorer. Adjust travel distance and phase duration if the small observation puzzle still interrupts the fight for too long.
