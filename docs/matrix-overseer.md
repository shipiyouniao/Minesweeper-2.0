# Matrix Overseer

The seventh Expedition boss adapts [Survey](survey.md) into a positional fight: solve a line of mines, calibrate its prism, reflect the announced beam, then approach the exposed core. It is a separate boss room in the seeded checkpoint rotation, not a standalone mode or an extra button that skips exploration.

## Read the circuit

The edge clues describe consecutive mine runs. **2 1** means two adjacent mines followed by one mine, with **at least one safe square** between the groups. The gap can contain several safe squares. Walls and the boss pedestal count as safe squares in these clues. Tiles do not disclose adjacent-mine numbers, and opening a blank never flood-fills.

Three numbered prisms operate in order. The active prism highlights its incoming row or column. Account for every square in that line: excavate or survey the safe cells and flag the mines. A matching flag total alone cannot calibrate a circuit. Publicly contradictory flags are underlined in the edge clues; the game never silently turns an ordinary guess into a confirmed mine.

Click or tap a line clue to excavate its deducible safe targets within the current travel/AP budget. Unreachable targets become cancellable suspected-safe notes. C, or right-click/long-press on an open tile, reads both crossing lines. These operations use the same travel, mine damage, shields and tool reactions as ordinary excavation. Wrong flag hypotheses can still lead to a mine.

## Reflect and strike

1. Open the active prism tile and stand on or next to it. Click it to calibrate for **1 AP** while its red incoming beam is present.
2. Calibration turns the beam toward the boss. The mint return path is drawn on the board immediately; it can damage the explorer too. Clear it before ending the turn.
3. End turn resolves the frozen warning and opens the shield for **four full turns**. Approach an orthogonal neighbor of the boss and strike for **2 AP**, using the expedition's actual attack stat.
4. Damage stops at each third of boss health. End turn after breaking that band activates the next prism and shield circuit. All three must be played; burst damage cannot skip them.

Reflection opens the shield but deals no automatic boss damage. If a window expires, the same solved prism can be calibrated again. This prevents a slow build from becoming stuck while retaining a reason to plan travel and attacks. Finishing the boss uses the existing floor reward: full health, up to one additional shield, then the normal relic/extraction dialog.

## Forecast rhythm and balance

Incoming and reflected beams deal **4 raw damage**, resolved once per affected player square even where paths cross. A separate red dashed warning aims a row or column at the explorer's turn-start position. Moving the mouse or walking cannot retarget it. Every third turn is quiet, giving time to excavate a dead end or cross a beam lane. Calibration waits until an incoming beam is present again.

At turn start the forecast retains a one-step escape through revealed or publicly surveyed safe terrain. If a full attack would trap that starting position, it falls back to a smaller warning or rests. This does not protect a later choice to spend all AP in a threatened square. Calibration explicitly changes the optical path, which is visible before committing the turn.

| Difficulty | Arena   | Mines | Boss health | Base AP / attack |
| ---------- | ------- | ----- | ----------- | ---------------- |
| Relaxed    | 11 × 9  | 28    | 30          | 3 / 5            |
| Standard   | 11 × 9  | 28    | 30          | 3 / 5            |
| Advanced   | 13 × 11 | 40    | 36          | 3 / 5            |
| Expert     | 13 × 11 | 40    | 36          | 3 / 5            |
| Abyss      | 15 × 13 | 55    | 42          | 3 / 5            |

The generator shuffles an exact mine set around a connected perimeter, central cross and small starting hub. Unreachable safe pockets become walls. Ordered run clues retain the original mine positions. A bounded sequence of public safe anchors makes line-intersection deduction complete. Approaches to every prism and the boss remain connected; no equipment is required to solve the room.

## Build and progression

Probes and scanners contribute trusted facts to circuit completion. Profession reconnaissance, Sonar, movement skills, shield conversion and excavation retain their normal costs and limits. Attack, defense, extra AP, walking discounts, damage reactions and once-per-floor calibration rewards use the shared combat pipeline. The mine layout and edge clues remain fixed throughout the encounter.

- **Break the Matrix:** defeat the boss once; 100 supplies.
- **Perfect Refraction:** win using exactly three reflections; 250 supplies and a title granting +1 attack while this boss's shield is open.

Expedition rules revision **12** retires incompatible active journals through the [existing camp return policy](save-policy.md). Banked supplies, purchases, titles and records remain intact. No old combat engine is kept for replay compatibility.

## Implementation and acceptance

Named contracts live in `src/types/matrix.d.ts`. Generation, public line reasoning and combat transitions are separate pure modules; the existing expedition session owns journals and effects. Survey's public line solver and measured sticky header styles are reused. The fixed action dock, shared help/sound controls, square tools and keyboard focus behavior remain common to Expedition.

Domain checks cover exact density, complete connected safe terrain, public-only deduction, all five tiers, legal unupgraded three-circuit victories, damage/defense/shields, AP and build rewards, single-cell excavation, line actions and replay. Browser acceptance covers mouse/touch/keyboard actions, three translations, mobile/desktop/4K proportions, header clipping, generated sprites and the visible reflection transition. Reduced motion disables beam pulses and impact flashes without hiding forecasts.

Original generated assets and the complete prompt set are recorded in [Matrix artwork](matrix-artwork.md).
