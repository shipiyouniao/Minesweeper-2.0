# Missions and achievements

All five expedition difficulties are selectable on the camp overview. The Missions and Achievements pages show goals, cumulative progress, full reward effects and a one-time claim button. Completed entries stay visible after claiming. Progress persists after defeat or extraction; there are no daily deadlines or repeatable permanent-stat rewards.

## Expanded reward catalog: 15 missions and 15 achievements

| Kind        | Goal                                 | Supplies | Additional unlock               |
| ----------- | ------------------------------------ | -------: | ------------------------------- |
| Mission     | Walk 20 new safe squares             |      120 | —                               |
| Mission     | Collect 3 chests                     |      250 | Exclusive Chest beacon relic    |
| Mission     | Successfully use 3 profession skills |      350 | Exclusive Pulse coil relic      |
| Mission     | Clear 5 floors                       |      600 | Exclusive Field radio equipment |
| Mission     | Defeat 1 boss                        |      800 | Exclusive Last bastion relic    |
| Achievement | Win 3 expeditions                    |    1,200 | Exclusive Trail heart relic     |
| Achievement | Acquire 8 different relics           |    1,500 | Exclusive Survey token relic    |
| Achievement | Defeat 10 bosses                     |    2,500 | Exclusive Hunter seal relic     |
| Achievement | Defeat any 4 boss families           |    3,000 | Exclusive Fault map relic       |
| Achievement | Win on Abyss                         |    5,000 | Exclusive Abyss hourglass relic |
| Mission     | Trail apprentice: 60 travel          |      250 | —                               |
| Mission     | Trail guide: 150 travel              |      500 | —                               |
| Mission     | Cache runner: 10 chests              |      650 | —                               |
| Mission     | Cache seeker: 25 chests              |    1,000 | —                               |
| Mission     | Skill student: 10 skills             |      700 | —                               |
| Mission     | Skill adept: 25 skills               |    1,100 | —                               |
| Mission     | Return route: 12 floors              |      900 | Exclusive Waymarker profession  |
| Mission     | Deep descent: 25 floors              |    1,400 | —                               |
| Mission     | Boss challenger: 3 bosses            |    1,200 | —                               |
| Mission     | Homeward bound: 1 win                |    1,000 | —                               |
| Achievement | Long road: 500 travel                |    1,600 | —                               |
| Achievement | World walker: 1500 travel            |    3,500 | —                               |
| Achievement | Treasure vault: 75 chests            |    2,200 | —                               |
| Achievement | Treasure legend: 200 chests          |    4,500 | —                               |
| Achievement | Skill master: 75 skills              |    2,400 | —                               |
| Achievement | Skill legend: 200 skills             |    5,000 | —                               |
| Achievement | Rift pioneer: 50 floors              |    3,000 | Exclusive Riftwalker profession |
| Achievement | Depth legend: 150 floors             |    6,000 | —                               |
| Achievement | Relic museum: 20 relics              |    4,000 | —                               |
| Achievement | Abyss veteran: 5 abyssWins           |    8,000 | —                               |

These are generous, finite authored rewards, not measured final economy tuning. Non-currency rewards are exclusive new content, never an old shop profession or facility. Players who claimed the first catalog retain their old purchases/unlocks and automatically own the replacement relic license through the unchanged claim ID, with no repeated supply payout. Claims add supplies directly, without a second difficulty multiplier. Exclusive careers are selectable after claiming their own license. Field radio still requires a purchased Workshop; task claims no longer grant that old facility.

- **Field radio:** mission-only license, absent from the shop. Costs 1 of the existing 3 loadout points and requires the Workshop. A successful profession skill restores 1 probe, capped at 4; the skill remains once per floor, including its boss room. Rejected skills do not restore probes.
- **Trail heart:** achievement-only relic. The first chest collected each floor grants 1 shield, capped at 2.
- **Chest beacon:** collecting a chest scouts the next uncollected chest’s 3×3 area, once per floor; never remotely collects it.
- **Pulse coil:** completing a skill scouts the landing row once per floor; anchor placement does not activate it.
- **Last bastion:** surviving health damage at 2 HP or less sets shields to 2, once per expedition; never revives.
- **Hunter seal:** confirming 8 distinct mines in a floor restores exactly 2 HP, capped at maximum, once per floor.
- **Fault map:** confirming 4 distinct mines in a floor scouts the exit’s 3×3 area once; never bypasses the guardian.
- **Abyss hourglass:** a lethal hit revives at 3 HP and scouts the player’s 3×3 once per expedition; Second wind has priority and preserves this charge.
- **Survey token:** achievement-only relic. Confirming 5 distinct mines in a floor grants 1 probe and 1 scan, each capped at 4, once per floor. Ordinary guessed flags do not count.

Claimed relics join future expeditions' reward pools; they are not equipped immediately or inserted into active runs. Their order is fixed for seeded offers. The actual selected relic must be acquired before its effect works. The maximum pool is 37 relics; the shop still has 26 purchases. The original six professions remain unchanged and two [reward professions](reward-professions.md) expand the roster to eight.

## Persistence and counting

`milestones.ts` defines the finite catalog, counters, claim rules and reward ownership. `ExpeditionSession` advances counters only after accepted actions, atomically writing camp progress with the updated journal or terminal settlement. Replaying a journal restores gameplay without advancing counters again. Claims are camp-only and commit currency, unlocks and the claim marker in one save value. Returning from a result never pays twice.

Travel counts newly visited squares within each floor, including mirrored rooms and forced movement, but not backtracking. Chests count physical collection; relics count unique acquired IDs, not offers. Boss kills count a completed encounter, not an armor break or one twin. Victories count completed expeditions, with an additional Abyss counter. Each run can contribute; starting or retreating alone grants no progress.

Camp progress is additive to the version-4 envelope. Old camps retain money, purchases and completed-run totals; only those existing victory totals can be backfilled. Unrecorded past floors, bosses and discoveries are not invented. Invalid new counter fields are recovered independently from valid money and ownership, and valid claim IDs are retained to prevent paying the same reward twice. The original milestone release introduced rule revision **7**. This expansion remains additive: existing revision-7 departure snapshots retain their exact reward pool and can replay without retirement. New departures snapshot unlocked milestone relics and verify all exclusive equipment/relic ownership when loading.

## Acceptance and future content

Behavioral tests cover actual accepted runs, journal reload, settlement, claims, malformed progress, ownership gates, bounded equipment/relic effects and translations. Browser tests cover difficulty on the overview, reward previews, keyboard/touch claims, saved selection and layout at 320–3840 CSS pixels in English, Chinese and Japanese.

Two exclusive reward professions now ship in this expansion: Waymarker and Riftwalker. Their [skill rules, unlocks and original artwork](reward-professions.md) introduce placement, return and temporary path choices instead of tool conversion. Further content remains tracked in [Roadmap #1](https://github.com/shipiyouniao/Minesweeper-2.0/issues/1).
