# Knocking in the old mine

`quarry-rescue` is Chapter One's independent optional side story. Its entrance is the minecart in the east of Quarry Yard, available after discovering the lift and before clearing any prepared main stage. It remains available after the guardian. Leaving the branch preserves its own attempt; returning to the main route does not require finishing it.

Toma, a miner with a sprained ankle, calls for help by knocking on a pipe. The player clears and operates the old haul route, then brings him out in a cart. His conversations use a distinct voice, chibi portrait and the shared typewriter controls. After rescue he appears at camp and unlocks the exclusive Rescuer profession in the shared camp roster.

## Three authored puzzles

| Floor                 | Board   | Mines | Routing problem                                                                                                                     |
| --------------------- | ------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| The turnout           | 15 × 15 | 32    | Read the track's ordinary clues, reject the mined branch and drive onto the brake platform.                                         |
| The two brake latches | 17 × 15 | 36    | Open the first gate, reverse and return through the turnout, then choose the safe branch to the second latch.                       |
| Bring him home        | 17 × 17 | 45    | Use the long detour to reach Toma. Set the return turnout too: loading him does not complete the floor until the cart reaches home. |

The fixed boards are literal content, not runtime random seeds or rotations of one puzzle. Every safe cell is connected when the latches are open. The automated public-clue solution makes 277 accepted actions across three floors, without equipment, scans or guessed mines. That is solvability evidence, not a measured human completion time. The long-term 30–40-hour campaign target still requires later chapters and additional substantive content.

## Cart rules

- Tracks are public geometry, not safe-cell marks. Alternate track segments can contain ordinary mines, counted by the same neighboring numbers as all other mines.
- A winch pulls the cart across already revealed safe track. It stops before a covered tile, flag or obstacle, and at every turnout, station or buffer. The green preview uses the same public-information rule as movement.
- Click the forward winch, reverse winch or turnout on the board, or use its corresponding button. The player walks to the actual control. Revealing a covered control and operating it are separate inputs. Mouse, touch and keyboard all dispatch the same journaled `interact` command.
- A turnout joins its stem to A or B. A returning cart leaves either branch through the stem. To change branches, reverse through the stem and approach again; do not expect a sideways jump between branches.
- Brake platforms latch permanently. Their numbered doors reveal only their own doorway when opened. Reversing the cart cannot close a gate behind the player.
- The last floor's home station requires the passenger stop first. Toma boards on arrival; the cart must then make the return journey.

The four-step illustrated guide is available beside the controls. It uses the same generated winch, lever and brake props as the board and buttons. Cart movement follows its accepted path; turnouts animate and both actions have sound. The closed exit opens when every required stop is complete. Reduced motion skips these effects without delaying accepted outcomes. Board scroll clipping, normal zoom controls and the fixed bottom action dock remain shared.

## Ownership and rewards

First completion credits **120 supplies**, grants the story-exclusive Rescuer license, records `toma-rescued`, and completes the side task in one save transaction. The Rescuer cannot be purchased. Its Lifeline moves along a revealed safe corridor and grants one shield, once per floor. Previously completed saves receive the license without another payment; existing Engineer ownership remains unchanged. See [the profession and first-battle design](first-battle-and-rescuer.md).

Toma remains a speaking camp resident. The stage does not gate the lift, any main dungeon, or the guardian. Main stages and the paused roguelite retain their own journals, records and outcomes. Campaign and roguelite share the resulting wallet and profession roster.

The new stage has its own content identity, `quarry-rescue-v1`. Existing stage layouts and accepted expedition actions retain their behavior, so this additive release does not retire those attempts. Rail state is reconstructed from authored data and accepted intents; there is no serialized hidden board or obsolete cart implementation to maintain.

## Verification and extension

`tests/rail-rescue.test.ts` verifies full public-information completion, connected safe terrain, reciprocal orthogonal tracks, covered-cell privacy, recovery from every reachable fully explored cart state, per-command reload, physical entrance gates and once-only settlement. The browser scenario plays the entire branch with desktop keyboard/buttons and phone taps/long presses, checking actual persisted commands.

`FloorRail` contracts live in `src/types/floor-rail.d.ts`; `floor-rail.ts` owns pure movement and latch rules, `rail-content.ts` owns literal rooms, and the expedition session owns settlement. New rail rooms should retain reversible routing, safe door locations, public solvability and an actual transport problem. Toma and the cart use [original generated artwork](quarry-rescue-artwork.md).
