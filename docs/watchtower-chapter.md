# First chapter draft: the old watchtower

Status: implementation proposal within the approved Roadmap II direction. The northern road, survey/report task, three quarry spaces, spindle retrieval, permanent lift repair and upper tower landing are playable locally; the prepared chapter stages below are not implemented yet. Working names and dialogue are subject to playtesting. This is the first Bastion-family arc, not a replacement with the later Lookout boss.

## Narrative promise

Lumi's lead is real: the watchtower kept arrival records for travelers from elsewhere. Its outer signal stations have failed, cutting off the people who maintained it. The protagonist helps restore the road to consult those records. The guardian protects the archive under an old evacuation order; it does not need to be evil or killed.

The chapter resolves both problems. A supply route reopens, an archivist returns to camp, and the protagonist finds an earlier traveler's signed arrival record with a matching description of the crossing. The next lead is the relay that recorded that crossing. Do not destroy the record or reveal that the entire lead was meaningless merely to extend the story.

## Main route

Each stage is a prepared departure with three authored floors; the boss stage has four. The intervening overworld paths persist and are distinct from these attempts.

| Stage ID         | Working name             | Playable objective                                                                                                     | Persistent outcome                                                                        |
| ---------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `tower-road`     | The unlit road           | Follow safe traces to two roadside signal posts and physically activate both. Reaching the exit alone is insufficient. | The road is known and its lamps work; the lift approach becomes available.                |
| `tower-quarry`   | The abandoned quarry     | Recover a power spindle and carry it to the lift control. A remotely revealed spindle is not collected.                | The repaired lift permanently opens access to the upper trail.                            |
| `tower-stations` | Signals across the ridge | Observe protected passages, disconnect their power and reach the isolated station operator.                            | The operator supplies the archive route and a guardian access record.                     |
| `tower-waterway` | Under the supply bridge  | Reach and secure the flooded maintenance controls from safe ground; activate the two independent sections.             | The maintenance approach opens. Repair persists when returning to camp.                   |
| `tower-archive`  | A name in the ledger     | Reach the records clerk and recover the arrival register from a protected room.                                        | The register is secured; the final guardian route becomes available.                      |
| `tower-guardian` | The keeper's order       | Cross three preparation floors, then disable powered defenses during the established Bastion encounter.                | The guardian stands down; the archive opens and the chapter's homeward lead is delivered. |

The task graph uses named completion, secured-item and mechanism outcomes. Required controls must be reachable with guaranteed starting tools. Optional upgrades and side tasks offer alternatives without becoming hidden mandatory gates. Each floor requires a public-clue solution test before integration.

## Side route

`tower-cartographer`: a stranded surveyor has lost the return markers beside the quarry. Reaching the surveyor and restoring the markers opens a safe return shortcut and brings the surveyor into camp. The side route supplies an alternate preparation opportunity for the guardian, but is not required for victory. It remains available after chapter completion. The permanent reward must be budgeted with first clears and chapter rewards before release; no placeholder currency amount is treated as approved balance.

## Presentation and persistence acceptance

- Introduce power controls in exploration before the boss; use character observations to hint at their behavior, not a rules lecture.
- Accept tasks through finished scene events, then show their title once. Put current instructions and destinations in the task panel.
- Navigation, finished dialogue, delivered items and repaired roads survive travel, reload and failed stage attempts. Dialogue replay must be an explicit player action.
- Campaign departures apply the shared prepared build. The prologue's three teaching hearts are not the chapter's combat system.
- Keep the existing roguelite entrance until a functioning Recollection entrance replaces it.
- Do not mark this chapter complete until all five exploration stages, the boss stage, side route, authored dependency validation and end-to-end save tests exist.

## Approved world integration

Stages are physical places in the persistent overworld. Walk from camp along discovered roads to their entrances; the atlas provides location and prerequisite information without teleporting the player. The five exploration stages and boss stage describe chapter scope, not a numbered stage-selection menu. Task outcomes can open branches, return routes and shortcuts.

Internal floors represent connected spaces such as a loading yard, mine passage and machinery room. Entering an authored stage begins its independent prepared attempt; traveling along established world roads does not reset that attempt or the shared camp. Repairing a lift changes both its appearance and traversability in the overworld. Rescued residents appear at camp and collected objects stay collected.

The atlas has world, region and scene scales. A large scene map displays its complete known extent while the board viewport follows the traveler within it. Unexplored information remains hidden. Buildings and underground floors may load separately. Teleportation remains undecided and is not included.

Permanent discoveries, repairs, quest outcomes and narrative completion belong to world progress; current floor state and carried attempt resources belong to the active stage. Failure cannot erase completed world improvements.

## Local prepared-stage increment

The upper landing now opens **Watchtower outer galleries**, a three-floor prepared exploration attempt. It uses the roguelite profession/tool dock, base 10 HP plus owned build effects, and the shared five-point mine damage rules. Its authored 9×9 boards contain 12, 14 and 15 mines, compared with the relaxed tier's 12–15; mandatory physical supply recovery prevents simply walking to a visible exit. All floors have public-clue, tool-free and damage-free solution tests. Difficulty equivalence beyond these structural baselines still needs human playtesting.

World exploration remains separate and can be resumed while the stage is suspended. Returning through its entrance resumes the exact attempt. First clearance awards 50 supplies once; ordinary roguelite achievements and wins are not farmed by campaign attempts. The full five-stage mechanism graph, guardian stage and Recollection are still outstanding; this increment does not complete the chapter.

The local framed layout has been replaced by `tower-road-v2`: all 81 coordinates are real board space, with no decorative wall ring. Walls are derived from safe cells outside the entrance-connected component, exactly as in roguelite. The first floor now includes a four-step in-place tool/skill lesson. It highlights public targets, adapts to the equipped profession, consumes real charges only on accepted actions, and remembers completion across world travel and reload. Players may dismiss it. Superseded local attempts retire without changing world or roguelite progress.

### Local layout revision

The v3 approach replaces alternating mine/clue rows with staggered clusters, edge hazards, and two caches in different parts of each board. Only the entrance flood is initially visible. Mine counts remain 12/14/15 on 9 by 9 boards. Public-clue traversal verifies all three floors without tools or damage; this establishes solvability, not a final difficulty rating. Prior local v2 attempts retire without changing world or roguelite progress.

The v4 layout gives floor two a north-edge entrance and southwest exit, and floor three a south-edge entrance and northwest exit. Floor one is unchanged, so v3 journals that have not descended migrate with actions and lesson progress intact. Older second/third-floor journals retire instead of replaying on changed terrain.
