# Survey

Survey is a standalone mode at `?ruleset=survey`. Ordinary adjacent clues combine with the exact mine total for every row and column. The layout stays fixed after the first safe opening. Its planned Expedition adaptation, Matrix Overseer, is a separate encounter delivery.

## Rules and difficulty

| Preset | Board   | Mines | Density |
| ------ | ------- | ----: | ------: |
| Easy   | 8 × 8   |    10 |   15.6% |
| Medium | 12 × 10 |    24 |   20.0% |
| Expert | 18 × 14 |    60 |   23.8% |

The first square and its surrounding neighborhood are safe. Eligible positions use the existing seeded Fisher–Yates shuffle with exact mine counts and unbiased bounded indices. Blank regions expand normally. Before that first reveal, flags and suspected-safe notes are allowed, but line totals are not available: the opening has not yet determined the layout.

Each edge header shows **placed flags / total mines** for its entire row or column. These are totals, not lengths of consecutive runs. A zero-total line is safe. Subtracting already deduced mines from a total may resolve the rest of the line; combine this information with adjacent clues and crossing lines.

Flags remain player hypotheses. Equal counts receive no correctness badge and never trigger automatic excavation. Over-flagged lines receive a wavy underline, derived solely from the public total and the player's flag count. Suspected-safe notes neither reduce a line's mine total nor count as flags. Incorrect notes or flags can still cause a loss when used to quick-open.

Reveal every safe square to win; hitting a mine loses. Only accepted state-changing board operations count toward the move score. Empty chords, rejected operations, hover, focus, zoom, dialogs, locale changes and pause do not count. Terminal results can be dismissed to inspect the finished board.

## Controls and layout

- Click/tap performs the selected mode: reveal, flag, suspected safe or quick-open. The visible mode button cycles through all four.
- Right-click or stationary touch hold cycles covered → flag → suspected safe → unmarked. On a revealed square it quick-opens using nearby flags and safe notes. A right drag is rejected; touch scrolling cancels pending excavation and holds.
- Arrows/HJKL/Home/End move focus; Enter/Space activate; F flags; S toggles suspected safety; C quick-opens. P pauses, N requests a new board. Active puzzles require confirmation before replacement.
- Hover/focus highlights the relevant row and column and shows their full descriptions. Each grid cell is associated with both headers for assistive technology. No covered-cell mine identity or adjacent clue is rendered.
- Normal sizing fits available space down to a 24px minimum. Dense boards on narrow screens can pan; explicit enlargement gives at least 40px squares. Both axes share the board's tracks and scroll host. Sticky headers retain context during horizontal and vertical panning, and native vertical scrolling can continue to the page.
- Pause/backgrounding covers the board, axis totals and sidebar, and blocks board input. Closing a dialog cannot clear a background-owned pause. Language changes preserve progress. All controls use the shared mute-aware sound adapter.

English, Chinese and Japanese copy lives in the typed locale catalogs. Tailwind utilities own panel presentation; `survey.css` owns board geometry, sticky headers and clue highlighting. No new image or audio dependency is needed for this information mode.

## Architecture and save policy

`game/survey.ts` owns immutable puzzle transitions and the public `surveyLine` projection. It calculates row and column totals only on generation; later transitions retain those observations. The projection reads public totals and cell visibility only, never hidden mine or clue values.

`SurveySession` owns replay, the accepted-action journal and exactly-once win records. `SurveyRepository` validates concrete DTOs through the shared JSON reader and writes only `minesweeper.survey.v1`. Named contracts live in module-scoped `survey.d.ts` and `survey-ui.d.ts`. Input, view and application classes own browser lifetimes separately from game rules.

The version-1 envelope stores difficulty, seed, accepted commands, settlement and records in one atomic write. Reload reconstructs the board and line totals. Invalid or incompatible journals are replaced while separately valid records survive; no older rule engine is retained. A 20,000-action limit bounds replay and always leaves restart available. Unavailable storage is reported while in-memory play continues. Simultaneous tabs use last-write-wins storage, consistent with the other modes.

Keep ten best wins per difficulty, sorted by fewest operations and then record date. These local records are independent of Classic time records, Sonar scans, Twin results and Expedition rewards. Survey awards no camp currency.

## Preset sampling

The first tuning pass uses seeds **0–199** for each preset, always opening index 0. The public-information player in `tests/survey-helpers.ts` applies ordinary all-safe/all-mine and nested adjacent-clue deductions. The comparison enables the same player to also use all-safe/all-mine consequences of whole-line totals. It never guesses, searches hidden layouts or reads covered mine identities.

| Preset | Adjacent clues only: wins / 200 | With line totals: wins / 200 | Boards with more safe squares opened | Mean opening size |
| ------ | ------------------------------: | ---------------------------: | -----------------------------------: | ----------------: |
| Easy   |                             107 |                          195 |                                   90 |            16.920 |
| Medium |                              28 |                          171 |                                  162 |            14.375 |
| Expert |                               4 |                           71 |                                  112 |            12.045 |

Recorded on 2026-09-08 for the presets above. Reproduce with `npm test` followed by `node scripts/sample-survey.mjs`. These figures measure a limited deterministic deduction strategy, not human win rates, a complete solver or a no-guess guarantee. They show that line totals materially change play and that the three presets retain different inference demands. Future difficulty tuning must retire incompatible active journals or advance the envelope version; historical results must retain their original rules.

## Acceptance

Domain coverage includes 300 seeded openings with independently counted row/column totals, hypothesis privacy, safe-note chord loss, pre-opening flags, rejected moves, isolated replay, terminal settlement, malformed/incompatible saves, storage failure, journal limits and a 180-board public-deduction corpus.

`tests/browser/survey.mjs` checks English/Chinese/Japanese at 390px and 1440px: native holds, right-click mark cycles and quick-open, keyboard commands, public headers, reload, confirmation, help, records, modal/privacy interaction, mode switching, all presets and zoom. It additionally checks header alignment and page overflow at 320px, 800px and 3840px, with native touch scroll cancellation on mobile. Screenshots go to ignored `.native/` output. Run against a production preview using `GAME_URL`; `PLAYWRIGHT_MODULE` and `BROWSER_CHANNEL` select the available browser runtime.

The existing native and legacy checks, build A/B workflow and Pages deployment include Survey. No new compiler-performance claim is made by this feature.
