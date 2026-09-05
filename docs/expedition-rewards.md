# Expedition difficulty rewards

> Historical delivery notes: the [current combat table](tactical-builds.md) and [save policy](save-policy.md) supersede older numeric values and replay-compatibility statements below. Only the current expedition implementation is shipped.

Harder expeditions pay more both because they have more floors and because their final settlement receives a difficulty multiplier. The opening balance target is around 200 supplies for a reference Relaxed clear; later tiers increase the reward for larger boards and longer runs.

## Income scenarios

Three explicit scenarios guide pricing:

- **Completion floor:** finish every floor, collect no optional chest, and obtain no currency relic. This is a guaranteed lower bound for a successful clear.
- **Reference route:** finish every floor and collect two chests per floor without Treasure pouch. This is a planning assumption, not a measured average.
- **Theoretical ceiling:** collect every chest and acquire Treasure pouch immediately after floor one. Offers do not guarantee this outcome.

| Difficulty | Floors | Multiplier | Completion floor | Reference route | All chests without pouch | Theoretical ceiling |
| ---------- | -----: | ---------: | ---------------: | --------------: | -----------------------: | ------------------: |
| Relaxed    |      3 |         2× |              132 |             204 |                      240 |                 276 |
| Standard   |      5 |       2.5× |              225 |             375 |                      450 |                 540 |
| Advanced   |      7 |         3× |              342 |             594 |                      720 |                 882 |
| Expert     |      9 |       3.5× |              483 |             861 |                    1,050 |               1,302 |
| Abyss      |     12 |       4.5× |              783 |           1,431 |                    1,755 |               2,200 |

A chest contributes 6 base supplies, or 9 with Treasure pouch. Every exit contributes 12 and victory adds 30. With `F` floors, the base completion floor is `12F + 30`, the reference route is `24F + 30`, and the theoretical ceiling is `60 + 39(F - 1)`. Multiply the relevant base amount by the tier rate and round down once to whole supplies.

The most expensive current purchase costs 7,500: at most ten successful Abyss clears even without chests, six reference clears, or four theoretical-ceiling clears. The cap applies to one reserved purchase; acquiring other items also costs supplies. The [camp table](camp-progression.md) documents each unlock's price and role.

## Settlement rules

Victory adds its base completion reward before scaling. Extraction scales secured loot. Defeat first retains half of secured loot, or three quarters with Salvage seal, rounded down as before; the difficulty multiplier then applies to that retained amount. Unfinished floors do not grant exit rewards, and unfinished runs have no banked settlement.

The game shows the departure multiplier in camp and during exploration. Final results show **base settlement + difficulty bonus = banked supplies**. Board loot remains a base amount until settlement. Rates also apply to extraction and defeat, so an unsuccessful harder run can retain its earned difficulty bonus without receiving unearned floor or victory rewards.

## Versioning and implementation

New `relics-v1` departures capture `rewards: difficulty-v1`. A missing reward revision means the original 1× settlement, including older `relics-v1` runs. Decoders reject unknown revisions and reject the new marker on historical terrain rules. Changing the selected camp difficulty cannot alter an active run's captured rate.

Only departure choices and accepted intents are persisted. The pure reward module reconstructs base, bonus and total; `ExpeditionSession` banks the total and clears the journal atomically. Reload cannot apply the multiplier or grant supplies twice. Existing currency and purchased unlocks remain unchanged.

`src/types/expedition-rewards.d.ts` defines the concrete settlement contract. `expedition-rewards.ts` owns constants, rates and rounding; the progression module uses those same values for affordability bounds. Both compilers test legal clears, terminal outcomes, historical saves, malformed revisions, replay and exactly-once banking.

Future tuning should use observed clear rates, route collection and supplies per minute. This table is the initial authored balance, with explicit assumptions rather than inferred player statistics.
