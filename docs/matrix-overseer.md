# Matrix Overseer

The seventh Expedition boss combines ordinary Minesweeper navigation with a small crystal hunt. Clear safe routes, locate hidden crystals in a local observation region, collect two to break a shield, then approach and attack. The boss appears in the seeded checkpoint rotation.

## Two kinds of information

Floor numbers count adjacent **mines**. Zero cells expand normally, and quick-open uses the same neighboring-number rules as ordinary Expedition floors. Marking mines and suspected-safe terrain never charges the boss mechanism.

The **Observe** tool toggles clues along the edges of the highlighted 3 × 3 region on the battlefield. Its row and column runs count **crystals**, independently of mines. A `1 1` clue means two crystal groups separated by at least one cell without a crystal. Crystals occupy safe terrain, but opening their floor tiles does not reveal or collect them.

Each region contains three or four crystals and is uniquely solvable from its local runs. Only the active phase publishes its region and clues. While observing, right-click or long-press a region cell to toggle a crystal-shaped guess instead of a mine flag. Guesses are optional, free and cancellable, and remain hypotheses until extraction.

Press Observe again or Escape to hide the clues and guesses. Reopening restores guesses; changing observation regions clears them. All ordinary mine numbers remain visible on the main board.

## Extract and strike

1. Reveal the chosen safe floor tile. Stand on it or an orthogonal neighbor.
2. Select **Attune**, then the tile, or drag the tool onto it. While observing, clicking a region cell also walks or reveals and then attempts collection, reserving the movement/reveal cost plus 1 AP. A valid attempt costs **1 AP**. Attune is greyed out when AP is exhausted or the shield is already broken, with a custom reason bubble.
3. A crystal is revealed and collected immediately. An empty attempt spends its AP and records the empty location, without bonus damage. Repeating a resolved target, targeting a wall/mine, or targeting outside the active region is blocked without cost.
4. The **second collected crystal immediately breaks the shield**, with a charge beam and shield fracture. Remaining AP can be used to attack. Extra crystals in that region are inert.
5. Melee attacks cost **2 AP** from an orthogonal neighbor of the boss. The shield stays broken until the health boundary; it has no expiry or recharge action.
6. At half health, damage stops. End turn resolves the announced attack and activates the second region. Two more crystals break the final shield.

Only **four extractions** are required across both phases. There is no requirement to flag the entire board, resolve every safe tile, collect every crystal, or wait for a non-quiet turn to extract. Quiet turns allow attunement and attacks.

## Forecasts and builds

A frozen row or column attack aims at the player or the active region. It resolves for **4 raw damage** only at End turn. Every third turn is quiet. A warning that would trap the starting player is shortened or omitted unless there is a revealed safe orthogonal escape. Spending all AP in a newly entered warning remains a tactical risk.

Attack, defense, shields, healing, additional AP and movement discounts use the shared combat rules. Focus lens and Breach sigil can refund AP on the actual shield-breaking extraction, within their existing per-turn/per-floor limits. Probes, scanners and profession reconnaissance reveal **mine** information and establish routes; they do not extract crystals. Archaeologist scouts the current region's center.

Mines and crystal runs do not shuffle between phases. Existing explicit mine-removal abilities retain their ordinary effect; phase changes never invalidate clues.

| Difficulty | Arena   | Mines | Boss health | Base AP / attack |
| ---------- | ------- | ----- | ----------- | ---------------- |
| Relaxed    | 11 × 9  | 19    | 30          | 3 / 5            |
| Standard   | 11 × 9  | 19    | 30          | 3 / 5            |
| Advanced   | 13 × 11 | 27    | 36          | 3 / 5            |
| Expert     | 13 × 11 | 27    | 36          | 3 / 5            |
| Abyss      | 15 × 13 | 37    | 42          | 3 / 5            |

All five difficulties keep the observation puzzle at 3 × 3.

## Generation

An exact mine quota is shuffled outside a random safe opening. The generator varies the entrance, boss position, rocks and two non-overlapping observation regions. Disconnected safe pockets become walls. There is no fixed perimeter, central cross or station arrangement.

The ordinary public-clue solver validates access to all offered crystals and at least two boss approaches. Each phase offers at least two crystals near the boss, reducing forced travel. The small crystal patterns are selected independently from 140 line-solvable oriented layouts with three or four crystals; this count includes rotations and reflections.

Generation uses bounded seeded retries and a validated fallback sequence. The local preview provides **New board** and **Restart this board** separately.

## Progression and saves

- **Break the Matrix:** defeat the boss once; 100 supplies.
- **Perfect Refraction:** win without an empty attunement; 250 supplies and a title giving +1 attack while the Matrix shield is broken.

Existing claims and title ownership remain valid. Expedition rules revision **13** retires incompatible journals through the [camp return policy](save-policy.md), preserving camp progress and banking the recorded extraction value. The old prism resolver and full-board nonogram branches have been removed.

## Implementation and acceptance

Contracts live in `src/types/matrix.d.ts`. Generation, local public knowledge, attunement and combat transitions are pure functions. The session owns accepted-action replay; `MatrixObservation` owns the board-edge clues and observation input state. Generated assets and full prompts are documented in [Matrix artwork](matrix-artwork.md).

Behavioral checks cover all five tiers, connectivity, exact quotas, public solvability, covered-information privacy, normal flood reveal, invalid/repeated/empty extraction, quiet turns, immediate permanent shield breaks, phase boundaries, build refunds and replay settlement. The browser regression is `tests/browser/matrix.mjs`.

A controlled public-information player was run at Standard difficulty, floor 3, with no probes, scans, starting shields or training. Reproduce the measurements with `npm test`, then `node tests/matrix-acceptance.mjs`:

| Seed | Explorer, no equipment/relics | Offensive build | Mobility/defense build |
| ---- | ----------------------------- | --------------- | ---------------------- |
| 6    | 12 turns                      | 9 turns         | 10 turns               |
| 18   | 15 turns                      | 14 turns        | 12 turns               |
| 55   | 17 turns                      | 15 turns        | 14 turns               |
| 111  | 15 turns                      | 14 turns        | 14 turns               |
| 209  | 14 turns                      | 11 turns        | 9 turns                |

The offensive build uses Steel blade, Tempered edge and Duelist edge. The mobility/defense build uses Sentinel, Field boots, Plated vest, Marching boots and Layered armor. The driver uses public mine deductions and local crystal runs, then bounded tactical planning; it does not read hidden identities to choose digs or extractions. Every run collected exactly four crystals. The count includes the final active turn.

These are deterministic acceptance runs, not human completion-time measurements or optimal solutions. The unupgraded results span 12–17 turns against the initial roughly 10–15-turn tuning target; route and build choices still matter. The retained [design record](matrix-overseer-redesign.md) explains the transition.

## Visual feedback

All seven bosses have distinct attack and ground-impact effects, player and boss hit feedback, and object interaction animations. Removed webs, eggs, hatchlings and nests retain transient artwork while tearing or breaking; devices, seals, anchors, hourglasses, sonar and crystals use their own effects. Effects compare accepted public state changes, respect reduced motion and clean up after playback. See `tests/browser/combat-feedback.mjs` and `tests/browser/interaction-feedback.mjs`.
