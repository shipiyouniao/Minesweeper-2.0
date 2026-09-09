# Roadmap II: new puzzle modes and boss families

Status: all three mode families approved for [Roadmap II #55](https://github.com/shipiyouniao/minefarer/issues/55); not implemented. Detailed tuning and narrative remain content work. The campaign/shared-camp direction is recorded in [Campaign, shared camp and reusable expedition floors](campaign-and-expedition.md). The umbrella issue uses `enhancement` and `help wanted`; keep progress and corresponding PR links there rather than creating a mandatory issue for every delivery step.

Each family needs an independent Free play ruleset, an exploration adaptation shared by Campaign and Roguelite, and a boss encounter with a distinct tactical objective or decision. Free play must work without a profession, AP or a camp loadout. Changing only the artwork or adding ignorable hints to Classic does not meet that goal. The names below are working titles.

## Numeric clues must identify their own rule

Mixed floors can place an ordinary eight-neighbor mine count beside a Lookout four-ray visible-safe count. Every visible clue therefore owns an explicit semantic kind, independent of the active mode or biome. Persistently distinguish those kinds by shape and symbol; color can reinforce the difference but cannot be the only signal. Standalone modes retain the same treatment so the player does not need to relearn it in a mixed floor.

The following visual directions are proposals to validate at actual phone and desktop cell sizes:

| Clue kind       | Meaning                                                                  | Proposed persistent treatment                                                              |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Classic         | Mines in the eight adjacent cells                                        | Existing plain cell numeral, retaining its familiar number colors.                         |
| Lookout         | Visible safe cells along four orthogonal rays, including the origin once | Numeral within a four-ray sight emblem, with a distinct diamond outline.                   |
| Fleet           | Occupied vessel cells in a scoped row or column                          | Rectangular edge tally with a ship silhouette; fleet lengths use explicit vessel segments. |
| Islands         | Total safe area belonging to one numbered island                         | Numeral in a rounded island/shore badge, marking its anchor role.                          |
| Matrix / Survey | Ordered lengths of consecutive mine runs in a scoped line                | Segmented run-list treatment and a line-scope marker, distinct from Fleet's single total.  |

Inspecting a clue states its meaning and highlights its scope using public information. Keyboard focus and touch inspection provide the same explanation; the persistent emblem remains visible without interaction. Unknown Lookout ray blockers must not leak through inspection highlights. If a future cell legitimately provides two observations, display separately identified badges rather than silently switching the meaning of one number.

Clue typography and emblems scale together, remain distinguishable in grayscale, and survive flags, focus outlines, tool previews and mobile layouts. A mixed Classic + Lookout board is a required interaction and visual acceptance case: the same numeral on adjacent cells must clearly denote different quantities. Combined generation and deduction validation consume each cell's actual clue kind, not one board-wide assumption.

## Lookout / Watchtower Sentinel

### Free play

A revealed safe cell shows how many safe cells are visible along its four orthogonal rays, including itself once. A ray stops before a mine or wall, or at the board boundary. These visibility numbers replace ordinary eight-neighbor mine counts. For example, a clue of five means the origin plus four visible safe cells distributed among its rays; it does not identify their directions individually.

Intersecting observations constrain the possible first blockers on each ray. Marking a hypothesized blocker is a note, not evidence that changes an observation. Open all non-mine cells to win. A seeded generator verifies deductions from the published observations and a safe opening; it cannot assume that the player knows covered clue values. A hypothetical ray inspection highlights its possible extent without disclosing an unknown blocker.

### Exploration and boss

Exploration uses lookout regions, sight-blocking terrain and routes that can be inferred from crossing rays. It inherits physical reach, equipment and safe annotations from the shared floor model. A mixed floor makes the scope of each observation style visible.

The Watchtower Sentinel patrols and turns on a published turn schedule. Its attack reaches visible lanes; its blind side permits counterattacks. Mine barriers and walls influence both deduction and tactical cover. The arena must require routing between useful cover rather than allow standing in a permanently safe adjacent attack square. The sentinel does not need another repeated collect-objects-to-break-a-shield loop.

Telegraphs show confirmed blockers and conservatively mark unknown portions. The actual attack can reveal where it stopped as an intentional turn outcome, but a preview must not reveal hidden mines for free. Changes of facing, illuminated lanes and cover transitions need visible animation. Thinking and cursor movement never advance patrols.

### Main acceptance question

Can players use overlapping visibility observations to make understandable deductions and find an interesting safe route, rather than repeatedly inspect indistinguishable short rays? Validate the puzzle first, then the patrol pressure.

## Fleet / Abyssal Admiral

### Free play

Hazards form a published inventory of straight horizontal or vertical groups, such as one length-four vessel, two length-three vessels and shorter craft. Distinct vessels cannot touch orthogonally or diagonally. Row and column clues report occupied-cell totals, and occasional publicly revealed segments establish orientation. Ordinary adjacent-mine numbers are absent.

The player combines totals, remaining vessel lengths, exclusion borders and known segments to identify the fleet and open safe water. A row total alone is insufficient: the global fleet composition and separation rule resolve otherwise ambiguous placements. Guessed flags do not decrement a supposedly confirmed vessel inventory. Completed vessels are acknowledged only from public deductions or actual disclosed cells. The generated puzzle must be solvable from those public facts.

### Exploration and boss

Exploration adapts the same constraints to navigable waters and floating platforms, with a visible boat carrying the selected profession. Board generation guarantees a traversable route among vessels; the player's movement does not treat a hidden hazard as safe merely because it belongs to a vessel.

The Abyssal Admiral commands an actual fleet rather than one stationary target. The player uses deductions to locate escorts and the flagship, then spends combat actions to fire. Flags remain free hypotheses and cannot deal damage. Defeating a particular escort permanently removes its attack or support function. The objective is to sink the flagship; escort order and whether to bypass an escort are tactical choices.

The target layout remains stable during inference. Hits and wrecks preserve enough original occupancy information for existing fleet clues to remain truthful; movement and wreck collision need one explicit encounter rule before implementation. Weapons, defense and AP use the shared build. The fleet is finite, avoiding endless replacement of destroyed escorts. Distinct launch, impact and sinking sequences make damage and permanent threat removal visible.

### Main acceptance question

Do fleet size and separation constraints create deductions distinct from Survey, and does choosing which escort to disable produce meaningful build-dependent combat? The exploration adaptation requires water/boat presentation, so its asset work belongs in the scope.

## Islands / Archipelago Weaver

### Free play

Each initially visible numbered safe cell anchors one island. Its number is that island's total safe area. Every island has exactly one anchor; islands cannot touch orthogonally. The surrounding hazardous cells form one connected sea, and no two-by-two area may consist entirely of hazards. These area and connectivity constraints replace adjacent-mine numbers.

The player grows islands, identifies separating hazards and checks whether a proposed choice would disconnect the sea or join two anchors. Opening every safe cell wins. Generation must produce a deduction-solvable layout from visible anchors and the published global rules; island area must not be silently confused with mine count.

### Exploration and boss

Exploration uses explicit bridges or ferries between inferred safe islands. These are traversal links, not a change to the puzzle's mine layout. Free play needs no movement links, while Roguelite generation must guarantee enough bridge resources or existing links to reach every required objective. The selected profession and its build remain active.

The Archipelago Weaver encounter centers on connecting and maintaining beacon routes across islands while the boss announces attacks on bridges. Safe island boundaries determine where links can land. The proposed victory condition is sustaining the required connected beacon network for a displayed number of turns, rather than opening another damage window. Combat actions disable a finite set of disruptive guards or interrupt an announced attack; defense helps hold an exposed position and AP supports rebuilding or relocation.

Destroyed links must be recoverable with guaranteed encounter resources. One lost bridge cannot permanently strand the player or make the objective impossible. Bridge construction, telegraphed breaks and the illuminated connected network need physical presentation. Exact bridge costs, guard behavior and beacon requirements remain discussion points.

### Main acceptance question

Does network planning remain enjoyable alongside area deduction, and can the boss pressure the network without creating repetitive rebuilding? This candidate has the largest movement and encounter scope and should follow simpler shared-floor work.

## Proposed priority and boundaries

Deliver all three families. Lookout and Fleet can precede Islands because Islands requires more traversal and objective work. Each family includes the full Free play / authored-floor / generated-floor / boss path; a small isolated demo is a playtest step, not a substitute for that scope.

The eight existing families plus the three approved additions give eleven planned chapter families. Expand the main/side task and shared-reward tables accordingly; narrative order is not fixed yet. Only validated pairs enter the combination catalog: do not automatically combine conflicting clue semantics or incompatible geometry.

Every family requires seeded variation, public-information validation, truthful hints and telegraphs, explicit types, shared equipment and reward integration, three languages, keyboard/mouse/touch interaction, interactive teaching, accessible motion and original boss/mechanism artwork. Campaign alone receives character dialogue. Delivery progress belongs in Roadmap II's checklist and PR table.
