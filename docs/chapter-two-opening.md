# Chapter Two opening: Reedbank Camp and Recollection

This increment begins Chapter Two after the northwest guardian. It adds a regional camp and a playable Recollection facility. The chapter's exploration stages, side stages and final boss remain future content; the opening does not count as one of the planned five exploration stages.

## Following the ferry lead

The guardian's account of a rift at the western old ferry remains the reason for going west. Crossing the cleared gate reaches Reedbank Camp. Nia and the traveler hear the river, discuss the traveler's unease about waking somewhere unfamiliar again, and settle beside the pier. The short exchange uses the existing chibi cast, separate synthesized voices, typewriter text and speaking animations.

The journal objective **A Rest by the River** first points to the new camp, then to the lantern on the pier. Interacting with the lantern plays its ignition and unlocks Recollection. There is no delivery errand, mandatory practice victory or currency payment. Repeating either conversation grants no money and does not reset progress.

The forest camp remains reachable through the pass shortcut. Shops, professions, loadouts, titles, supplies and ordinary milestones use the same `CampSession` and expedition envelope in both camps. Each camp owns its scene, physical facilities and resident positions through the regional camp catalog. The travel checkpoint stores the current camp identity alongside its position. The new field is additive; an existing forest-camp save needs no retirement or compensation.

## Recollection preparation

The lantern opens a dedicated preparation screen. It uses the existing five difficulty choices, a fixed departure dock, illustrated checkboxes and the current shared loadout. Equipment and profession changes remain in the camp's existing service screens.

| Selection             | Unlock                               | Behavior                                                                                |
| --------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| Minesweeper           | Available with the lantern           | Fresh dungeon terrain and distant reachable stairs.                                     |
| Relays                | Clear the tower relay stage          | Solve 2–5 distributed controls and switch them all off to release the exit.             |
| Power routing         | Clear the ridge observatory          | Route a generated network of 2–4 selectors to its required terminal consoles.           |
| Northwest guardian    | Clear Chapter One                    | Eligible for the boss pool.                                                             |
| Other existing bosses | A recorded victory against that boss | Eligible without requiring the player to repeat that victory in a future story chapter. |

At least one exploration family and one boss must be selected. Locked entries are visible but cannot be checked. Difficulty continues to set board size, mine density, floor count, boss checkpoints and reward multiplier through the existing tables. This release does not add a boss-free setting or alter shop prices.

The selected families are shuffled into a seeded rotation. All selected entries can recur; entries outside the selected pool cannot appear. The departure stores canonical copies of both pools with the seed, difficulty and loadout. Reloading rebuilds the same terrain and replays the same accepted actions. Camp configuration cannot edit an active departure.

## Generated mechanisms and combat

Mechanism floors begin with the existing connected dungeon generator. Every control occupies a reachable numbered cell, avoiding the entrance, stairs and wall-adjacent clue ambiguities. Counts, positions, power dependencies and terminal targets vary with the seed. Controls spread across the minefield. If a control occupies a treasure location, the chest is relocated to another reachable cell; mine counts and the three-chest budget stay intact.

Relay counts scale within a randomized range for the board size. Power networks grow as acyclic trees or two independent circuits; at least one selector has an upstream dependency. Every selector's A and B branches lead to a child or a required terminal. Readings persist after switching branches. All approach routes stay traversable, so changing a selection cannot trap the player away from its controls. Terrain is accepted only if the entire generated objective set fits, including the bounded, seed-varying fallback. [Randomness checks](recollection-randomness.md) record the construction rules and reproducible sample audit.

Relays and power routing use the same pure transitions, readiness checks, movement, artwork and animations as Campaign. The exit condition depends on operating the mechanisms, rather than merely placing flags. The generator checks physical accessibility; it does not promise that every random board has a complete deduction-only solution.

Boss checkpoints use the selected boss pool. Ordinary-floor relay, power and rail state is removed before constructing a tactical arena. Combat equipment, relics, vitality, milestones and extraction use the existing expedition implementation. Recollection has no boss arrival dialogue or dialogue replay button; tactical help and the interactive battle lesson remain available.

The lantern animates when starting a memory. The departure is saved before that animation, so closing or reloading during ignition resumes the accepted run. Returning from a completed or extracted memory opens preparation; leaving preparation restores the same physical camp position.

## Existing players

An already running expedition remains in its existing slot. The lantern offers to resume it and requires completing or extracting it before starting a configured Recollection. Campaign attempts stay independent. Recorded boss victories preserve veteran access to the existing roster.

The temporary expedition link remains visible until the player activates the lantern. After activation the camp facility becomes the normal entrance. Existing direct expedition URLs continue to open the original playable session.

## Validation

`tests/recollection.test.ts` covers the camp gate and return routes, resident-safe paths, preserved journals, finite unlock pools, exact replay, mechanism completion over all five sizes and isolation of all eight boss arenas. Existing atlas and portal tests also cover the new camp.

`tests/browser/recollection.mjs` exercises real doorway and lantern clicks, the voiced exchanges, difficulty and pool selection, empty-selection prevention, start/reload/extraction, returning to the regional camp and map location at 390, 1440 and 3840 pixels across Chinese, English and Japanese. It checks image decoding and layout overflow. Accepted-action fixtures reach mechanism floors two and four: their objectives and illustrated help name the actual mechanism, never an authored campaign floor or a nonexistent collectible. Relay-gated stairs retain the shared closed-door artwork. The standard TypeScript 7 and legacy compiler suites and complete pipeline A/B checks still apply.

See [the artwork record](recollection-artwork.md) for generated assets and prompts. Further story stages should build from the ferry lead without turning the new camp into a list of repeated collection errands.

## Screens

The [existing forest camp](screenshots/story-camp-desktop.png) remains available. The new camp adds its own arrival scene and a preparation screen for the pier facility:

![Recollection preparation with illustrated floor and boss choices](images/recollection-preparation.png)

![Nia and the traveler arriving at Reedbank Camp on a phone](images/reed-camp-arrival.png)
