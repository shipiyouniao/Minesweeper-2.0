# Title builds

Claiming any achievement unlocks its namesake title and ability. Existing achievement claims already own the corresponding ability. Titles occupy one independent departure slot, cost no loadout points and do not stack. Select one in the styled, scrollable title menu; each option shows its effect before selection. Achievement cards and combat build details show the same description.

Select a title at camp before departure. The expedition sidebar shows the captured title and its effect as read-only information; changing or clearing a title is rejected while a run exists. Return to camp to choose a different title for the next departure. Refreshing, restarting and claiming do not grant an extra title reward.

## Authored abilities

| Title               | Effect                                                                            |
| ------------------- | --------------------------------------------------------------------------------- |
| Untouched bulwark   | Defense +1 while braced.                                                          |
| Beyond the mirror   | Gain 1 shield when entering a boss room, up to 2.                                 |
| Against the clock   | Every third boss turn starts with +1 AP, up to 5.                                 |
| Demolition expert   | Attack +2 while the Magnetic Knight is exposed.                                   |
| Into the nest       | Attack +2 against the Brood Queen while a nest remains.                           |
| Web walker          | Defense +1 in the Brood Queen battle.                                             |
| Master of magnetism | Depart with 1 extra probe, up to 4.                                               |
| Seasoned explorer   | Maximum health +1 for this expedition.                                            |
| Relic curator       | With fewer than 3 relics, reward offers have 1 extra choice, up to 5.             |
| Boss hunter         | Attack +1 against a boss at half health or less.                                  |
| Four legends        | Recover 2 health when entering a boss room.                                       |
| Into the abyss      | Attack +1 while your health is at half or less.                                   |
| Long road           | The first chest each floor restores 1 health.                                     |
| World walker        | The first turn of each boss battle starts with +1 AP, up to 5.                    |
| Treasure vault      | The first two chests of the expedition each grant 1 probe, up to 4.               |
| Treasure legend     | The third chest of the expedition grants 1 scanner, up to 4.                      |
| Skill master        | Completing your profession skill restores 1 health, once per floor.               |
| Skill legend        | Completing your profession skill in battle refunds 1 AP, up to 5; once per floor. |
| Rift pioneer        | Depart with 1 extra scanner, up to 4.                                             |
| Depth legend        | Entering floors 4 and 7 each adds 1 maximum health and restores 1 health.         |
| Relic museum        | With 3 or more relics, reward offers have 1 extra choice, up to 5.                |
| Abyss veteran       | Defense +1 while your health is at one third or less.                             |

The first-turn and every-third-turn AP abilities apply to all five boss families. Armor reduces enemy attacks only; mines still deal five damage. Specialist attack bonuses do not bypass armor, nests, seals, objectives or exposure requirements. Conditional stats appear in the existing attack/defense/AP counters. AP remains capped at five, tools at four each, shields at two. Healing cannot exceed maximum health.

Relic choice bonuses add a candidate only when enough unlocked, unowned relics remain. They never grant two relics or unlock an unavailable pool. Curator favors the first three selections; Museum favors an established build. The Archaeologist can see at most five candidates.

Treasure abilities count physically collected chests, including those on an approach path. Revealing a chest is not collection. The first-chest floor guard survives entering a boss arena and switching mirrored rooms. The two-probe and third-chest scanner bonuses are expedition-wide; a full inventory consumes that chest opportunity without exceeding the cap. Skills trigger only when completed: Waymark placement, rejected commands, repeat uses and lethal actions do not grant healing or AP. An exploration skill consumes that floor's skill opportunity before its boss room.

## Architecture and persistence

`titles.d.ts` defines an explicit 22-member `TitleId` union and a small replay-derived progress contract. `title-effects.ts` owns pure title conditions and event reactions; `ExpeditionSession` snapshots the selected license. Combat stats derive from the immutable departure and current public battle conditions. Treasure and skill reactions run at their accepted transition boundaries. The two replay counters have fixed meanings: at most three counted chests and a first-chest guard reset only on floor descent.

Rules revision **9** retires older expeditions with checkpointed extraction. Camp money, purchases, claims and records remain intact; no older title or reward engine is retained. Invalid or unowned current titles cannot be replayed.

## Acceptance

Domain coverage includes all 22 licenses and translations, departure freeze, ownership tampering, revision-eight retirement, bounded starting tools and health growth, specialist conditions, all five AP resolvers, explicit boss entry, relic choice stages, physical chest limits and skill refunds. A discovered Mirror Twins turn-budget error is fixed: AP is calculated from the incoming turn, so boots and title conditions use the correct turn number.

`tests/browser/title-builds.mjs` exercises the actual menu, reward descriptions, health effect, camp-only title changes and read-only title effects during play, reload and subsequent departure in all three languages with mouse, keyboard and touch. The layout suite covers the longer scrolling options and run statistics from 320px to 4K.

## Matrix title

**Perfect Refraction** joins the 25-title catalog: defeat Matrix Overseer without an empty attunement. Equipping it grants +1 attack while that boss’s shield is open. Its one-time claim pays 250 supplies; it grants no repeatable currency bonus. Echo Warden also contributes Silent Footsteps (+1 defense at full health) and Perfect Pitch (+1 attack against its exposed core).
