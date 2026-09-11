# First battle and the Rescuer

The first Boss encounter teaches the existing battle through anchored cards on the actual board. It does not open the Free Play practice-board modal or replace the encounter with a simulated fight.

## Real actions and safe teaching

The coach introduces action points, asks for a move to revealed safe ground, explains ending a turn, and then introduces defense mechanisms and attacking. Accepted movement, end-turn and attack intents advance the relevant steps. Clicking an explanation button does not spend points, advance a turn, change health or insert a gameplay action. Players can skip the guide at any stage and reopen it from **How to fight → Learn on this battlefield**.

The recommendation uses only revealed cells, legal movement costs and public attack warnings. It never asks the player to brace and take a hit. The authored first guardian has a tested safe move and end-turn sequence at one HP with zero shields. If a resumed battle lacks a safe affordable destination, the coach does not highlight End turn as a safe action. Magnetic displacement and an imminent tide reshuffle are conservatively excluded from stationary safety recommendations.

Coach progress belongs to the shared camp as a finite `BattleLesson` value. Campaign and roguelite journals remain independent. Reloading, skipping and reopening change only presentation metadata. The common anchored-card owner handles resize, page scroll, board scroll and teardown for both the first-stage guide and the battle guide.

## Side-story profession

Completing **Knocking in the old mine** grants the **Rescuer** license and the existing first-clear payment of **120 supplies**. The Rescuer cannot be purchased in the shop. The Engineer remains a shop profession; no existing purchase is removed. Already completed rescue saves receive the license on load without replaying the branch or receiving another payment.

| Allocation     | Effect                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Starting tools | 1 probe, no scanner or starting shield                                                                                     |
| Lifeline       | Move 2–4 cells along a straight cardinal corridor                                                                          |
| Valid route    | Every intermediate cell and the destination must be revealed, safe and free of walls, enemies and other blocking occupants |
| Protection     | Gain one shield, capped at two                                                                                             |
| Cost           | Once per floor; one action point in a Boss battle                                                                          |

Lifeline does not reveal unknown ground, cross a mine, create a portal, or automatically enter the next floor. Invalid targets consume nothing. Existing skill-triggered equipment, titles and relics still apply. The portrait, skill icon, dialogue voice and rope animation are distinct from other careers. Reduced motion applies the same accepted outcome without travel animation.

## Readable mechanisms and exits

Winches, turnout levers and brake plates use the same generated props on the board, in controls and in the illustrated guide. Four short picture cards explain clearing the rails, choosing A/B, using the cart to press a brake plate, and bringing Toma back to the starting platform. Control names match the buttons; the guide explicitly explains that the player must be able to walk to a control.

An exit uses the closed-door artwork until its actual floor objective is complete. The transition plays once when the objective changes to complete, then uses the existing open stairway. A cart-triggered opening waits for its travel animation. Reloading an open floor does not replay the opening, and reduced motion shows the final state immediately. This presentation never grants an exit reward or advances the floor.

See [asset prompts and original generated images](rescue-polish-artwork.md). The behavior and browser checks cover exclusive ownership, existing saves, replay, invalid rope targets, action-point costs, one-HP teaching, mouse/keyboard/touch, narrow layouts, guide reopening and animation lifecycle.
