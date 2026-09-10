# Roadmap II: board-based world and story direction

Status: the player structure, long-term scope, protagonist motivation and leyline-knot world foundation are approved and tracked in [Roadmap II #55](https://github.com/shipiyouniao/minefarer/issues/55). Detailed names, chapter ordering, scripts and encounter parameters remain content work. See the [campaign design](campaign-and-expedition.md) and [new mode families](roadmap-2-mode-candidates.md).

## Confirmed direction

- Camp, the overworld and stage selection become explorable Minesweeper boards, rather than remaining a camp dashboard and a list of destinations.
- The existing roguelite becomes **Recollection**, entered through a place in the shared camp. Players choose difficulty and select eligible random board mechanics and bosses. Campaign progress unlocks this content. This supersedes the earlier proposal for a completely campaign-independent roguelite catalog.
- Equipment, professions, titles, supplies, ordinary tasks and achievements remain shared. Campaign and Recollection retain separate attempts and results.
- The protagonist initially wants to return home and gradually develops attachments in the new world. The choice and circumstances of an eventual return remain open.
- The tonal reference is Dragon Quest within a Japanese-style isekai adventure. The project is intended for very long-term development with community code and design contributions. Eleven currently planned boss families are current content scope, not the final extent of the world or an obligation to end the story there.

## Camp and overworld boards

The camp contains physical destinations: the workshop, profession contacts, archive, task-givers and the Recollection entrance. Walking to and interacting with their cells opens the relevant dialogue or detailed panel. Revealed facilities remain usable; visiting a shop must not require solving the same board again.

The proposed camp loop is to explore or complete tasks around its frontier, secure new space and see that space become inhabited. Established camp ground and necessary routes are safe. Revealed buildings, completed tasks and existing purchases must not be hidden or relocked by a reload. Persistent changes and recovery after a failed outing matter more than repeatedly resetting the camp.

The overworld is a persistent map of roads, settlements, ruins, crossings and stage entrances. Revealing a destination makes it known; its authored task prerequisites determine whether the player can enter. Repaired bridges and completed routes remain repaired. Travel shortcuts can use known safe routes so the board interface does not turn routine return trips into repeated clicks.

Camp, overworld and stage cells have different roles and transitions even though they share board presentation, movement, clue semantics and interaction. Entering a building, arriving at a stage entrance and descending to the next stage floor are explicit different outcomes. Player annotations alone cannot complete a task, construct a building or unlock a region.

## Recollection

A camp landmark opens the challenge configuration. Campaign discoveries and task outcomes grant access to board mechanics and boss families. The player selects from the unlocked pool; unselected bosses or mechanics must not be silently inserted. Difficulty sets the challenge parameters. Supported combinations still pass the shared compatibility and generation rules.

The proposed default is a pool selection: each new seed draws floors and encounter choices from the player's checked entries. Preserve that selected pool in the departure snapshot along with the profession, title, equipment and difficulty so a reload cannot change the attempt. Configuration with no eligible content receives a clear explanation before departure. Exact encounter ordering and optional boss-free configurations remain interaction-design details.

Recollection generates new layouts and valid combinations rather than replaying an exact campaign map. Character dialogue is absent; mechanical forecasts, animations and available rules explanations remain. It uses the shared reward and accepted-event systems, with task scope and custom-configuration reward balance made explicit. Training access, new-content unlock pacing and reward amounts belong in the same progression table.

## What a mine is

The ordinary-world hazard is a **leyline knot** (魔结). Magic flowing through the land sometimes accumulates at a hidden, unstable point. Disturbing that location releases a damaging pulse. The ground can look ordinary, which explains why an explorer needs observations and inference rather than eyesight alone.

The protagonist can interpret traces of these disturbances as numbers, but cannot directly identify every knot. Local people have their own surveying methods and instruments. Information kinds therefore remain separate: an eight-neighbor hazard count, a four-ray safe-path reading, a run list, a fleet tally and an island-area clue carry their own persistent symbols. The numeral is the readable result of a specific observation, not a universal quantity that changes meaning without notice.

The working hazard rules should explain the existing interactions:

- A flag records a warning or confirmed location; it does not remove the knot.
- Triggering a pulse does not necessarily dissipate the source. A shield can absorb the pulse while the location remains unsafe, matching the persistent triggered-hazard marker.
- A probe or scan observes the disturbance without walking into it.
- Permanent reclamation would require an authored purification or engineering outcome, separate from merely identifying every hazard. If this changes the map, the transition must update its clues consistently.
- Safe land and inhabited places are possible. Knots occur where local geology, damaged infrastructure, monsters or deliberate interference disturb the flow; the whole setting need not be an uninhabitable wasteland.

This is a default physical explanation, not a requirement to call every dangerous cell in every ruleset the same object. Fleet occupies hazardous water with enemy vessels and uses clearly labeled fleet observations. Islands can represent stable land amid hazardous currents. Lookout's four-ray value measures contiguous safe ground; it is not a literal optical claim that an underground trap blocks ordinary eyesight. Each theme needs a truthful local explanation while retaining an explicit shared hazard and movement contract.

Classic Free play can retain the familiar Minesweeper presentation. Campaign artwork and vocabulary can show magical ground disturbances instead of a modern metal mine without altering the shared rule definitions.

## Narrative direction

The starting story is a displaced outsider seeking a route home, helped by a local guide and drawn into the practical needs of a frontier camp. The main ability is useful but limited: the protagonist can read danger traces, and still needs local knowledge, equipment and companions to act on them.

Build region-sized arcs with their own residents, conflict, investigation, side tasks and resolution. A repaired supply route, a reunited family, a new camp resident or a changed town is a meaningful conclusion even while the larger journey continues. Some bosses are aggressors, some are rivals, and some defend people or obey an outdated duty; their stories need not all end in death or share one corruption explanation.

Do not make repeated fetch-and-report trips the default chapter structure. Each substantial encounter should pose a question, change the situation through playable inference or a mechanism, and leave a visible human or world consequence. Dialogue should reveal a character's particular priorities and react to what the player has done. Ordinary travel can connect encounters; walking between three quest markers is not itself an encounter.

The [tower signal rescue](tower-signal-rescue.md) begins applying this rule: reconnecting a circuit exposes a trapped person's predicament, an optional registry branch preserves a homeward clue, and the rescue adds a speaking camp resident. This does not yet redesign all existing world errands or complete the first chapter.

The first major arc should provide a real answer about the protagonist's arrival and a consequential lead toward home. Later arcs can reveal new places and deepen relationships. Do not repeatedly promise a return portal and invalidate it solely to prolong development. Knowing how to return can create a later decision about responsibilities and attachment; long-term updates do not require permanent narrative stalling.

Recollection can be presented as a reconstruction of the expedition party's experiences. A fictional instrument or practitioner reweaves known regions and opponents into new trials. Its specific name, reward explanation and operator remain to be chosen. Real campaign routes persist, while reconstructed challenges can randomize without claiming that an already rescued settlement has been destroyed again.

## Community and continuing development

Keep the core world rules, clue semantics and character continuity in a small maintained story bible once approved. Community contributions can add side stories, settlements, map sequences, puzzle mechanisms, bosses, artwork and code through the normal review process. New content should have room to tell a complete local story without rewriting the central protagonist's identity or earlier canon.

Provide content submission templates covering the pitch, prerequisites, maps and public-information solutions, mechanics and combinations, rewards, dialogue, localization and asset provenance. Shared engine changes need behavior coverage; authored content needs graph, solvability and interaction validation. Contributor ideas and drafts remain distinguishable from approved canonical content.

Roadmap II tracks the agreed next development program and its PRs in [issue #55](https://github.com/shipiyouniao/minefarer/issues/55), labeled `enhancement` and `help wanted`. Update that issue's checklist and PR table as work lands. Later roadmap issues can cover new arcs or systems; completing one roadmap or story arc does not declare the project finished.
