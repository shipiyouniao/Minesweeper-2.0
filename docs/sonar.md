# Sonar

Sonar is a standalone information puzzle, available at `?ruleset=sonar`. It shares the Classic mine-placement and reveal engine while owning its own rules, action journal and rankings. Its Expedition boss adaptation is a separate planned delivery.

## Rules

| Preset | Board   | Mines | Starting pulses |
| ------ | ------- | ----: | --------------: |
| Easy   | 9 × 9   |    10 |               3 |
| Medium | 16 × 16 |    40 |               3 |
| Expert | 30 × 16 |    99 |               3 |

The first revealed square and its eight neighbors are safe. Placement uses the existing seeded, unbiased Fisher–Yates shuffle and remains fixed thereafter. Ordinary puzzles are not guaranteed to be solvable without guessing; most nonzero revealed clues are obscured until scanned. Roughly one in four positions retains its ordinary clue; blank zero cells remain readable.

A scan is available after opening the board. Choose a center and measure its clipped 3 × 3 region, including the center. The result counts **all physical mines** in that region, including player-flagged mines. It opens only the center square, replacing any guess there; a mine becomes a locked gold flag without exploding. Neighboring cells remain unchanged. Zero is a valid reading and spends a pulse. Each new center consumes one pulse and opens and permanently clarifies only its center; surrounding clues remain obscured. Start with three pulses and earn one per four successful safe excavation actions. Flood expansion counts once per action, not per cell. Repeated clicks, flags and scans never recharge. Credits may accumulate; the finite board bounds the total; revisiting an identical center selects its existing reading without spending or appending a journal action, including after all pulses have been used.

Reveal all safe cells to win. A mine hit ends this standalone puzzle. Accepted reveal/flag/safe-note/quick-open commands count as board moves; paid scans are recorded separately. Rejected actions, hovering, changing the selected history entry, zoom, pause, language changes and dialogs count as neither.

## Comparing observations

The log keeps every reading with a numbered, colored region. Select up to two readings to display together; selecting a third replaces the oldest selection. Solid, dashed and dotted borders reinforce their numbered identities.

For regions A and B, their common squares cancel:

`mines(A only) − mines(B only) = reading(A) − reading(B)`

For example, readings 3 and 2 imply one more mine in A's exclusive region than in B's exclusive region. The comparison shows this signed difference and the shared/exclusive cell counts. It uses region geometry and already published totals only. It never consults hidden cells to certify a player's flags or make an automatic deduction. Disjoint regions also have a valid difference, with zero common squares.

## Input and presentation

- Mouse/touch: select the pulse instrument, then select a center. Hover or touch/focus previews the geometric region. The bottom instrument strip shows the latest result even when the mobile history panel is below the board.
- Keyboard: Q toggles aiming; arrows/HJKL/Home/End move the focus; Enter/Space confirms; Escape cancels. F flags, S toggles suspected safety and C quick-opens. P pauses; N requests a fresh board.
- Right-click or a stationary touch hold cycles flag → suspected safe → unmarked; on a revealed square it quick-opens. A right drag is canceled through the shared board-right-click adapter. Touch swipes cancel pending actions and remain native scrolling gestures. Holding while aiming confirms the pulse on release rather than producing a flag.
- A distinct synthesized ping and an expanding radial wave accompany a new reading. Navigation, recall, cancellation and rejected scans have separate mute-aware feedback. Audio never encodes hidden mine identities. The vector instrument and wave are original code-native assets matching the existing line-icon system; no external raster asset or audio download is required.
- Reduced motion retains the static region outlines and readings. Pause/backgrounding stops the wave and hides both the board and its observations. Modal Escape does not remove a background-owned pause. Language remount and mode disposal cancel pending gestures and animations.
- Cells fit the available width down to their supported minimum size. Explicit enlargement provides bigger targets and horizontal panning; vertical scrolling remains available over the board.

## Architecture and persistence

`game/sonar.ts` owns immutable actions, clipped regions and public overlap arithmetic. `SonarSession` owns accepted-action replay and exactly-once results. `SonarRepository` shape-checks its finite DTOs through the existing JSON reader and atomically writes `minesweeper.sonar.v1`; it cannot write Classic, Twin or Expedition slots. Contracts live in `sonar.d.ts` and `sonar-ui.d.ts`.

The envelope contains a format version, fixed difficulty/seed, accepted actions, terminal settlement flag and records. Restoration regenerates the board and each paid reading instead of trusting stored mine totals. Invalid or incompatible active puzzles are replaced while separately valid Sonar records are retained. No old gameplay engine is kept. Journals are bounded at 20,000 actions; restart remains available at the limit. Browser storage failure is reported while in-memory play continues.

Winning records rank by fewest board moves, then fewest pulses, retaining ten per preset. They are local records, not anti-cheat evidence or Classic time rankings. Losses remain replayable terminal boards but do not enter the win table. Progress and a new winning record commit in the same write, so reload cannot settle again. Mode changes retain each mode's separate progress. Simultaneous browser tabs use last-write-wins storage, as the other modes do.

## Acceptance

Domain tests cover coordinate-oracle clipped counts across 120 shuffled layouts, zero readings, duplicate/invalid/depleted scans, false flags and safe notes, immutable cells, public-only overlap subtraction, deterministic replay, exactly-once wins, loss behavior, malformed/incompatible journals, ranking order, the action bound and storage failures.

`tests/browser/sonar.mjs` exercises the real production bundle in English, Chinese and Japanese at mobile/desktop widths: instrument selection, keyboard targeting/cancellation, native touch holds, readout/overlay state, depleted recall, modal/privacy ownership, mode switching, reload and every preset. Visual checks include 4K. The existing compiler and Pages workflows also build Sonar; historical compiler benchmark figures retain their original measured commits.

The header now opens an opt-in interactive tutorial instead of the former help sheet. Practice covers obscured clues, scanning, reading a revealed number and flagging a proven mine; mouse, touch and keyboard share the same transitions. Obscured clues have neither their numeric text nor numeric metadata in the DOM. Chording an obscured clue is rejected by the rules, including keyboard and secondary actions.

Save envelope version 2 retires old active journals when loaded, preserving recorded wins. The storage namespace remains unchanged. Replaying a v2 journal reconstructs credits and clarified centers; no derived clue or charge totals are trusted from storage.
