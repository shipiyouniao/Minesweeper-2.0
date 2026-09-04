# Camp progression: pricing and funding goals

Camp progression is part of [Roadmap #1](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1). The current seventeen purchases are an early batch toward at least 24 distinct gameplay unlocks. Long-term variety comes from professions, equipment, relic combinations and encounters.

## Balance targets and purchase table

The opening should provide immediate choices, the middle should expand builds, and the most expensive single item should require **no more than ten successful Abyss expeditions from zero**, even when every optional chest is skipped. This is a maximum saving target for that item, not a minimum grind for every purchase. Defeats and early extraction are not full clears.

The reference column assumes two of three chests collected per floor, no Treasure pouch and a complete Standard expedition: **375 supplies**. It is a design scenario, not measured player behavior. Early players can instead earn around 200 on a reference Relaxed clear. See the [difficulty reward table](expedition-rewards.md) for guarantees and upper bounds.

| Stage  | Purchase            | Price | Standard reference clears from zero | Purpose                                         |
| ------ | ------------------- | ----: | ----------------------------------: | ----------------------------------------------- |
| Early  | Surveyor            |    40 |                                   1 | Scanning-focused starting role                  |
| Early  | Engineer            |    60 |                                   1 | Shield-focused starting role                    |
| Early  | Surveyor notes      |   100 |                                   1 | Discovery-to-tool relic choices                 |
| Middle | Guardian crests     |   250 |                                   1 | Shield reactions                                |
| Middle | Cartographer charts |   350 |                                   1 | New-ground travel and chest surveying           |
| Middle | Archaeologist       |   450 |                                   2 | Chest scouting and four-choice relic rewards    |
| Middle | Survival charms     |   500 |                                   2 | Recovery and emergency survival                 |
| Middle | Salvager kit        |   650 |                                   2 | Probe recovery and productive scanning          |
| Middle | Alchemist           |   900 |                                   3 | Convert protection into information             |
| Middle | Prospector seals    |   900 |                                   3 | Treasure-oriented tools and protection          |
| Middle | Workshop            | 1,200 |                                   4 | Bounded departure loadouts                      |
| Middle | Mechanist gears     | 1,500 |                                   4 | Career and tool combinations                    |
| Late   | Sentinel            | 1,800 |                                   5 | Spend protection on wide reconnaissance         |
| Late   | Wayfarer tokens     | 2,200 |                                   6 | Combat movement and warning avoidance           |
| Late   | Duelist marks       | 3,200 |                                   9 | Calibration tempo and opening strikes           |
| Late   | Chronologist dials  | 4,500 |                                  12 | AP reservation and delayed tool recovery        |
| Late   | Relic archive       | 7,500 |                                  20 | Additional navigation and salvage relic choices |

The two early roles together cost 100. A reference Relaxed win pays 204, enough for both roles and the first theme. Purchases are optional and may be made in any order. Packs add choices to later reward pools rather than granting their relics immediately.

Abyss completion guarantees at least 783 supplies from its exits and victory reward alone. Therefore the archive takes at most `ceil(7,500 / 783) = 10` successful Abyss clears. The reference two-chest route pays 1,431, giving a six-clear target; the mathematical maximum of 2,200 permits four clears. These calculations assume savings are reserved for that purchase. Spending on other items contributes to total collection time.

All seventeen purchases cost **26,100**. That is nineteen reference Abyss clears or seventy reference Standard clears from zero, before considering failed runs or extra loot. Further catalog batches must fill distinct gameplay roles and be priced against the same income scenarios. Repeated stat levels and cosmetics do not count toward the 24-purchase target.

## Presentation and persistence

The camp shows the next unowned purchase in price order, saved supplies, remaining cost and percentage. It does not predict how many runs the player must complete. The workshop and archive each have a dedicated generated icon. Players may buy any available item; the funding goal imposes no mandatory order.

Existing savings, purchased facilities, completed-run counts and active journals are preserved. Owned items are never charged again. Purchases remain camp-only and atomic. New departures capture their reward revision; historical runs keep their original settlement amounts. See [reward compatibility](expedition-rewards.md).

`camp-progression.ts` owns prices and funding bounds; `expedition-rewards.ts` owns reward constants, difficulty rates and the settlement breakdown. Their explicit contracts live in `.d.ts` modules. The UI consumes derived values instead of maintaining a second currency or duplicating arithmetic.

## Acceptance and tuning

Tests cover actual legal clears in every tier, payout bounds, the ten-clear Abyss affordability guarantee, purchase thresholds, existing ownership, replay and exactly-once settlement. Browser acceptance covers difficulty rates, final base/bonus totals, funding states and all three languages on narrow screens.

Next balance passes should measure completion rate, supplies per minute, chest collection, purchase order and use of each unlock. No playtime estimate is presented as measured data. Boss rewards, new professions or currency-producing relics require revisiting both income and price tables before release.

The [journey and tactical theme table](journey-relics.md) defines all twelve effects, limits and combinations.
