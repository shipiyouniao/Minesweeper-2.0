# Survey

Survey is a mine nonogram at `?ruleset=survey`: read consecutive mine runs along both axes and excavate the safe ground between them. It has no eight-neighbor numbers and no blank-region flood fill. Every move follows the edge clues, so Classic's local-number strategy cannot bypass the mode's central puzzle.

## Reading the field

Read row clues from left to right and column clues from top to bottom. **2 1** means two adjacent mines, at least one safe square, then one mine. The runs must appear in that order; extra safe space may appear before, between or after them. **0** means an entirely safe line.

The sidebar and interactive gap lesson show the same **2 1** clue with one and three safe squares between its runs. Clues specify the mine runs, not the exact length of each gap.

For example, a run of **3** in five squares always occupies the center, even before its exact position is known. A clue of **2 2** in five squares fits exactly: `mine mine safe mine mine`. Use deductions in one direction to narrow the crossing direction.

Open every safe square to finish. An excavation opens only its target. A mine ends the survey, including an incorrect first excavation: the clues are already visible before the player chooses where to start. The generator verifies a complete deduction path and may publish a few safe starting squares.

Flags and suspected-safe notes are player hypotheses. A wavy red clue means the current flags/open squares cannot fit its ordered runs; this checks public constraints, not concealed mine identities. A finished line fades when all its squares have been accounted for consistently. A locally consistent but incorrect hypothesis can still lead to a mine.

## Difficulty and generation

| Preset | Board   | Mines | Density |
| ------ | ------- | ----: | ------: |
| Easy   | 8 × 8   |    30 |   46.9% |
| Medium | 12 × 10 |    56 |   46.7% |
| Expert | 16 × 14 |   108 |   48.2% |

Difficulty increases through larger intersecting systems rather than extra adjacent-clue assistance. Mine positions use a seeded Fisher–Yates shuffle and an exact count. The generator evaluates at most eight layouts and prefers the one needing the fewest safe starting facts. This selection deliberately biases the final layouts toward deductive play; it is not uniform sampling of all mine fields.

For each layout, a solver enumerates legal placements independently along each row and column. It keeps only cells shared by every legal placement, then propagates those facts across the other axis until no more change. It never guesses or reads the solution. If propagation stalls, generation publishes one previously unresolved safe square and resumes. Each addition decreases the unresolved set, bounding the fallback without an unending retry loop. Fully deriving every square proves the published puzzle has a unique solution. Internal intermediate deductions are not given to the player.

Reproducible sample: seeds **0–199** for every preset, recorded on 2026-09-08.

| Preset | Fully deduced / 200 | Mean starting squares | Maximum starting squares | Mean propagation rounds |
| ------ | ------------------: | --------------------: | -----------------------: | ----------------------: |
| Easy   |                 200 |                 0.005 |                        1 |                    4.84 |
| Medium |                 200 |                 0.055 |                        1 |                    6.79 |
| Expert |                 200 |                 0.375 |                        3 |                    9.40 |

Run `npm test` followed by `node scripts/sample-survey.mjs` to reproduce. The script also reports generation timing on the current machine. One local Node 22 run measured medians of 0.56 / 2.77 / 20.82 ms and 95th percentiles of 3.24 / 10.46 / 59.00 ms. Timing varies with hardware and concurrent work; propagation rounds describe the solver, not human difficulty or play time.

## Controls and shared interface

- The fixed page-bottom action dock uses the same button, mode colors and touch targets as the other modes. Its four actions are Open, Flag, Suspected safe and Quick-open. Difficulty uses Classic's shared segmented control, including board dimensions.
- Click or tap a row/column clue once to quick-open only that line. Keyboard users can focus it and press Enter, Space or C. Touch scrolling cancels activation; repeated clicks on a completed line do not add moves.
- Right-click or a stationary touch hold cycles covered → flag → suspected safe → clear. Right-click/hold an open square to quick-open. Mouse drags are rejected; native touch scrolling cancels the hold.
- Quick-open acts on the selected square's **whole row and column**. A line whose flags already account for its runs can have the remaining squares opened together. Suspected-safe notes on either line are also excavated, even when flags are incomplete. Invalid spacing blocks automatic line completion; mistaken notes remain the player's risk.
- Arrows/HJKL/Home/End move focus, Enter/Space perform the selected action, F flags, S adds a safe note and C quick-opens. P pauses; N requests a new puzzle. Replacing a puzzle after an accepted move requires confirmation.
- The header's How to play opens the shared interactive tutorial. Its isolated 5×5 field teaches overlap, crossing lines, quick-open and the separator between two runs through actual Survey transitions. Practice never changes the live journal or records.
- Row/column headers stay aligned and sticky inside the board's scroll host. Column clues stack vertically and size their header from actual text bounds; row clues read horizontally within the exact cell height. Frame padding stays outside the scroll host, while opaque clue bands cover their gaps during horizontal and vertical panning. Clue type is sized independently of dense board squares. Hover and keyboard focus highlight the crossing lines. Each cell is associated with both clue descriptions for assistive technology.
- Narrow screens can pan the board. The shared magnifier **+ / −** control switches between enlarged touch targets and the fitted board, with synchronized labels and tooltips. The outer scroll surface ends above the fixed dock. Pause/backgrounding covers the clues, board and sidebar. Closing a dialog never clears a background-owned pause.

English, Chinese and Japanese use the centralized typed catalogs. Sound effects and preferences use the existing shared adapters. No new media or runtime dependency is required.

## Architecture and saves

`survey-logic.ts` contains public line-placement inference. `survey-generation.ts` owns seeded layout selection and safe starting facts. `survey.ts` owns immutable play transitions and line presentation data. Annotation transitions reuse the common engine; excavation and quick-open are specific to Survey. No Classic adjacency data is computed or published for this mode.

`SurveySession` owns the accepted-action journal and exactly-once result settlement. `SurveyRepository` validates explicit DTOs and writes the version-2 envelope atomically under the existing `minesweeper.survey.v1` storage namespace. The namespace is stable; the envelope version identifies the current rules. Whole-line quick-open is an additional axis-qualified journal action; existing version-2 actions replay unchanged. Named contracts live in `.d.ts` modules; UI classes own their event, focus and modal lifetimes.

Old Survey rules and their incomparable scores are retired at the persistence boundary. There is no old engine or replay migration. A malformed current journal can retain separately valid current-rule wins. Other modes and camp progress are untouched. Unavailable storage allows in-memory play, and a 20,000-action journal cap leaves restart available. Multiple tabs use last-write-wins storage.

Keep ten best wins per difficulty, sorted by accepted board operations, then date. Rejected moves, empty quick-open, navigation and presentation changes add no moves. Survey does not award camp currency.

## Acceptance

Domain coverage includes an exhaustive independent line-placement oracle up to eight squares, 300 reproducible complete puzzles, exact mine counts/run clues, deduction-only wins, no Classic flood fill, first-excavation loss, public-information privacy, ordered-run contradictions, note-driven quick-open risk, isolated replay, exactly-once wins, save retirement, storage failure and journal bounds.

`tests/browser/survey.mjs` exercises all three languages on mobile and desktop: native holds, right-click cycles, keyboard input, complete interactive lessons, journal isolation, clue privacy, restart/records/modals, mode switching and zoom. It checks fixed dock geometry, shared difficulty selection and header alignment at narrow, tablet, desktop and 4K widths. Run against a production preview using `GAME_URL`; `PLAYWRIGHT_MODULE` and `BROWSER_CHANNEL` select the browser runtime. Screenshots belong in ignored `.native/` output. `tests/browser/survey-lines.mjs` additionally checks shared zoom appearance against Twin, exact-axis excavation, single mouse clicks, native taps and scroll cancellation, keyboard activation, no-op repeats and replay.

The native/legacy checks, build A/B workflow and Pages deployment remain shared with the rest of the application. Survey's planned Expedition adaptation, Matrix Overseer, is a separate encounter delivery.

`tests/browser/survey-layout.mjs` checks text containment, first-row clearance, opaque sticky bands and both-axis clipping at 320px through 4K widths, including enlarged boards and short windows.
