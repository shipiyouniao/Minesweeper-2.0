# Campaign, shared camp and reusable expedition floors

Status: direction approved and tracked in [Roadmap II #55](https://github.com/shipiyouniao/minefarer/issues/55). The prologue, shared camp, compact scene checkpoints, persistent road/quarry/lift route and outer galleries are implemented. [An Answer in the Tower](tower-signal-rescue.md) adds the rescue stage; [Ridge Observatory](ridge-observatory.md) adds a third three-floor stage with reversible power routing and a concrete beacon location. [Old Waterway](old-waterway.md) adds a fourth stage with larger deduction-heavy minefields, drainage and an on-site beacon discovery. [Control Room and Northwest Bastion](chapter-one-finale.md) complete the five-exploration-plus-one-boss main arc, with a physical northwest bridge, blockade approach and camp shortcut. Each stage has an independent save entry. The [old-mine rescue](quarry-rescue.md) is an independent optional three-floor route with a transport puzzle and a permanent camp resident. [Chapter Two's opening](chapter-two-opening.md) adds Reedbank Camp and configurable Recollection with generated ordinary, relay and power-routing floors and earned boss pools. Chapter Two's stages, additional side stages and the wider mechanic combinations remain incomplete. The requirements below replace the earlier proposal for separate campaign loadouts or normalized campaign equipment. Later chapter content and combination weights remain to be authored and playtested.

[Roadmap II new modes and boss families](roadmap-2-mode-candidates.md) records the approved Lookout, Fleet and Islands additions and the requirement for visually distinct numeric clue kinds on mixed floors. Detailed parameters and story remain under discussion.

[The board-based world and story direction](roadmap-2-world-and-story.md) records the approved camp/overworld structure, Recollection configuration, long-term development scope and hazard lore. Recollection is the new camp-integrated form of the existing roguelite.

## Player structure

The homepage continues to offer Expedition and Free play. Expedition opens **the current regional camp presented as an explorable board**. The Forest and Reedbank camps share party ownership and progression; each later chapter is planned to add its own physical camp. Their paths lead to facilities, task-givers, the persistent overworld and stage entrances. Beginning in Chapter Two, the pier lantern opens **Recollection**, the existing roguelite adapted into configurable challenges. Players choose difficulty and checked board-mechanic/boss pools unlocked through campaign progress; prior boss victories remain eligible. This replaces the earlier design of two parallel departure menus with a campaign-independent roguelite catalog.

The camp owns supplies, purchased equipment, professions, titles, training, unlocked relic pools, ordinary missions and achievements. Purchases, claims and equipment effects work in both activities. Campaign must not silently replace an owned build with preset statistics or maintain a second shop. Departure snapshots continue to freeze the selected profession, title and loadout for that attempt; later camp purchases affect later departures.

Campaign and Roguelite have separate resumable attempts, outcomes and route progress. Both settle into the same camp. A clear UI distinguishes continuing an attempt from starting a new one. Suspending one activity does not discard it when the player visits the other.

## Chapters, stages and side routes

The long-term target is **40–50 hours for a first playthrough of the complete story campaign**. Repeat clears, currency grinding and achievement cleanup do not supply that budget. The current first chapter is an early portion of that campaign, not evidence that the target has already been met. Measure first-time players' active exploration, deduction, combat and story time separately; automated action counts validate solvability rather than human duration.

Build that length through the eleven planned chapter families and room for further regions, with substantial authored floors, evolving combinations, branching exploration and character conflicts. Do not reach a duration target by adding empty travel, mandatory repeat purchases, inflated boss health, or multiple rooms that ask the same question. Later chapters can become longer and more demanding as the available mechanics grow. Chapter and stage time budgets remain provisional until actual first-time playtests support them.

Each of the eight existing and three newly approved boss families anchors a chapter, giving eleven currently planned chapter families. Their narrative order remains open, and they do not define the project's final chapter count or ending. Each chapter contains **five main exploration stages and one main boss stage**, plus authored side stages and optional routes. Every stage has three to five floors. The final floor of the sixth main stage hosts the chapter boss; preceding floors provide preparation and opportunities to complete related objectives.

Each stage is an independent expedition: prepare at camp, build through its floors, then settle. In-run health, tools and acquired relics belong to that attempt. Permanent unlocks remain shared. Failure retries the current stage rather than the whole chapter; leaving the application preserves the current floor. Clearing a stage is one possible quest event, not an unconditional instruction to unlock the next numbered stage.

Main routes teach the chapter's mechanics through play. Side routes can introduce an alternative use, combine earlier mechanics, rescue a character, find an equipment blueprint or change an upcoming encounter. A required progression objective is labeled as main story, never disguised as an optional side quest. Optional routes remain available after chapter completion unless a specific authored outcome is clearly communicated in advance.

An independent side story needs a separate physical entrance and dedicated multi-floor content, its own conflict and ending, and a persistent character, camp or equipment outcome. Offer it before the chapter boss so the player can leave the main route, finish the side story and return. A satchel collected on the required path, an extra dialogue choice, or the main route's bridge shortcut is an incidental event, not a delivered independent side route. The old-mine rescue delivers this first branch; the satchel and optional main-route pickups are still not counted as independent stages.

Campaign maps explicitly author mines, walls, board connections, landmarks, objectives and rewards. They are not random maps with a permanent seed. Optional relic offers can vary within an authored pool without moving the puzzle's required resources or making its solution depend on a lucky offer. Story stages must be completable with the guaranteed starting options and supplied tools; shared upgrades and alternative professions add choices and advantages.

## Tasks control the campaign

Camp navigation separates **Story tasks** from **Ordinary tasks**; Achievements remains shared. Story tasks have Main and Side categories. A chapter map shows available, active, completed and locked destinations, with concrete prerequisite text on locked destinations. The active floor shows a short tracked objective and its relevant map marker.

Ordinary tasks and achievements count eligible accepted gameplay from both activities. Objectives that specifically require a roguelite difficulty, a complete roguelite run or a particular story stage retain that explicit scope. Practice/tutorial simulations cannot award progression. Interactive teaching that happens in a real campaign stage follows that stage's normal rewards.

Story progress uses authored prerequisites and outcomes rather than a linear `nextStage` field. Supported conditions should include completing a named task or stage, securing a named quest item, rescuing a named character and activating a named world mechanism. Use concrete, typed all/any prerequisite groups. No arbitrary scripts or string expression evaluator are needed.

Example chapter progression:

1. The player clears the approach and discovers an inactive lift. Its route is now known, but the lift remains locked.
2. A main task opens a repair stage where the player must secure a power component and activate the lift control.
3. Completing that task opens the lift route automatically. Merely reaching the repair stage's exit does not satisfy the missing objective.
4. A side task rescues a mechanic and unlocks a shared equipment blueprint. It may also offer a one-attempt preparation benefit for the chapter boss, but the boss remains beatable without it.

Task completion and reward claims are separate states. Route prerequisites read completed objectives, not whether the player pressed Claim. Physical delivery/rescue objectives explicitly require the item or character to be secured; remotely revealing a target is not collection. Completed persistent tasks are not undone by replay or a later failed attempt. Attempt-local objectives are clearly identified and reset only with that attempt.

The authored dependency graph must be acyclic and reachable from the chapter entry. A mandatory task cannot require an item that is available only behind its own locked route. Story task IDs and stable outcome flags reference public campaign facts rather than transient board coordinates.

## Chapter mechanics belong on ordinary floors

The following are proposed exploration forms of the existing boss mechanics. They use the same underlying behavior in authored campaign floors and generated roguelite floors. Their exact parameters are content work, not new independent free-play menu entries.

| Chapter family | Ordinary-floor mechanics                                                                                                                 | Boss culmination                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Bastion        | Regional power controls, sealed passages and protected objectives; deduce and reach controls to open routes.                             | Manage the guardian's powered defenses and attack windows.                  |
| Brood          | Connected webs, destroyable nests and rescue routes; clearing a nest permanently changes the local obstacle or threat.                   | Prioritize nests, creatures and the queen under tactical pressure.          |
| Mirror         | Two connected boards, cross-board knowledge and explicit crossing points. Entrance and exit can be on different boards.                  | Apply cross-board routing and inference while fighting the twins.           |
| Magnetic       | Previewed push/pull zones, grounding anchors and mechanisms that move the explorer or a designated object.                               | Use grounding and projected displacement against the knight.                |
| Clock          | Mechanisms that advance on specified valid actions, with stasis devices and visible deadlines. Thinking or hovering never advances them. | Manage spell deadlines and counterplay during the mage encounter.           |
| Echo           | Regions with concealed floor clues and available regional readings; tools support navigation through obscured information.               | Localize the warden and respond to its changing phases.                     |
| Matrix         | Full row and column bands replace floor numbers with edge mine-run clues; surrounding Minesweeper clues help solve these crossing bands. | Combine ordinary mine inference with small crystal hunts to remove shields. |
| Tide           | Announced rearrangements, anchors and stable landmarks; marks travel with their cells and clues refresh together.                        | Exploit safe anchors and shifting routes during the Tidekeeper encounter.   |

Environmental mechanics do not automatically turn all exploration into combat. Floors with enemy turns explicitly enter a tactical state and show their action controls. Clock/tide triggers use a clearly defined action or turn schedule, never elapsed real time. Boss attack forecasts, skill animations and mechanical explanations remain in both activities. Character dialogue and story scenes play only in Campaign, with skip/replay controls and no automatic repetition on a retry.

### Cross-board exploration

An explorer location consists of a board identifier and a cell identifier. Pathfinding operates on the combined graph of safe walking cells and legal crossing links. The entrance, exit, quest targets and treasures can belong to different boards. A valid stage may require A to B to A travel; switching which board is displayed does not itself move the character.

Crossing points must be discoverable and usable with guaranteed resources. Joint reachability is checked across both boards, rather than incorrectly requiring every objective to be reachable on each individual board. Existing cross-board inference, such as mine exclusion where specified, remains explicit and applies to all information tools consistently.

### Crossing nonogram row and column bands

Ordinary exploration uses full-length crossing bands, not the boss's small crystal-search footprint. For example, on a 9-by-9 board, select rows 4-6 and columns 4-6. Suppress floor numbers in the **union** of those rows and columns: 45 cells form a broad cross. The central 3-by-3 intersection is only one part of that cross. The remaining 36 cells retain ordinary Minesweeper numbers. Three rows and three columns are an example; band widths and positions belong to the authored stage or generation table.

In Roguelite, sample the band positions and row/column counts from the floor seed within difficulty-appropriate bounds. Neither the center, rows/columns 4-6, nor a three-by-three band width is a fixed rule. Counts need not be equal on both axes. Sample mine placement and the remaining floor layout as well, then validate the combined puzzle. Preserve enough ordinary numbered floor and accessible boundaries for the required exchange of deductions. Campaign authors can deliberately fix these choices for a particular stage.

Each selected row receives an edge clue spanning its full width; each selected column receives one spanning its full height. Edge clues describe runs of **mines**, not crystals. Their scope is highlighted when inspected. All clues describe the same mine layout: ordinary numbers still count mines across the information-style boundary, and the selected rows and columns must agree at their intersections. Separate runs have at least one non-mine separator, possibly several; walls are non-mine separators.

The intended deduction sequence deliberately crosses that boundary:

1. Reveal ordinary numbered floor near a band and use its adjacent-mine constraints to establish mines or safe cells at the band's edge.
2. Feed that established information into a full row or column's run constraints, excluding placements and deducing cells farther inside the bands.
3. Use those deductions at row/column intersections and neighboring ordinary clues to continue outward or inward. Both kinds of clue contribute to one puzzle.

Authoring and generation acceptance must include a public-information deduction trace showing this exchange. In particular, an outside numbered clue must constrain a band cell, and that evidence must enable a new deduction from a selected line's run clue. Reject layouts where the intended band can simply be solved independently before consulting the surrounding floor clues, or where crossing between the two clue systems requires guessing. Validate that the resulting safe route and required objectives are physically reachable. Merely hiding floor numbers or displaying redundant edge clues does not meet the mechanic's design goal.

Suppressed numbers must not leak through DOM attributes, accessibility labels, previews, hover, chording or hidden zero expansion. A masked cell does not start ordinary zero-based flood expansion or number-based quick opening. Explicit safe knowledge and legitimate probe/scan information remain usable. Line quick opening follows proven constraints and the expedition's physical reach: reachable targets can be excavated; other inferred-safe cells receive the existing cancellable safe note.

## Combinations are a first-class floor contract

Avoid creating separate monolithic rulesets for every combination, such as `mirrorMatrixTide`. A floor describes its topology, information rules, environment mechanisms and objectives as concrete typed values. Campaign supplies authored layouts; Roguelite supplies generated layouts. Both execute the same exploration and tactical rules.

Examples:

- **Mirror + Matrix:** start on board A and reach stairs on board B; selected lines on either board use edge clues. Cross-board knowledge, local run clues and legal crossing points all contribute to the route.
- **Mirror + Magnetic:** reach a grounding point on the other board before crossing a projected displacement lane.
- **Matrix + Tide:** only admit this combination after rearrangement can atomically move marks, recompute local edge clues and ordinary numbers, and display the changed geometry without stale deductions. Fixed walls, their four orthogonally adjacent mines and the existing anchor constraints remain respected.

A compatibility catalog defines supported combinations, conflicting effects and complexity cost. Two information-hiding rules cannot silently overwrite one another. Automated acceptance validates the final combined floor, including cross-board reachability, clue consistency, safe arrival/crossing positions, required tools and achievable objectives. Transitions that move tiles must also preserve or revalidate those invariants.

Roguelite selection uses a table by difficulty and depth. Early floors mix ordinary boards with one clear special mechanic; later floors draw from validated pairs. Three-way combinations, if added, receive their own acceptance and playtesting rather than inheriting permission from the pair list. Ordinary floors and recovery opportunities remain in the pool to vary pacing. Failure to generate an eligible combination uses a bounded retry and a known-valid fallback.

Every exploration mechanic and supported combination needs seeded procedural generation, including its regions, mine layout, legal entrances/exits, connections and objectives. In a Mirror + Matrix floor, the active bands can vary between boards while cross-board constraints remain valid. A pool of fixed campaign maps is not sufficient roguelite support. Fallback construction must also vary with the seed rather than always returning one fixed map. Acceptance checks a seed corpus for meaningful layout and parameter variation as well as valid puzzles; restoring the same saved floor must reproduce its original layout exactly.

Campaign progress unlocks mechanics and boss families for Recollection's player-selected pool. The unlock schedule should provide useful challenge choices during early chapters rather than withhold the mode's variety until the campaign is complete. Story encounters introduce a mechanic deliberately; Recollection provides concise mechanical help without character dialogue. Special-floor reward budgets reflect actual complexity, objectives and the selected configuration, not a freely multiplying bonus for every attached mechanic.

## Shared rewards and balance

Both activities use the same supplies and catalogs. New rewards include professions, equipment, relic themes, functional titles, camp facilities and chapter-specific collectibles or story outcomes. Shared gameplay unlocks become available in both activities immediately; active departures keep their captured build. A guaranteed mission loan teaches a required tool without forcing a purchase and without masquerading as permanent ownership.

Main tasks offer dependable progression; side tasks offer distinctive equipment, build options or alternate preparation; achievements reward optional mastery. Chapter completion provides a recognizable milestone reward. These are finite authored rewards, not additional infinite stat progression.

Balance the whole reward schedule together: stage loot, first clears, main tasks, side tasks, ordinary tasks, achievements and repeat clears. A boss kill can legitimately advance several distinct tasks, but that combined payout must be included in the expected earnings table. First-clear and claim ledgers are shared and atomic so reloads, retries and switching activities cannot duplicate them. Repeated fixed stages must not outclass difficult roguelite runs as a supply farm. Repeatable counters require actual new progress within the attempt, not alternating movement or repeatedly toggling markers.

## Implementation boundaries

The existing domain separates pure rules, application sessions, persistence and browser presentation. Extend that shape without maintaining parallel copies of the expedition engine:

- A shared camp owner coordinates purchases, claims, both suspended attempts and settlements in one atomic persistent envelope. It prevents one activity from overwriting camp changes made by the other.
- A campaign controller owns the camp/overworld progression, chapter graph, stage selection, task outcomes and story presentation triggers. A Recollection controller owns difficulty, campaign unlock validation, the selected mechanic/boss pool, random floor selection and extraction. Neither owns a separate camp catalog or combat-stat implementation.
- A shared floor model owns board-local cells, cross-board locations, topology, information, mechanisms and objectives. Accepted commands pass through explicit legality, knowledge, movement, mechanism and outcome rules. Presentation consumes public effects and never advances rules on animation completion alone.
- A quest evaluator consumes accepted domain events with activity/stage/attempt identity. Replay restores state without incrementing shared progression a second time. Story objectives and existing milestone metrics share the event source but keep explicit scope.
- Authored chapter content references named stage, floor, task, reward and scene definitions. Contracts live in module-scoped `.d.ts` files with concrete unions and documented functions; no dynamic property bags, conditional-type framework or arbitrary content scripts.

The new persistence envelope retains permanent camp data and independent campaign/roguelite attempts. Incompatible attempts return their checkpointed earnings to the shared camp and retire under the existing save policy. Completed story tasks, claims, purchases and achievements remain. Fixed stage definitions carry content revisions; do not retain historical map engines to replay obsolete attempts.

See [the next chapter content draft](watchtower-chapter.md) for the proposed first playable arc. It is a content draft, not a shipped chapter.

## Delivery order and acceptance

1. Establish the shared camp/attempt ownership, story-task contracts and reusable floor model. Preserve current purchases and claims, then adapt roguelite departures into the camp's configurable Recollection activity.
2. Build authored-floor loading and a complete Bastion chapter: all five main stages plus its boss stage, an objective-gated main route, and a meaningful optional side route. Reuse the gameplay teaching and dialogue presentation in real campaign stages.
3. Add cross-board exploration and local nonogram lines. Deliver each in Campaign and in the roguelite floor pool, then validate their combined Mirror + Matrix floor. This combination is an explicit architecture acceptance case, not an optional future shortcut.
4. Build the remaining chapter mechanics and task branches. Every exploration mechanic ships with both authored placement and generated-floor support; chapter-specific dialogue stays in Campaign.
5. Tune depth/difficulty weights, campaign unlocks, player-selected pools, supported combinations, rewards and chapter pacing from complete playthroughs. Expand late-game combinations only with public-information solvability and interaction coverage for their actual combined state. Continue with later arcs and community contributions rather than treating this program as the completed extent of the game.

Acceptance includes shared equipment effects and one-time claims across both activities; objective-driven route gates; no mandatory-side-task dead ends; exact authored boards; cross-board exits; local clue secrecy; combined-board reachability and deductions; deterministic replay without duplicate rewards; save retirement; and mouse, keyboard, touch, reduced-motion and three-language presentation. Boss dialogue is absent from Roguelite while mechanical animations and help remain available.
