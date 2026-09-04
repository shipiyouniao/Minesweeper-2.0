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

Prepare at camp → choose profession/equipment → explore a floor → connect its exit → choose one relic → continue through five floors → extract, win, or lose → spend banked supplies on permanent unlocks.

### Floor rules

- Five 9 × 9 floors, with exactly 15, 17, 19, 21, and 23 mines respectively.
- Entrance at top-left, exit at bottom-right; both safe. Reserve a hidden orthogonal route before shuffling remaining eligible positions for mines. The entrance has a safe opening neighborhood.
- There is no separate avatar. The expedition occupies revealed safe cells connected to the entrance by **orthogonal** steps. Only a covered cell bordering this region can be revealed. Highlight that frontier.
- Numbers count all eight neighbors. Ordinary blank-region expansion applies. Diagonally revealed areas do not count as connected until there is an orthogonal route.
- Flags are hypotheses. Clicking an open number does not chord in Expedition, preventing a click from bypassing the frontier restriction.
- Three advertised safe treasure landmarks encourage detours. Each grants 6 loot when connected to the entrance, once per floor. Revealing an isolated treasure does not collect it. Opening floods may collect connected treasures.
- Connecting the exit does not leave automatically: explore further or explicitly **Take the exit**. Each exit grants 12 loot; completing the fifth floor also grants a 30-supply victory bonus.
- Extraction during exploration or relic selection banks all collected loot after confirmation. Defeat retains half, rounded down. A floor not actually exited grants no exit bonus.

### Professions and tools

| Profession | Starting resources        | Unlock              |
| ---------- | ------------------------- | ------------------- |
| Explorer   | 2 probes, 1 scan          | Initially available |
| Surveyor   | 1 probe, 2 scans          | 20 supplies         |
| Engineer   | 1 probe, 1 scan, 1 shield | 20 supplies         |

**Probe:** reveal one safe, unflagged frontier cell. Consume a charge only when an eligible safe cell exists. This is explicitly an information aid, not a logical deduction claimed by the engine.

**Scan:** reveal the total mines in the selected cell's row, including flagged mines. Keep the row/result visible for this floor. Re-scanning a known row is rejected without charge consumption.

**Shield:** intercept a mine reveal, flag it, and consume one charge. The mine remains; all clues stay correct. A shield cannot turn a mined square into a traversable route.

### Relic build

After each of floors 1–4, offer up to three distinct unowned relics. Choose one and enter the next floor. Offers are deterministic for seed/floor; reload cannot reroll. The initial pool contains four relics, so late choices may have fewer than three options. The archive expands it to six.

| Relic          | Effect                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Lantern        | +1 probe on each subsequent floor entry, including the next one; cap 4 |
| Survey lens    | +1 scan on each subsequent floor entry; cap 4                          |
| Aegis          | +1 shield once on acquisition; cap 2                                   |
| Treasure pouch | Future treasures grant 9 instead of 6 loot                             |
| Exit compass   | Reveal the safe exit each new floor; still requires a connected route  |
| Salvage seal   | Defeat retains 75% instead of 50% of loot, rounded down                |

Charges/relics carry between floors and disappear when the run ends. Scanned rows and treasure collection reset per floor. Aegis does not regenerate every floor.

### Permanent camp growth

| Facility          | Cost | Effect                                           |
| ----------------- | ---- | ------------------------------------------------ |
| Surveyor training | 20   | Unlock Surveyor                                  |
| Engineer training | 20   | Unlock Engineer                                  |
| Workshop          | 30   | Unlock departure equipment                       |
| Relic archive     | 45   | Add Exit compass and Salvage seal to future runs |

Workshop equipment is reusable but constrained by a **three-point departure budget**: extra probe costs 1, extra scan costs 1, extra shield costs 2. Each item can be selected once. Players cannot carry every upgrade simultaneously. Purchases are camp-only, keeping an active run's available catalog stable.

This first progression set is finite. Surplus supplies remain visible after all unlocks but have no additional spending sink yet. Biomes, branching events, and more professions can extend the system later; they are not implemented content. There is no uncapped permanent health upgrade or monetized currency.

### Persistence and acceptance

One expedition envelope contains camp, active departure/action journal, and ten recent results. Settlement updates camp and clears the journal in **one storage write**, preventing a refresh from awarding the same run twice. Illegal journals are discarded while a separately valid camp in the decoded envelope is retained. Structurally incompatible envelopes trigger a visible recovery notice.

Tests cover exact mines and connected routes across many seeds/all five floors; frontier restrictions; repeat scan/treasure/relic rejection; charge depletion; shield clue preservation; deterministic inter-floor replay; purchases/loadout budgets; extraction/defeat/victory settlement; and unavailable storage.

## Twin boards — implemented

### Core rule

Two 9 × 9 boards each contain 12 mines. At a matching coordinate, **at most one** board contains a mine. A logically confirmed mine at A(r,c) guarantees B(r,c) is safe. Both cells can also be safe. Neither a safe cell nor a player flag proves the opposite board contains a mine.

### Generation and interaction

- First reveal on either side selects a shared opening. Exclude its neighborhood from both layouts, shuffle remaining coordinates once, assign the first 12 positions to A and the next 12 to B. Open the safe region on both boards together.
- Desktop shows both boards; narrow screens stack them. Focus highlights the partner coordinate without calling it safe or mined.
- Each board uses its own adjacent counts, flags, and ordinary chord behavior. Flags never automatically reveal a partner cell. Players apply cross-board deductions themselves.
- Clear all safe cells on both boards to win. Completing one side exposes its confirmed mines and leaves the other playable. Hitting a mine on either side loses the pair.
- Arrows/Home/End navigate one board; Tab reaches the other; F flags; Enter/Space activate. Touch has a reveal/flag toggle. Replacing an unfinished pair requires confirmation.

### Persistence and acceptance

A separate twin envelope stores the seed, validated actions, settled state, and ten recent results. Replay reconstructs both boards together. Test exact disjoint mine sets, correct clues, symmetric opening safety, false flag semantics, play after one side completes, paired defeat/full victory, and exactly-once records across reload.

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

1. **Delivered:** ruleset routing, separate saves, five-floor Expedition/camp progression, Twin boards, localization and regression coverage.
2. **Next:** Sonar and Survey with accessible information overlays and independent records.
3. **Then:** Tides constraint solver/worker, replay compatibility and transition feedback.

Saves are local and disappear when browser storage is cleared. They are not an anti-cheat system. One active run per special ruleset is supported; simultaneous edits to one ruleset in multiple tabs use last-write-wins browser storage. Journals are bounded at 20,000 accepted actions to limit recovery work; Expedition can still extract at its limit and Twin can restart. Storage failures are shown while in-memory play continues.

No new compiler performance figures are claimed. Historical TS6/TS7 A/B reports remain tied to their measured commits.
