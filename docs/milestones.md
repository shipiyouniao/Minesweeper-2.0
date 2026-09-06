# Missions and achievements

All five expedition difficulties are selectable on the camp overview. The Missions and Achievements pages show goals, cumulative progress, full reward effects and a one-time claim button. Completed entries stay visible after claiming. Progress persists after defeat or extraction; there are no daily deadlines or repeatable permanent-stat rewards.

## First reward catalog

| Kind        | Goal                                 | Supplies | Additional unlock               |
| ----------- | ------------------------------------ | -------: | ------------------------------- |
| Mission     | Walk 20 new safe squares             |      120 | —                               |
| Mission     | Collect 3 chests                     |      250 | Surveyor profession             |
| Mission     | Successfully use 3 profession skills |      350 | Workshop                        |
| Mission     | Clear 5 floors                       |      600 | Exclusive Field radio equipment |
| Mission     | Defeat 1 boss                        |      800 | Engineer profession             |
| Achievement | Win 3 expeditions                    |    1,200 | Exclusive Trail heart relic     |
| Achievement | Acquire 8 different relics           |    1,500 | Exclusive Survey token relic    |
| Achievement | Defeat 10 bosses                     |    2,500 | Battle manual                   |
| Achievement | Defeat all 4 boss families           |    3,000 | Sentinel profession             |
| Achievement | Win on Abyss                         |    5,000 | Archaeologist profession        |

These are generous, finite authored rewards, not measured final economy tuning. An already-owned profession/facility is never duplicated or removed; its paired supply reward still pays once. Claims add supplies directly, without a second difficulty multiplier. Unlocks are usable through existing profession, Workshop and relic-offer flows.

- **Field radio:** mission-only license, absent from the shop. Costs 1 of the existing 3 loadout points and requires the Workshop. A successful profession skill restores 1 probe, capped at 4; the skill remains once per floor, including its boss room. Rejected skills do not restore probes.
- **Trail heart:** achievement-only relic. The first chest collected each floor grants 1 shield, capped at 2.
- **Survey token:** achievement-only relic. Confirming 5 distinct mines in a floor grants 1 probe and 1 scan, each capped at 4, once per floor. Ordinary guessed flags do not count.

Claimed relics join future expeditions' reward pools; they are not equipped immediately or inserted into active runs. Their order is fixed for seeded offers. The actual selected relic must be acquired before its effect works. The initial maximum pool grows from 29 to 31 relics; the shop still has 26 purchases. Existing six professions remain unchanged.

## Persistence and counting

`milestones.ts` defines the finite catalog, counters, claim rules and reward ownership. `ExpeditionSession` advances counters only after accepted actions, atomically writing camp progress with the updated journal or terminal settlement. Replaying a journal restores gameplay without advancing counters again. Claims are camp-only and commit currency, unlocks and the claim marker in one save value. Returning from a result never pays twice.

Travel counts newly visited squares within each floor, including mirrored rooms and forced movement, but not backtracking. Chests count physical collection; relics count unique acquired IDs, not offers. Boss kills count a completed encounter, not an armor break or one twin. Victories count completed expeditions, with an additional Abyss counter. Each run can contribute; starting or retreating alone grants no progress.

Camp progress is additive to the version-4 envelope. Old camps retain money, purchases and completed-run totals; only those existing victory totals can be backfilled. Unrecorded past floors, bosses and discoveries are not invented. Invalid new counter fields are recovered independently from valid money and ownership, and valid claim IDs are retained to prevent paying the same reward twice. Rule revision **7** retires incompatible active journals using the existing checkpointed extraction policy. New departures snapshot unlocked milestone relics and verify all exclusive equipment/relic ownership when loading.

## Acceptance and future content

Behavioral tests cover actual accepted runs, journal reload, settlement, claims, malformed progress, ownership gates, bounded equipment/relic effects and translations. Browser tests cover difficulty on the overview, reward previews, keyboard/touch claims, saved selection and layout at 320–3840 CSS pixels in English, Chinese and Japanese.

Exclusive reward professions remain on [Roadmap #1](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1). Their skills must introduce positioning, terrain or turn-sequencing decisions rather than more tool-A-for-tool-B conversions. Candidate directions include a placed return anchor, temporary passage or delayed action echo; each needs distinct rules, original artwork, clear limits and acceptance before release.
