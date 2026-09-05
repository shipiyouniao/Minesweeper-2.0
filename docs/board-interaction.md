# Board interaction and annotations

This update addresses [issue #21](https://github.com/shipiyouniao/Minesweeper-2.0/issues/21). Notes belong to the player's reasoning. Confirmations record information obtained through gameplay. They are distinct in the model, visuals and accessible cell descriptions.

## Marks

| State          | Meaning                                                      | Appearance          | Manual removal |
| -------------- | ------------------------------------------------------------ | ------------------- | -------------- |
| Flag           | The player suspects a mine                                   | Ordinary flag       | Yes            |
| Confirmed mine | A tool or completed mechanism identified a mine              | Gold flag           | No             |
| Triggered mine | The player actually hit this hazard, including shielded hits | Red mine            | No             |
| Confirmed safe | A survey or the other mirror realm proved safety             | Solid green dot     | No             |
| Suspected safe | A player note or unfinished quick-open deduction             | Cyan outlined check | Yes            |

Choose **Note safe** and activate a covered cell, or press **S** on it. Repeat to remove the note. A manual safe note replaces an ordinary flag; a manual flag replaces a safe note. Revealing the cell removes its note. A tool confirmation supersedes either hypothesis. Triggering a mine permanently records that source for this room, even if a later scan covers it.

Notes work in Classic, Twin and Expedition. They never reveal covered numbers, count as flags, establish walkable terrain, grant discovery rewards or become trusted input to the solver. A suspected-safe cell can contain a mine. Mirrored rooms retain their own notes and triggered hazards when switching sides.

## Quick open

Activate **Quick open**, then select a revealed number, or press **C** on it. Classic and Twin also retain their existing repeated-number activation. Adjacent flag count must equal that number. Matching counts do not verify flag correctness.

In Expedition, the command considers only that number's originally covered, unflagged neighbors, excluding walls and occupied terrain. It follows known routes and resolves ordinary reveal actions one at a time. After each reveal, it recomputes reachability: opening a blank region can connect another target. It selects the cheapest currently allowed reveal, breaking ties by board index, making replay deterministic.

Boss reveals pay their existing approach-and-dig AP cost. Moving relic effects, injuries, surveys, collection and once-per-floor triggers continue through the normal action pipeline. The command never ends a turn or switches realms automatically. It stops on a mine hit, a phase change, or when no remaining target is affordable and reachable. Remaining uncertain targets receive removable safe notes. Already confirmed-safe cells keep their stronger confirmation. A repeated no-op command spends nothing.

## Keyboard and mouse

- Arrows and **H/J/K/L** move board focus left/down/up/right. Focus movement spends no AP; it does not move the character.
- **Enter/Space** activates the selected mode. **F** flags, **S** toggles a safe note, **C** quick-opens neighbors.
- Mouse right-click flags on release. Movement beyond eight CSS pixels cancels the whole press, including a drag that returns to its origin. A new right-click works immediately after cancellation.
- Touch/pen long presses keep their existing original-cell capture and scroll cancellation. Right-mouse handling does not replace touch scrolling.
- Notes and quick opening have visible mode buttons, so neither feature requires a keyboard or an ambiguous double-click gesture.

The board captures cancelable right-pointer events and their compatibility mouse events. It also consumes the trailing context menu so one press produces at most one flag. Gestures beginning outside game cells remain outside this handler. Listener teardown, page blur and replacement boards discard pending presses.

### Browser extensions and built-in gestures

Vimium uses `hjkl` for page scrolling and `f` for links. Its **i** insert mode passes keys through until **Esc**; a site exclusion can make that choice persistent. See the [official Vimium keyboard documentation](https://github.com/philc/vimium#keyboard-bindings).

Page event cancellation cannot guarantee control over browser-owned mouse gestures or an extension that intercepts the event before the page. `preventDefault()` cancels an event's page default; it is not a permission to change browser or extension settings. See [MDN's event cancellation documentation](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) and [context-menu behavior](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event).

If a browser still navigates during a right drag, configure a site exception in that browser or gesture extension. **F** and the Flag mode button provide alternatives. This guidance lives under How to play, without recurring warnings or extension detection.

For **Microsoft Edge's built-in gestures**, the reliable fallback is to search Edge Settings for **Mouse gesture** and disable that browser feature. Microsoft documents it as a [browser-controlled feature](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-browser-policies/mousegestureenabled), and its [guidance for right-drawing web applications](https://learn.microsoft.com/en-au/answers/questions/1304696/how-to-turn-off-right-click-drag-on-microsoft-edge) directs users to browser settings. The game does not alter browser policies, settings or extension permissions. Our page-level regression uses Edge 152; it verifies input cancellation, not a globally disabled gesture engine.

## State and maintenance

`Game.safeMarks` stores a bounded list of player notes; `Expedition.triggeredMines` records hit provenance alongside the full `confirmedMines` set. Named contracts remain in `.d.ts` modules. `dungeon-chord.ts` owns pure batch orchestration; `BoardRightClick` owns the browser listener and gesture lifecycle.

Expedition rules revision **3** retires earlier journals using their checkpointed extraction value and preserves camp progress under the [save policy](save-policy.md). No previous gameplay engine is retained. Classic's unchanged rules keep the current session format; the decoder initializes absent note metadata to an empty list, preserving active boards, preferences and records. Twin retains its journal format and replays the new typed intents through its current engine.

Regression coverage exercises false-flag damage, shielded hit provenance, unreachable and AP-limited quick opening, note removal and confirmation, mirrored state, save validation, keyboard shortcuts, native browser right-button sequences and mobile touch scrolling. Browser touch emulation does not replace physical-device testing, and tests of page listeners do not establish compatibility with every installed gesture extension.
