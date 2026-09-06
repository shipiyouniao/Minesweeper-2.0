# Clock Mage · Clepsydra

The fifth Expedition boss uses frozen deadlines, a first-strike echo and optional spell returns. New departures rotate Bastion, Brood, Mirror, Magnetic and Clock from `seed % 5`, advancing at each difficulty's existing checkpoint. Health, checkpoint rewards and the shared build scale remain unchanged. Clock health is `20 + tier.health * 2` (28/28/32/32/36 across the five difficulties).

## Rules

- On odd turns, the mage marks the player's current square and its orthogonal neighbors. The mark resolves after **two explicit end-turn actions**, for 3 base damage. Moving does not retarget it.
- At half health, the same casting beat also announces a row or column through the current player, resolving after **three** end-turn actions. Each spell has a stable visible ID. Overlapping hostile hits add before ordinary defense, brace, shields and revival.
- A new candidate must have a sequence of revealed walking routes that avoids every pending deadline. Time-expanded reachability uses current AP, future turn-specific AP, ordinary walking edges and existing rifts. It does not assume tools, a particular profession, hidden safe cells, optional movement discounts or refunds. If needed, a new footprint shrinks to its center; if that also fails, that new spell is omitted. Existing forecasts never silently change. This guarantees a route at announcement, not immunity after the player spends their escape AP or deliberately enters danger.
- At each turn start, a walkable echo remains at the player's starting square. The first accepted direct attack records half its actual damage, rounded down with a minimum of 1. At turn end the echo follows up regardless of subsequent movement. Further attacks do not add another echo; it does not activate attack, skill or item triggers again.
- Three numbered hourglasses start covered. Reveal one and stand on it or beside it; click to return the earliest hostile spell for 1 AP (deadline then ID order). No flag calibration is required. Each glass is used once and remains walkable. A spent glass, missing hostile spell, unrevealed target or unaffordable action cannot consume AP or advance the turn.
- Returned spells retain their deadlines, target only the mage and deal 6 damage each. A hit prevents new casting during the following turn; other already announced spells keep their deadlines. The mage can always be attacked, so glasses are optional.
- Resolution order is hostile spells, then returned spells, then echo. A lethal player hit cancels both follow-ups. A surviving follow-up can kill the mage and passes through the normal exactly-once floor reward and healing pipeline.
- Mines and clue numbers never move, rewind or explode in this encounter. The fixed central boss has a protected safe bypass ring. Echoes and glasses never occupy walking space.

## Integration and presentation

`clock-generation.ts` preserves exact shuffled mine counts and rejects arenas whose safe terrain is disconnected or cannot be solved from public clues. The initial zero opening cannot already expose an attack neighbor. Three covered numbered glasses and a fixed central boss remain visually identifiable without revealing hidden clue values.

`clock-forecast.ts` owns forecast generation and public time-expanded reachability. `clock-battle.ts` owns end-turn resolution; `ClockEncounter` has an explicit `.d.ts` contract. Shared plans, walking, profession scouting, damage reactions and progression remain authoritative.

The board shows simultaneous deadline badges without replacing clue numbers. The queue lists the spell ID, damage and exact end-turn deadline, plus pending and last-turn echo damage. Returned spells have an arrow badge; spent glasses and recovery/defeat have distinct states. Board-native impact rings cover both spell and echo resolution, respecting reduced motion. Turn controls sit directly above the board. English, Chinese and Japanese include the complete rules and accessible cell labels.

## Saves and progression

Encounter rotation changes replay, so the rules revision is **8**. The existing retirement policy banks incompatible active journals' saved extraction checkpoints and returns them to camp; permanent currency, unlocks, claims and boss records remain. No historical engine is retained. Clock kills count toward boss tasks and distinct-family progress. Four legends still requires any four distinct families, preserving its target and all prior claims.

## Acceptance

Domain coverage includes exact mines, truthful clues and publicly solvable central bypass arenas across 60 tier/seed pairs; all-tier baseline victories without tools, profession skills or hourglasses; frozen deadlines; insufficient AP and repeated interaction; spell return and recovery; first-strike echo after retreat; fatal-hit precedence; victory settlement; and public escape fallback. Full expedition regression covers the five-family rotation and journal replay. The magnetic test player now exhausts deductions after new flags and uses the full withdrawal turn instead of incorrectly requiring an off-route activation square.

`tests/browser/clock.mjs` checks actual journals and browser input in all three languages, 320/390/1440 widths, asset loading, keyboard activation, deadline reload, returned spell state, echo damage, dual forecasts and victory reload. Screenshots are emitted under `.native/clock-ui/`. Human balance feedback remains open; automated victories are not measured human win rates.

Original assets and prompts: [Clock artwork](clock-artwork.md).
