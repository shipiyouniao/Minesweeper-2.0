# Purchasable relic themes

> Historical delivery notes: the [current combat table](tactical-builds.md) and [save policy](save-policy.md) supersede older numeric values and replay-compatibility statements below. Only the current expedition implementation is shipped.

Ten theme licenses now provide twenty expansion effects, for seventeen camp purchases and a complete twenty-six-relic pool. This document records the original four themes; the remaining six are specified in [Journey and tactical relics](journey-relics.md). Seven gameplay purchases remain toward the minimum of twenty-four in [Roadmap #1](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1).

## Purchases

| Theme            | Price | Relics                        | Play style                              |
| ---------------- | ----: | ----------------------------- | --------------------------------------- |
| Surveyor notes   |   100 | Field notes, Rangefinder      | Turn fresh discoveries into tools       |
| Guardian crests  |   250 | Reactive shell, Rescue ribbon | Protection and reconnaissance           |
| Survival charms  |   500 | Field dressing, Second wind   | Recovery and emergency survival         |
| Prospector seals |   900 | Supply cache, Cache guard     | Visit treasure for tools and protection |

Buying a theme permanently adds two choices to **future departures' reward pools**. It grants neither relic immediately and does not guarantee an offer. Between floors, players still select one of up to three distinct unowned relics. Themes do not require the workshop. The first rewarding expedition can buy both early roles for 100 supplies or choose the first theme instead.

The seventeen-item catalog costs 26,100 supplies. The current [difficulty reward table](expedition-rewards.md) gives nineteen reference Abyss clears or seventy reference Standard clears from zero. The most expensive item is affordable within ten successful Abyss clears even without optional treasure. These are authored scenarios and bounds, not measured playtimes; prices and reward-pool dilution still need playtesting.

## Effects

| Relic          | Trigger                                                                 | Benefit                                         | Limit                                |
| -------------- | ----------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------ |
| Field notes    | A fresh discovery brings the floor's confirmed mine count to at least 3 | +1 probe                                        | Once per floor; cap 4                |
| Rangefinder    | One probe confirms at least 2 new mines                                 | +1 scan                                         | Once per floor; cap 4                |
| Reactive shell | A shield absorbs a mine hit                                             | Inspect the hit mine's clipped 3×3 neighborhood | Once per floor                       |
| Rescue ribbon  | Health damage is survived without revival                               | +1 shield                                       | Once per expedition; cap 2           |
| Field dressing | Collect the first chest on a floor                                      | Heal 1 HP                                       | Once per floor; maximum HP unchanged |
| Second wind    | A hit would reduce HP to zero                                           | Remain at 1 HP                                  | Once per expedition                  |
| Supply cache   | Collect the first chest on a floor                                      | +1 scan                                         | Once per floor; cap 4                |
| Cache guard    | Collect all three chests on a floor                                     | +1 shield                                       | Once per floor; cap 2                |

The first eligible trigger consumes its allowance even if its benefit is capped. Returning to a chest, toggling flags, repeating a scan or probing known information cannot pay again. Badges show **Used this floor** or **Used this expedition**. Descending resets floor allowances and retains spent expedition allowances. Effects activate after selecting their relic and entering the next floor.

Discovered mines use locked gold flags; triggered hazards keep locked red mine markers, including shielded hits. Their mine status and clues remain unchanged. Reactive shell does not move the player, collect remote treasure or reveal all safe tiles. Second wind prevents the loss transition before hidden mines can be exposed; the hit mine remains impassable. Revival does not also activate Rescue ribbon.

Chest benefits apply on physical collection, including along an approach path, before a later mine hit on that route. Revealing a chest alone does not collect it. Shield reconnaissance can produce discoveries for Field notes. Each reaction is claimed before it creates information, preventing repeated rewards. None of the new effects creates currency.

## Persistence and architecture

New departures use **`relics-v1`** and snapshot owned themes in deterministic catalog order. Historical journals retain their original reward-pool order, terrain and health behavior. Purchases are camp-only; existing currency and facilities are preserved.

Decoders accept finite IDs, reject duplicate/oversized theme lists, require a difficulty for the new revision, and reject theme fields on historical journals. Session recovery also checks that captured themes are owned. Only intents are stored: trigger claims, health, charges, offers and discoveries are rebuilt by replay.

`src/types/relic-packs.d.ts` owns the contracts. `relic-packs.ts` owns catalog membership and versioned pools; `relic-effects.ts` owns pure, bounded reactions; the expedition engine places them at mine, chest and discovery transitions. `ExpeditionSession` handles authorization and atomic persistence. UI modules present the resulting state and localized explanations.

Tests cover purchases, migration, authorization, seeded offers, replay, caps, repeated discoveries, shield inspection, chest benefits and one-time survival. Browser acceptance covers buying a theme, selecting its relic, triggering a probe refund, locked flags, reload and all three locales at 320px. See [the artwork record](relic-pack-artwork.md) for images and exact prompts.

[Bastion encounters](bastion-encounters.md) share Second wind and Rescue ribbon with exploration. Reactive shell remains mine-specific. Entering combat preserves once-per-floor and once-per-run claims.
