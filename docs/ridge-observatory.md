# Ridge Observatory

The third prepared stage of the watchtower chapter follows **An Answer in the Tower**. Finish Nia's camp conversation to accept **Locate the homeward beacon**, then walk to the telescope sign on the southern turn of the North Road. The stage has three authored floors and a once-only 100-supply clear reward. The optional record from stage two changes Nia's directions; either rescue outcome can reach this stage.

## Playable sequence

| Floor            | Board   | Routing problem                                                                                                         | Outcome                                                                                               |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| The split supply | 11 × 9  | One selector powers either the instrument's gate or the exit gate. Record the reading before switching away.            | The beacon is still transmitting; its first bearing is recorded.                                      |
| The upper relay  | 11 × 13 | A second selector depends on the first. Keep the upstream supply connected while routing the upper instrument and exit. | A second measurement narrows the search; Nia explains why the stations are locked.                    |
| Two bearings     | 13 × 12 | Record the western instrument, reroute to a downstream selector, record the eastern instrument, then power the exit.    | Locate the beacon beneath the watchtower beside the old water channel; preserve a recognizable sound. |

Numbers on device cells retain the ordinary eight-neighbor Minesweeper meaning. Reveal a control's safe neighbors and flag its mines, then click again to walk over and operate it. A selector's first operation requires its clue to be isolated; later visits can switch it freely. An instrument requires both power and an isolated clue when recording. Neither flags nor tools operate a device remotely.

Each selector has a visible number and **A / B** outputs. Doors and instruments show the label of their upstream branch. One branch is energized at a time; loss of upstream power also stops its downstream selectors. Their selected positions are retained for when power returns. Recorded observations remain complete when a branch loses power. The floor exit requires all readings.

Gates change traversability without moving hazards or recalculating their numbers. Opening a gate reveals its safe doorway, leaving the next room to ordinary exploration. The player walks to the selector before a change commits, so a closing branch cannot strand the operator inside a closed door. Ordinary movement, flag cycling, quick-open, probing, skills and health rules continue to apply.

## Story and presentation

Nia accompanies the measurement work through voiced exchanges. The protagonist asks direct questions about the broken station and reacts to a sound they recognize from before waking in the woods. The result is a marked location and a recording, not another item that must be delivered to collect the stage reward.

The atlas preserves the beacon location after clearance. Nia's subsequent camp conversation and the ending both offer a **Listen to the beacon** button. The recording is an original synthesized three-note cue and follows the shared mute preference. Selector turns, downstream power changes and instrument readings animate after accepted interactions. Dialogue uses the existing chibi cast, distinct voices, typewriter controls and reduced-motion behavior.

The water-channel entrance is **not playable yet**. This delivery completes three of the chapter's five planned exploration stages; two exploration stages and the concluding boss stage remain.

## Ownership and persistence

- `FloorPower` owns selectors, branch dependencies, gates and recorded receivers. Its pure rules depend on the expedition board and public clues, not story scripts or stage IDs.
- `observatory-layout.ts` supplies explicit terrain and power networks. There is no random or hidden-answer fallback when a layout stalls.
- The campaign catalog owns stage identity, prerequisites, reward, length and maximum authored dimensions. Journal decoding uses these bounds; replay still validates every action against its actual floor.
- The campaign slot is `ridge-observatory`, with content revision `ridge-observatory-v1`. Completed performances survive retries; active terrain and readings rebuild from accepted intents. Interrupted endings recover from permanent clearance without repeating rewards.
- The shared camp owns the route task, wallet and later conversation. The stage's task has no additional currency reward: its 100 supplies settle with first clearance. Existing purchases, loadouts, titles, earlier stages, story world and the independent roguelite journal remain intact.
- No global world or expedition rules revision is changed by adding this stage. A future incompatible authored revision still follows the established retirement/write-protection policy.

The power component is reusable by other floor providers. Procedural placement and its inclusion in configurable Recollection are **not shipped** in this increment; they need a generator that validates dependency accessibility and solvability, plus the campaign unlock system in Roadmap II.

## Validation

`tests/observatory-helpers.ts` provides a public-information solution: it uses visible clue deductions and the published routing labels, never hidden mine bits to choose an excavation. Both compiler suites exercise all three floors, ordinary damage rules, closed-gate rejection, safe connectivity, truthful clues, rerouting, persistent readings and per-action journal restoration. Session tests cover prerequisite gates, prior-stage/roguelite preservation, one-time settlement, retry dialogue and future-version write protection.

`tests/browser/observatory.mjs` traverses Nia's camp conversation and the real stage entrance, then solves the stage through browser controls at desktop and phone sizes. It covers right-click and touch-hold flags, tap/click operation, mid-run reload, interrupted ending, camp recording and atlas result. English and Japanese receive entry/device checks. The normal-motion keyboard path and audio/mute checks use the same presentation and input owners.

The original instrument asset and generation prompt are recorded in [Story artwork](story-artwork.md). The full chapter remains tracked in [Roadmap II](https://github.com/shipiyouniao/minefarer/issues/55).
