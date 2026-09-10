# Opening route: an unanswered promise

The opening now leads from a personal question into a concrete rescue lead. Lumi pulled the protagonist away from a knot, but she is also waiting for Nia, who promised to return from the watchtower before dark. The optional satchel identifies its absent owner; the empty stool, a single light from the tower, and its evacuation notice develop that lead before the prepared stages begin. These are playable draft scenes, open to feedback rather than a settled ending for the project.

## Playable sequence

| Location             | Player action                                                                             | What changes                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Awakening and forest | Learn real clues, flags, connected reveals and movement; optionally recover Nia's satchel | Reach a safe camp and learn who has not returned                                      |
| Camp                 | Speak to Lumi and prepare with the shared workshop/loadout                                | Receive the map and agree to search together                                          |
| Northern road        | Reach and inspect the broken lift                                                         | Finish the survey on site for 20 supplies; the quarry lead follows immediately        |
| Loading yard         | Isolate hazards around the brake, then physically operate it                              | Secure the load and release the passage barrier                                       |
| Quarry passage       | Find a safe route through the existing mine clues                                         | Reach the machine room                                                                |
| Machine room         | Isolate and operate the winch, then physically collect the intact shaft                   | Release the guard and load the haul route                                             |
| Haul track and lift  | Use the southern track, then install the shaft at the lift                                | Return directly to the lift; restoration opens the upper landing                      |
| Tower landing        | Inspect the evacuation notice                                                             | Connect Nia's absence to the guardian's address rule and enter the prepared galleries |

Reporting to camp is optional after discovery and cannot award another survey payout. Returning through the quarry entrances remains possible; the haul track adds a physical one-way shortcut from the machine room. A map marker is still an information control, not teleportation. The shaft is collected by movement, never by revealing its tile remotely.

## Mechanisms and presentation

The brake and winch show ordinary eight-neighbor mine clues. Their controls require matching flags and revealed safe neighbors, followed by an explicit reachable operation. `clue-isolation.ts` supplies the public-information readiness rule shared with expedition relays. Hidden hazard values do not decide readiness.

Closed guards are visible, impassable terrain and stop zero expansion. Operation opens only the safe gate and retains its actual clue; it neither changes hazards nor reveals the next room. Controls use the established Bastion pylon/core assets. The pylon turns, the barrier flashes and lowers, then dialogue resumes. The haul departure animates the traveler before switching scenes. Keyboard, click and touch use the same accepted action; reduced motion skips only presentation.

The new dialogue remains short, voiced and skippable line by line. Lumi helps with machinery and reacts to its consequences, rather than merely issuing the next destination. The later signal rescue remains the payoff: Nia returns to camp and comments on the optional record.

## Persistence and checks

World content revision 2 records a bounded `operated` list per scene. Gates remain open through visits, reloads and a retry. The decoder rejects invented controls and player positions inside closed gates. Existing incompatible active worlds retire once to camp with 200 supplies, keeping purchases, claimed tasks, campaign entries and the independent roguelite. Camp access is established without minting a second arrival reward. Inactive retired worlds receive no compensation; no old terrain engine is retained.

The accompanying fix for PR #60 preserves completed signal dialogue when a player retreats or loses and starts another attempt. Attempt-local cells and inventory still reset normally.

Behavior checks cover public-clue solvability without damage, physical operation, blocking/flood boundaries, save restoration and retirement, survey payout and the haul connection. `tests/browser/story-front.mjs` starts with an empty browser context and traverses the prologue, camp, northern road and quarry to the prepared campaign entrance at 390px and 1440px in all three languages. It uses actual touch holds and keyboard operation, checks gate animation and reloads opened mechanisms.

This changes the opening's pacing and establishes a stronger motive; it does not complete the five-plus-one chapter or replace the remaining authored stages.
