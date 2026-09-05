# Game modes: design and implementation plan

Every mode in this document is approved for development. The first delivery implements **Expedition** and **Twin boards**. **Sonar**, **Survey**, and **Tides** are planned, not playable menu entries yet. Classic Minesweeper retains its existing difficulties, saves, and records.

Relic Dungeon is part of Expedition, not a separate mode: it describes the multi-floor run, randomized relic choices, and permanent camp progression. With its permanent unlocks, Expedition is a **roguelite**.

## Shared design

- Rulesets and difficulty are separate. The existing `mode` URL parameter still means classic difficulty. The new `ruleset` parameter accepts `classic`, `expedition`, or `twin`.
- All mine placement uses seeded Fisher–Yates shuffling with unbiased bounded indices and exact mine counts. Apply generation constraints before placement; never roll independently for each cell.
- Pure immutable functions own rules and derived information. Session objects own progress/settlement; repositories own serialization; input and view objects own browser event and DOM lifetimes.
- Named contracts live in module-scoped `.d.ts` files. Commands use concrete unions. No business `any`, `unknown`, mapped types, or conditional types.
- Playable modes support English, Chinese, Japanese, keyboard navigation, pointer input, a touch flag toggle, mute-aware procedural sound, responsive boards, and a background privacy cover.
- Covered clues never appear in DOM text or accessibility labels. Paid scans, advertised safe landmarks, and completed-board results intentionally disclose information.
- Each special mode has its own versioned progress and records. Move counts and expedition depth/earnings never enter classic time rankings. Records are local, not an online competitive leaderboard.
- Random boards are **not guaranteed to be solvable without guessing**. A guaranteed safe route proves connectivity, not logical solvability. Tools and extraction help manage uncertainty in Expedition.

## Expedition — implemented

### Complete player loop

Prepare at camp → choose profession/equipment → explore a floor → walk to its stairs → defeat the boss on guarded floors → choose one relic → continue through the selected 3–12 floors → extract, win, or lose → spend banked supplies on permanent unlocks.

[Bastion Guardian](bastion-encounters.md) and [Brood Queen](brood-queen.md) provide separate tactical rooms with three action points, frozen attack forecasts and shared expedition health. The guardian uses shield mechanisms; the queen uses removable webs, hatching eggs and interceptable creatures. Only End turn resolves enemy attacks. New departures snapshot the alternating roster; historical saves retain their original exits or guardian-only encounters.

### Floor rules

- Five difficulty tiers determine board size, density and expedition length; see the [difficulty catalog and replay rules](variant-difficulties.md). Historical runs retain five 9 × 9 floors with 15, 17, 19, 21 and 23 mines.
- Choose the entrance from the interior coordinates using the floor seed. Pick stairs from the farthest reachable cells (within two steps of the maximum distance, and at least six steps away), using actual four-direction floor distance. Neither landmark has a fixed corner or direction.
- The entrance has a safe neighborhood. Reveal its whole connected blank region and the surrounding numbered boundary, following normal eight-neighbor flood fill. At least two exposed cells have positive clues, and elementary deductions must lead to a provable mine. This opening check does not promise a guess-free complete floor.
- Flood the complete safe terrain from the entrance using four directions. Convert every disconnected safe pocket into an impassable wall before placing treasure. Every retained safe floor cell, chest and exit belongs to the entrance component. Mine counts and eight-neighbor clues remain unchanged.
- Every mine must border this component, so no covered hazard is stranded behind walls. Placement tests up to 128 deterministic shuffled candidates against reachability and opening-clue requirements. A finite fallback joins alternating safe rows with a clear spine and supplies a provable opening clue. Exact mine counts remain unchanged; no independent per-cell rolls or fixed diagonal corridor are used.
- A visible explorer starts at the entrance. Clicking revealed floor uses breadth-first search to walk the shortest known safe route. Clicking a highlighted covered frontier first walks to its nearest reachable neighbor, then reveals the destination. Routes never cross walls, flags, mines, or unknown cells. Every mine hit leaves the explorer at the safe approach cell, including a hit survived by spending HP.
- Numbers count all eight neighbors. Ordinary blank-region expansion applies. Diagonally revealed areas do not count as connected until there is an orthogonal route.
- Ordinary blue flags are hypotheses and block walking. Confirmed gold flags from discovery tools or survived mine hits are facts; right-click, F and touch flag mode cannot remove them. Clicking an open number moves the explorer there; it does not chord in Expedition.
- Three advertised safe treasure landmarks encourage detours. Each grants 6 loot when physically visited, once per floor. Revealing a treasure, connecting it, or opening it with a flood/probe does not collect it. A walk collects chests along its path.
- Connecting or remotely revealing the stairs does not leave automatically. Click the stairs and physically arrive to end the floor; there is no sidebar departure button. A frontier reveal that steps onto the stairs also counts as arrival. Each exit grants 12 loot; completing the final configured floor also grants a 30-supply victory bonus.
- Extraction during exploration or relic selection banks all collected loot after confirmation. Defeat retains half, rounded down. A floor not actually exited grants no exit bonus.

### Health and shields

New expeditions start at **2/2 HP**. A mine deals 1 damage, consuming a shield first. Surviving a hit confirms the mine with a locked gold flag; it stays impassable and all clues remain truthful. Reaching each exit restores **1 HP**, capped at maximum health, once per floor. Health and shields carry into the next floor. Zero HP ends the expedition; extraction never heals.

The health bar includes protection in the same readout: **2/2 (+1)** means full health and one shield. Shields do not increase maximum health and remain capped at 2. Damage, shield activation/acquisition and healing have distinct synthesized cues under the existing mute control. See [health design, replay compatibility and validation](expedition-health.md).

### Professions and tools

| Profession | Starting resources        | Unlock              |
| ---------- | ------------------------- | ------------------- |
| Explorer   | 2 probes, 1 scan          | Initially available |
| Surveyor   | 1 probe, 2 scans          | 40 supplies         |
| Engineer   | 1 probe, 1 scan, 1 shield | 60 supplies         |

**Probe:** drag its square inventory button to a cell. Inspect the centered 3×3 neighborhood, clipped at board edges. Every mine receives a locked gold flag, including mines previously flagged by the player. Non-mine cells receive a persistent green safe marker while their clue stays covered; an incorrect ordinary flag there is cleared. Walls are ignored. The player does not move and treasures are not collected. A visible report includes the total mine count, including zero and already confirmed mines.

Repeating an area with no new information consumes no charge. Partially overlapping probes consume one charge when at least one previously unknown covered cell is inspected. Discoveries and confirmed flags reset on the next floor and are reconstructed by replay after a reload.

**Scan:** drag onto a target row, or select the scanner then click a cell in that row. Confirm every mine with a locked gold flag and mark covered safe cells with green dots. Correct false ordinary flags and keep the row's mine count visible. Knowledge is shared with probes and shields; a row with no new information costs no charge. Scanning never moves the explorer, opens safe clues, or collects treasure.

The probe previews a 3×3 square; the scanner previews its entire target row. Keyboard users can select a tool, focus a target with the board keys and activate with Enter/Space; Escape cancels. Off-board drops and targets with no new information consume nothing. Tools never teleport the explorer or award treasure.

**Shield:** intercept a mine reveal, place the same locked gold confirmation flag, and consume one charge. The mine remains; all clues stay correct. A shield cannot turn a mined square into a traversable route.

### Relic build

Four [purchasable theme packs](relic-packs.md) add eight bounded effects to new `relics-v1` runs, for fourteen possible relics. They reward new discoveries, shield reactions, survival and physical chest collection. The sidebar marks consumed floor/run triggers. Historical journals retain the original pool described below: four base relics, or six with the archive.

After each non-final floor, offer up to three distinct unowned relics (up to four for the new Archaeologist). Choose one and enter the next floor. Offers are deterministic for seed/floor; reload cannot reroll. The initial pool contains four relics, so late choices may have fewer than three options. The archive expands it to six. Once the pool is exhausted, continue to the next floor without adding another relic.

| Relic          | Effect                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Lantern        | +1 probe on each subsequent floor entry, including the next one; cap 4                                            |
| Survey lens    | +1 scan on each subsequent floor entry; cap 4                                                                     |
| Aegis          | +1 shield once on acquisition; cap 2                                                                              |
| Treasure pouch | Future treasures grant 9 instead of 6 loot                                                                        |
| Exit compass   | Scout the exit's 3×3 area every floor: reveal safe cells and lock flags on mines; revealed blanks expand normally |
| Salvage seal   | Defeat retains 75% instead of 50% of loot, rounded down                                                           |

Charges/relics carry between floors and disappear when the run ends. Scanned rows and treasure collection reset per floor. Aegis does not regenerate every floor. Exit compass scouting is free and does not move the explorer or collect treasure; stairs require physical arrival.

### Profession skills

[Six professions](profession-skills.md) now each have a once-per-floor active skill. Explorer scouts nearby, Surveyor scouts a column, Engineer repairs shields, Archaeologist scouts chests and expands relic choices, Alchemist converts protection into tools, and Sentinel performs a wide reconnaissance. Each has its own portrait and skill icon. Historical departures keep their original career rules.

### Permanent camp growth

| Facility          | Cost  | Effect                                             |
| ----------------- | ----- | -------------------------------------------------- |
| Surveyor training | 40    | Unlock Surveyor                                    |
| Engineer training | 60    | Unlock Engineer                                    |
| Workshop          | 1,200 | Unlock departure equipment                         |
| Relic archive     | 7,500 | Add Exit compass and Salvage seal to future runs   |
| Archaeologist     | 450   | Unlock chest scouting and up to four relic choices |
| Alchemist         | 900   | Unlock shield-to-tool conversion                   |
| Sentinel          | 1,800 | Unlock shield-funded wide reconnaissance           |
| Surveyor notes    | 100   | Add Field notes and Rangefinder                    |
| Guardian crests   | 250   | Add Reactive shell and Rescue ribbon               |
| Survival charms   | 500   | Add Field dressing and Second wind                 |
| Prospector seals  | 900   | Add Supply cache and Cache guard                   |

Workshop equipment is reusable but constrained by a **three-point departure budget**: extra probe costs 1, extra scan costs 1, extra shield costs 2. Each item can be selected once. Players cannot carry every upgrade simultaneously. Purchases are camp-only, keeping an active run's available catalog stable.

Prices form a stepped curve: both early professions cost 100 supplies together and can be bought after one rewarding expedition; the workshop is a middle milestone; the 7,500-supply archive is affordable within ten successful Abyss clears even without optional chests. New departures receive [difficulty-scaled settlement rewards](expedition-rewards.md), with roughly 200 supplies on the reference Relaxed route. The camp shows savings, remaining cost and percentage. Existing currency and purchased facilities are preserved. See [the pricing model and its limitations](camp-progression.md).

This first progression set is finite. Surplus supplies remain visible after all unlocks but have no additional spending sink yet. Biomes, branching events, and more professions can extend the system later; they are not implemented content. There is no uncapped permanent health upgrade or monetized currency.

### Persistence and acceptance

One expedition envelope contains camp, active departure/action journal, and up to ten recent results per difficulty. Settlement updates camp and clears the journal in **one storage write**, preventing a refresh from awarding the same run twice. Illegal journals are discarded while a separately valid camp in the decoded envelope is retained. The storage key remains stable so existing progression is discoverable. Twin saves remain version 1.

Current expeditions use one rule implementation and version-4 journal envelopes. When rules change, incompatible active expeditions return to camp with their checkpointed extraction value. Formats before version 4 receive a one-time 200-supply compensation. Camp progress and records are preserved; old game engines and count-only scan replay are removed. See [the save policy](save-policy.md).

The inventory begins with one short usage prompt. Selecting a tool replaces it with that tool's description and target coordinates; cancellation or use restores the prompt. Detailed rules belong in help and this document.

Tests also compare shortest paths against an independent coordinate oracle and verify all retained safe cells across 600 generated floors, complete blank expansion, inert walls, area and row targeting, compass scouting, movement replay and older-version migration.

Tests cover exact mines and connected routes across many seeds/all five floors; frontier restrictions; repeat scan/treasure/relic rejection; charge depletion; shield clue preservation; deterministic inter-floor replay; purchases/loadout budgets; extraction/defeat/victory settlement; and unavailable storage.

### Presentation and motion

Classic, Expedition and Twin boards share the same header template, language flyout, help/records entries and icon controls. Help opens in a focus-trapping modal. Expedition uses generated transparent artwork for professions, landmarks, inventory and relic themes; see the [dungeon artwork](dungeon-artwork.md) and [theme artwork](relic-pack-artwork.md) records for exact prompts. Clues, row results and accessible labels remain text. Movement animation is cancelled before pause, backgrounding, language remount or mode disposal; reduced-motion preferences skip animation while retaining identical rules. Resizing reanchors the player to its cell.

## Twin boards — implemented

### Core rule

Two equally sized boards use the selected [difficulty preset](variant-difficulties.md). Historical runs retain 9 × 9 boards with 12 mines each. At a matching coordinate, **at most one** board contains a mine. A logically confirmed mine at A(r,c) guarantees B(r,c) is safe. Both cells can also be safe. Neither a safe cell nor a player flag proves the opposite board contains a mine.

### Generation and interaction

- First reveal on either side selects a shared opening. Exclude its neighborhood from both layouts, shuffle remaining coordinates once, assign the preset mine count to A and the next equally sized slice to B. Open the safe region on both boards together.
- Desktop shows both boards; narrow screens stack them. Focus highlights the partner coordinate without calling it safe or mined.
- Each board uses its own adjacent counts, flags, and ordinary chord behavior. Flags never automatically reveal a partner cell. Players apply cross-board deductions themselves.
- Clear all safe cells on both boards to win. Completing one side exposes its confirmed mines and leaves the other playable. Hitting a mine on either side loses the pair.
- Arrows/Home/End navigate one board; Tab reaches the other; F flags; Enter/Space activate. Touch has a reveal/flag toggle. Replacing an unfinished pair requires confirmation.

### Persistence and acceptance

A separate twin envelope stores the seed, validated actions, settled state, and up to ten recent results per difficulty. Replay reconstructs both boards together. Test exact disjoint mine sets, correct clues, symmetric opening safety, false flag semantics, play after one side completes, paired defeat/full victory, and exactly-once records across reload.

## Sonar — approved, planned

**Identity:** spend limited information to resolve the most valuable uncertainty.

- Start with a classic board and three scan charges. After the first safe opening, choose a cell as the center of a 3 × 3 scan region; clip at board edges. Reveal that region's total mines, including flagged mines.
- Scans do not reveal individual identities or move mines. Keep regions/totals for reference; revisiting an identical scan does not consume another charge.
- Reveal every safe cell to win. Fewer scans breaks ties between equal move counts; results stay in the Sonar namespace.
- UI: region preview, explicit keyboard/touch confirmation, understandable overlapping outlines, remaining charges, persistent scan history, and distinct preview/accepted-scan feedback.
- Initially reuse classic seeded placement. Later difficulty may vary the budget but cannot silently alter a saved game's rules.
- Acceptance: clipped counts, overlapping consistency, no covered-cell leaks, no repeat charges, no scan before generation, deterministic history restoration, and isolated records.

## Survey — approved, planned

**Identity:** combine local adjacency with nonogram-like global constraints.

- Show total mines for each row and column alongside ordinary adjacent clues. These are totals, not runs of consecutive mines.
- Display fixed totals and current player flag counts. Matching a total is bookkeeping, **not proof of correctness**. Never use hidden truth to mark a player's flags correct.
- Reveal every safe cell to win. Layout stays static with a safe opening; row/column totals appear only after generation.
- Tune density/size against the added information using sample puzzles, rather than blindly reusing expert density.
- UI: aligned sticky row/column headers, keyboard associations between cell and totals, mobile layout retaining all constraints.
- Acceptance: total sums equal exact mine count; every cell contributes to one row/column; totals survive reload unchanged; wrong flags leak no correctness; responsive headers stay aligned.

## Tides — approved, planned after solver work

**Identity:** reason about a changing hidden region while every revealed fact remains true.

- Every five accepted **reveal turns**, attempt a tide. Flag changes, navigation, pause and rejected input never advance the counter.
- Preserve exact total mines, all revealed cells' safety, and every revealed clue's adjacent count. Revealed numbers never change. Flags are hypotheses, not solver constraints.
- Explain that hidden identities may change. Show the countdown and announce transitions. Flags remain annotations, but a flagged hidden cell's contents may change.
- Solve the current binary constraints to generate a candidate, using deterministic seed progression and an explicit search budget. If no alternative is found within budget, retain the old layout and state that the tide left it unchanged. Never fall back to unconstrained shuffling.
- Expensive search belongs in a worker. Pause board input during transition. Backgrounding/reload resumes from a coherent pre- or post-tide state. Persist generator version and tide sequence.
- Finding a feasible alternative is not necessarily uniform sampling of all feasible boards. Do not claim uniform randomness without proving that property.
- Acceptance: revealed facts and exact counts remain true after every tide; unique-solution, impossible and timeout cases are explicit; moves cannot race worker results; replay survives tide boundaries; exercise dense/nearly solved/adversarial boards.

Tides is the highest-risk design because its generator preserves a system of constraints. It follows the simpler information modes.

## Delivery order and limits

1. **Delivered:** ruleset routing, separate saves, configurable Expedition/camp progression, Twin boards, localization and regression coverage.
2. **Next:** the [tracked expansion Roadmap](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1), followed by Sonar and Survey with accessible information overlays and independent records.
3. **Then:** Tides constraint solver/worker, replay compatibility and transition feedback.

Saves are local and disappear when browser storage is cleared. They are not an anti-cheat system. One active run per special ruleset is supported; simultaneous edits to one ruleset in multiple tabs use last-write-wins browser storage. Journals are bounded at 20,000 accepted actions to limit recovery work; Expedition can still extract at its limit and Twin can restart. Storage failures are shown while in-memory play continues.

No new compiler performance figures are claimed. Historical TS6/TS7 A/B reports remain tied to their measured commits.
