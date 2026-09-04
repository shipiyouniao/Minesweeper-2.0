# Six professions and floor skills

Expedition professions offer different ways to manage uncertainty. Ordinary floors remain free exploration. Each skill is an explicit, replayable action that can succeed **once per floor**. There is no real-time cooldown. All six professions have their own board portrait and a separate generated skill icon.

## Roster and tradeoffs

All professions start with 2/2 HP. These resources precede optional workshop equipment.

| Profession    | Unlock | Probes | Scans | Shields | Skill                                                                                                     | Intended decision                                                              |
| ------------- | -----: | -----: | ----: | ------: | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Explorer      |   Free |      2 |     1 |       0 | Trail light: confirm the character's 3×3 neighborhood                                                     | Reach a useful frontier before spending the free scout                         |
| Surveyor      |     40 |      1 |     2 |       0 | Column survey: confirm the character's entire column                                                      | Combine a column skill with row scanners at a useful intersection              |
| Engineer      |     60 |      1 |     1 |       1 | Field repair: spend one scan for one shield                                                               | Trade information for protection before a risky reveal                         |
| Archaeologist |    450 |      1 |     0 |       0 | Excavate: scout the nearest uncollected chest's 3×3 neighborhood; offer up to four relic choices at exits | Trade starting tools for treasure routes and more control over the relic build |
| Alchemist     |    900 |      0 |     0 |       2 | Transmute: spend one shield for one probe and one scan                                                    | Keep protection or convert it into information; prioritize regeneration relics |
| Sentinel      |  1,800 |      1 |     0 |       1 | Watchtower: spend one shield to confirm the character's 5×5 neighborhood                                  | Position the pawn to maximize a costly wide-area scout                         |

The new roles are more expensive than introductory training, but remain below the archive. From zero, the authored Standard reference income of 375 supplies funds them in **2 / 3 / 5 full clears**; the Abyss reference income of 1,431 funds them in **1 / 1 / 2 clears**. These are planning scenarios, not measured player averages. Players may buy them in any order, without workshop prerequisites. Existing savings and ownership are retained.

Six professions, four theme packs, Workshop and Archive make **11 purchases** totaling **13,700 supplies**. At least thirteen further gameplay purchases remain toward Roadmap #1's 24-item minimum. The most expensive item remains the 7,500 archive, affordable within ten successful Abyss clears even without chests. See [camp progression](camp-progression.md) and [reward scenarios](expedition-rewards.md).

## Exact skill rules

- Explorer, Surveyor and Sentinel confirm mines with locked gold flags and safe cells with green dots. Safe clues remain covered. False ordinary flags are cleared. Square footprints clip at edges; columns never wrap.
- Footprints originate at the visible character, independent of the keyboard cursor. Move through known safe terrain before using a position-dependent skill. No skill moves the character, collects a chest, claims an exit, or grants currency.
- Archaeologist chooses the uncollected chest with the smallest Manhattan distance from the character, breaking ties by cell index. This is geometric distance, not the length of a discovered walking route. It reveals safe cells in the chest's 3×3 neighborhood and confirms mines. Revealed blanks expand normally. Previously surveyed safe clues can still be opened. A nearby chest whose entire neighborhood is already exposed gives no new information: collect it to retarget the next chest. Physical arrival is always required for collection.
- Archaeologist receives up to four distinct unowned relic offers instead of three. It does not increase the reward pool or grant a second relic. An exhausted pool keeps the normal continue option. Offers remain seeded and cannot be rerolled by refreshing.
- Engineer requires a scan and fewer than two shields. Alchemist requires a shield and room in **both** tool pools below their cap of four; partial or wasted conversions are rejected. Sentinel requires a shield and new information. Resource conversion does not count as damage and cannot trigger mine-hit relics.
- No new information, missing resources, a capped output, an already used skill, or an inactive phase leaves the state and action count unchanged. Successful use advances the move count once, sets the floor's used marker, and never resets until a new floor is entered.
- New mine confirmations can activate Field notes. A career skill is not a paid probe, so it does not activate Rangefinder. The skill cannot trigger chest-collection relics remotely. Existing one-shot relic claims remain bounded.
- Alchemist already starts at the shield cap, so the camp disables Guard equipment for that role. Switching from another role preserves compatible equipment and removes an incompatible Guard; the visible equipment budget updates immediately. Other roles keep the three-point equipment budget.

## Interface

The camp shows six profession cards and the selected profession's skill explanation. During exploration, a square skill button sits beside its name, effect and short availability message in the inventory sidebar. It uses ordinary button keyboard activation, touch and pointer input, with mute-aware feedback. Using a skill cancels any selected probe/scanner and its target outline. The button becomes unavailable after successful use; its text explains that it refreshes next floor. English, Chinese and Japanese use the same rule data.

## Rules, persistence and architecture

New departures retain the existing `relics-v1` terrain/relic rules and `difficulty-v1` rewards, and additionally snapshot `professions: "skills-v1"`. The independent marker avoids changing past offers or inputs. Departures without this marker keep their historical starting tools and three-option offer behavior, have no skill UI and cannot execute a skill intent. Only the new revision accepts the three new roles. Unknown revisions or a skill revision on incompatible terrain rules are rejected at the storage boundary.

`Profession`, `ProfessionResources` and `SkillAvailability` are concrete contracts in `.d.ts` modules. `professions.ts` owns starting allocations and the revision gate. `profession-skills.ts` owns footprints, public eligibility and pure skill transitions. `ExpeditionSession` captures legal departure choices, replays accepted intents and settles money atomically. The view owns no skill charges: `skillUsed` is reconstructed from the action journal, reset by floor creation, and never trusted from serialized state.

Invalid repeated skill intents invalidate the active journal without charging or deleting camp ownership. Replay also checks that a new role was purchased. Historical valid saves remain usable and receive the new skill rules on their next departure.

## Acceptance

Behavior coverage exercises every profession on all five difficulty tiers, clipped square/column footprints, locked flags, false-flag correction, unchanged mine/clue layout, resource caps, no-op actions, chest scouting without remote payment, four-choice offers, skill reset, relic interactions, old/new revision decoding, unauthorized roles, duplicate journal actions, reload and exactly-once settlement. Browser acceptance covers new purchases, all six role sprites and skills, incompatible equipment switching, selected-tool cancellation, native keyboard activation, three locales and narrow layouts.

Boss rooms and the remaining equipment licenses are separate Roadmap deliveries. These exploration skills are complete playable mechanics; they do not introduce a partial combat interface or promise that every future boss uses identical action costs.
