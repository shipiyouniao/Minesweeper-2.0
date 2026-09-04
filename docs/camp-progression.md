# Camp progression: pricing and funding goals

This is the pricing foundation of the **Progression and content** workstream in [Roadmap #1](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1). The full workstream also requires additional professions, relics and intermediate progression content. This delivery does not mark that whole workstream complete.

## A stepped unlock curve

| Stage            | Facility          | Previous price | Current price | Fastest theoretical purchase from zero |
| ---------------- | ----------------- | -------------: | ------------: | -------------------------------------: |
| Early variety    | Surveyor training |             20 |            40 |                                  1 run |
| Early variety    | Engineer training |             20 |            60 |                                  1 run |
| Middle milestone | Workshop          |             30 |         1,200 |                                 3 runs |
| Long-term goal   | Relic archive     |             45 |        10,000 |                                21 runs |

The first two professions cost **100 supplies together**. A successful three-floor Relaxed expedition with all chests collected earns 120 supplies even without the Treasure pouch, enough to buy both and immediately try different roles. This is an achievable first-run opportunity, not a guaranteed reward for every outcome. Players can choose their purchase order.

The workshop adds a medium-term loadout goal. The archive retains the at-least-twenty-run saving target for a late unlock. Early roles deliberately do not share that requirement. Future professions and relic packs should extend this curve with meaningful intermediate choices rather than put every new choice behind the same long wait.

The per-item bounds below start from zero savings. The four original facilities cost 11,300 together. Four [relic themes](relic-packs.md), priced at 100, 250, 500 and 900, now fill the gaps between early roles and larger goals. All eight purchases cost 13,050: at least 27 maximally profitable Abyss runs or 61 Standard runs. Existing savings can shorten any remaining goal.

A floor has three chests. Normal chests pay 6 each; the Treasure pouch raises subsequent chests to 9. Every exit pays 12, and victory adds 30. The pouch can first be acquired **after floor one**. Therefore, for `F` floors:

```text
maximum payout = (3 × 6 + 12) + (F − 1) × (3 × 9 + 12) + 30
               = 60 + 39 × (F − 1)
```

| Tier     | Floors | Theoretical maximum payout | Runs for both early roles (100) | Runs for workshop (1,200) | Runs for archive (10,000) |
| -------- | -----: | -------------------------: | ------------------------------: | ------------------------: | ------------------------: |
| Relaxed  |      3 |                        138 |                               1 |                         9 |                        73 |
| Standard |      5 |                        216 |                               1 |                         6 |                        47 |
| Advanced |      7 |                        294 |                               1 |                         5 |                        35 |
| Expert   |      9 |                        372 |                               1 |                         4 |                        27 |
| Abyss    |     12 |                        489 |                               1 |                         3 |                        21 |

These are optimistic mathematical bounds, **not typical payouts or measured player completion times**. They assume every chest is reached, every floor is completed, and the pouch is offered and selected immediately. Actual saving can take longer. Extraction and defeat retain their existing rules; no payout is capped, scaled down or silently withheld. Difficulty choice still needs human playtesting for earnings per minute, particularly the shorter easy tier. Prices are an initial progression baseline, not a claim of finished balance.

The regression suite checks legal seeded runs across every tier, sequential purchases of both early roles from 100 supplies, progression to the workshop and archive, and the late archive's twenty-run lower bound. Adding more floors or stronger resource-conversion effects must revisit these bounds and the price curve.

## Camp presentation

The camp shows the next unowned facility in price order, saved supplies toward its price, remaining cost, percentage funded and the minimum additional runs at the theoretical 489-supply maximum. This estimate is a lower bound across the released tiers, not a promise for the selected difficulty. Fully funded goals say they are ready to purchase; purchasing remains an explicit button action. Other facility buttons remain available, so the displayed goal does not force a purchase order.

The progress bar is derived from existing supplies. It does not introduce a second currency, reset cycle or fictitious mastery rewards. The complete catalogue state has a concise all-unlocked message. English, Chinese and Japanese have equivalent labels and accessible progress values.

## Existing saves and architectural boundaries

Existing money, purchased facilities, completed-run counts and active journals are preserved. A player who already saved enough currency can purchase immediately; the minimum-run calculation applies to saving a new item's full price from zero. Previously purchased facilities are not charged again or revoked.

Only future camp purchases use the new prices. The pricing change itself leaves rewards and replay outcomes unchanged. The separate theme expansion uses `relics-v1` departures to capture licensed packs while preserving historical journals; see [its persistence rules](relic-packs.md). Purchases remain camp-only and persist through the existing atomic repository write.

`src/game/camp-progression.ts` owns reward constants, prices, payout bounds and derived funding state. Its concrete `CampFunding` contract lives in `src/types/camp-progression.d.ts`. The expedition engine consumes the unchanged reward amounts, while the UI renders funding without duplicating the arithmetic. Behavioral tests cover the bounds, legal full expeditions, purchase thresholds, replay after an old save's purchase, all-unlocked state and translations.
